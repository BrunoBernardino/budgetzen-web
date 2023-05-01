import {
  createSession,
  createUser,
  createVerificationCode,
  deleteUser,
  getSessionById,
  getUserByEmail,
  getUserById,
  updateSession,
  updateUser,
  validateUserAndSession,
  validateVerificationCode,
} from '/lib/data-utils.ts';
import { EncryptedData } from '/lib/types.ts';
import {
  sendUpdateEmailInProviderEmail,
  sendVerifyDeleteAccountEmail,
  sendVerifyUpdateEmailEmail,
  sendVerifyUpdatePasswordEmail,
} from '/lib/providers/postmark.ts';
import { SupportedCurrencySymbol, validateEmail } from '/public/ts/utils.ts';

async function createUserAction(request: Request) {
  const { email, encrypted_key_pair }: { email: string; encrypted_key_pair: EncryptedData } = await request.json();

  if (!email || !encrypted_key_pair) {
    return new Response('Bad Request', { status: 400 });
  }

  if (!validateEmail(email)) {
    return new Response('Bad Request', { status: 400 });
  }

  const existingUserByEmail = await getUserByEmail(email);

  if (existingUserByEmail) {
    return new Response('Bad Request', { status: 400 });
  }

  const user = await createUser(email, encrypted_key_pair);

  if (!user) {
    return new Response('Bad Request', { status: 400 });
  }

  const session = await createSession(user, true);

  if (!session) {
    return new Response('Bad Request', { status: 400 });
  }

  return new Response(JSON.stringify({ user, session_id: session.id }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function updateUserAction(request: Request) {
  const { user_id, session_id, email, currency, encrypted_key_pair, code }: {
    user_id: string;
    session_id: string;
    email?: string;
    currency?: SupportedCurrencySymbol;
    encrypted_key_pair?: EncryptedData;
    code?: string;
  } = await request.json();

  if (!user_id || !session_id) {
    return new Response('Bad Request', { status: 400 });
  }

  if (!email && !encrypted_key_pair && !currency) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user, session } = await validateUserAndSession(user_id, session_id);

  if (!code) {
    if (currency) {
      user.extra.currency = currency;

      await updateUser(user);
    } else if (email) {
      const existingUserByEmail = await getUserByEmail(email);

      if (existingUserByEmail) {
        return new Response('Bad Request', { status: 400 });
      }
    }

    const verificationCode = await createVerificationCode(user, session, 'user-update');

    if (email) {
      await sendVerifyUpdateEmailEmail(user.email, verificationCode);
    }
    if (encrypted_key_pair) {
      await sendVerifyUpdatePasswordEmail(user.email, verificationCode);
    }
  } else {
    await validateVerificationCode(user, session, code, 'user-update');

    const oldEmail = user.email;

    if (email) {
      user.email = email;
    }

    if (encrypted_key_pair) {
      user.encrypted_key_pair = encrypted_key_pair;
    }

    await updateUser(user);

    if (email && (user.subscription.external.stripe || user.subscription.external.paypal) && email !== oldEmail) {
      await sendUpdateEmailInProviderEmail(oldEmail, email);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function deleteUserAction(request: Request) {
  const { user_id, session_id, code }: { user_id: string; session_id: string; code?: string } = await request.json();

  if (!user_id || !session_id) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user, session } = await validateUserAndSession(user_id, session_id);

  if (!code) {
    const verificationCode = await createVerificationCode(user, session, 'user-delete');

    await sendVerifyDeleteAccountEmail(user.email, verificationCode);
  } else {
    await validateVerificationCode(user, session, code, 'user-delete');

    await deleteUser(user.id);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function pageAction(request: Request) {
  switch (request.method) {
    case 'POST':
      return createUserAction(request);
    case 'PATCH':
      return updateUserAction(request);
    case 'DELETE':
      return deleteUserAction(request);
  }

  return new Response('Not Implemented', { status: 501 });
}

export async function pageContent(request: Request) {
  const urlSearchParams = new URL(request.url).searchParams;
  const sessionId = urlSearchParams.get('session_id');
  const userId = urlSearchParams.get('user_id');
  const email = urlSearchParams.get('email');

  if (!sessionId || !userId || !email) {
    return new Response('Bad Request', { status: 400 });
  }

  const user = await getUserById(userId);

  if (!user || user.email !== email) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await getSessionById(sessionId);

  if (!session) {
    return new Response('Not Found', { status: 404 });
  }

  session.last_seen_at = new Date();

  await updateSession(session);

  return new Response(JSON.stringify(user), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
