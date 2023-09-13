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
import { EncryptedData, User } from '/lib/types.ts';
import {
  sendUpdateEmailInProviderEmail,
  sendVerifyDeleteAccountEmail,
  sendVerifyUpdateEmailEmail,
  sendVerifyUpdatePasswordEmail,
} from '/lib/providers/brevo.ts';
import { SupportedCurrencySymbol, validateEmail } from '/public/ts/utils.ts';
import { PAYPAL_CUSTOMER_URL, STRIPE_CUSTOMER_URL } from '/lib/utils.ts';
import { createCustomerPortalSession } from '/lib/providers/stripe.ts';

async function createUserAction(request: Request) {
  const { email, encrypted_key_pair }: { email: string; encrypted_key_pair: EncryptedData } = await request.json();

  const lowercaseEmail = (email || '').toLocaleLowerCase().trim();

  if (!lowercaseEmail || !encrypted_key_pair) {
    return new Response('Bad Request', { status: 400 });
  }

  if (!validateEmail(lowercaseEmail)) {
    return new Response('Bad Request', { status: 400 });
  }

  const existingUserByEmail = await getUserByEmail(lowercaseEmail);

  if (existingUserByEmail) {
    return new Response('Bad Request', { status: 400 });
  }

  const user = await createUser(lowercaseEmail, encrypted_key_pair);

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

  const lowercaseEmail = (email || '').toLocaleLowerCase().trim();

  if (!lowercaseEmail && !encrypted_key_pair && !currency) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user, session } = await validateUserAndSession(user_id, session_id);

  if (!code) {
    if (currency) {
      user.extra.currency = currency;

      await updateUser(user);
    } else if (lowercaseEmail) {
      const existingUserByEmail = await getUserByEmail(lowercaseEmail);

      if (existingUserByEmail) {
        return new Response('Bad Request', { status: 400 });
      }
    }

    const verificationCode = await createVerificationCode(user, session, 'user-update');

    if (lowercaseEmail) {
      await sendVerifyUpdateEmailEmail(user.email, verificationCode);
    }
    if (encrypted_key_pair) {
      await sendVerifyUpdatePasswordEmail(user.email, verificationCode);
    }
  } else {
    await validateVerificationCode(user, session, code, 'user-update');

    const oldEmail = user.email;

    if (lowercaseEmail) {
      user.email = lowercaseEmail;
    }

    if (encrypted_key_pair) {
      user.encrypted_key_pair = encrypted_key_pair;
    }

    await updateUser(user);

    if (
      lowercaseEmail && (user.subscription.external.stripe || user.subscription.external.paypal) &&
      lowercaseEmail !== oldEmail
    ) {
      await sendUpdateEmailInProviderEmail(oldEmail, lowercaseEmail);
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

  let customerPortalUrl = '';

  if (user.subscription.external.paypal) {
    customerPortalUrl = PAYPAL_CUSTOMER_URL;
  } else if (user.subscription.external.stripe) {
    customerPortalUrl = STRIPE_CUSTOMER_URL;

    if (user.subscription.external.stripe.user_id) {
      try {
        customerPortalUrl = await createCustomerPortalSession(user.subscription.external.stripe.user_id);
      } catch (error) {
        console.error(`Failed to create custom Stripe customer portal URL: ${error}`);
        console.log(error);
      }
    }
  }

  const finalResult: User & { customerPortalUrl: string } = { ...user, customerPortalUrl };

  return new Response(JSON.stringify(finalResult), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
