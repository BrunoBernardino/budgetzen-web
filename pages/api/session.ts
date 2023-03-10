import {
  createSession,
  createVerificationCode,
  getUserByEmail,
  updateSession,
  validateUserAndSession,
  validateVerificationCode,
} from '/lib/data-utils.ts';
import { sendVerifyLoginEmail } from '/lib/providers/postmark.ts';

async function validateSession(request: Request) {
  const { email }: { email: string } = await request.json();

  if (!email) {
    return new Response('Bad Request', { status: 400 });
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await createSession(user);

  if (!session) {
    return new Response('Bad Request', { status: 400 });
  }

  const verificationCode = await createVerificationCode(user, session, 'session');

  await sendVerifyLoginEmail(user.email, verificationCode);

  return new Response(JSON.stringify({ user, session_id: session.id }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function verifySession(request: Request) {
  const { user_id, session_id, code }: { user_id: string; session_id: string; code: string } = await request.json();

  if (!user_id || !session_id || !code) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user, session } = await validateUserAndSession(user_id, session_id, true);

  await validateVerificationCode(user, session, code, 'session');

  session.verified = true;

  await updateSession(session);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function deleteSession(request: Request) {
  const { user_id, session_id }: { user_id: string; session_id: string } = await request.json();

  if (!user_id || !session_id) {
    return new Response('Bad Request', { status: 400 });
  }

  const { session } = await validateUserAndSession(user_id, session_id);

  const yesterday = new Date(new Date().setUTCDate(new Date().getUTCDate() - 1));

  session.expires_at = yesterday;

  await updateSession(session);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function pageAction(request: Request) {
  switch (request.method) {
    case 'POST':
      return validateSession(request);
    case 'PATCH':
      return verifySession(request);
    case 'DELETE':
      return deleteSession(request);
  }

  return new Response('Not Implemented', { status: 501 });
}

export function pageContent() {
  return new Response('Not Implemented', { status: 501 });
}
