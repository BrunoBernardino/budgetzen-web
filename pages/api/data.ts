import {
  createVerificationCode,
  deleteAllBudgets,
  deleteAllExpenses,
  importUserData,
  validateUserAndSession,
  validateVerificationCode,
} from '/lib/data-utils.ts';
import { sendVerifyDeleteDataEmail } from '/lib/providers/brevo.ts';
import { Budget, Expense } from '/lib/types.ts';

async function importDataAction(request: Request) {
  const { user_id, session_id, budgets, expenses }: {
    user_id: string;
    session_id: string;
    budgets: Omit<Budget, 'id' | 'user_id'>[];
    expenses: Omit<Expense, 'id' | 'user_id'>[];
  } = await request.json();

  if (!user_id || !session_id || !budgets || !expenses) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user } = await validateUserAndSession(user_id, session_id);

  await importUserData(user.id, budgets, expenses);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function deleteDataAction(request: Request) {
  const { user_id, session_id, code }: { user_id: string; session_id: string; code?: string } = await request.json();

  if (!user_id || !session_id) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user, session } = await validateUserAndSession(user_id, session_id);

  if (!code) {
    const verificationCode = await createVerificationCode(user, session, 'data-delete');

    await sendVerifyDeleteDataEmail(user.email, verificationCode);
  } else {
    await validateVerificationCode(user, session, code, 'data-delete');

    await deleteAllBudgets(user.id);
    await deleteAllExpenses(user.id);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function pageAction(request: Request) {
  switch (request.method) {
    case 'POST':
      return importDataAction(request);
    case 'DELETE':
      return deleteDataAction(request);
  }

  return new Response('Not Implemented', { status: 501 });
}

export function pageContent() {
  return new Response('Not Implemented', { status: 501 });
}
