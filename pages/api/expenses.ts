import {
  createExpense,
  deleteExpense,
  getAllExpenses,
  getExpensesByMonth,
  getExpensesForLastYear,
  monthRegExp,
  updateExpense,
  validateUserAndSession,
} from '/lib/data-utils.ts';
import { Expense } from '/lib/types.ts';

async function createOrUpdateExpense(request: Request) {
  const { session_id, user_id, description, date, cost, budget, is_recurring, extra, id }: Omit<Expense, 'id'> & {
    session_id: string;
    id?: string;
  } = await request.json();

  if (!session_id || !user_id || !description || !date || !cost || !budget || !extra) {
    return new Response('Bad Request', { status: 400 });
  }

  if ((request.method === 'PATCH' && !id) || (request.method === 'POST' && id)) {
    return new Response('Bad Request', { status: 400 });
  }

  await validateUserAndSession(user_id, session_id);

  if (request.method === 'PATCH') {
    await updateExpense({ id: id!, user_id, description, date, cost, budget, is_recurring, extra });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const newExpense = await createExpense({
    user_id,
    description,
    date,
    cost,
    budget,
    is_recurring,
    extra,
  });

  return new Response(JSON.stringify(newExpense), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

async function deleteExpenseAction(request: Request) {
  const { user_id, session_id, id }: { user_id: string; session_id: string; id: string } = await request.json();

  if (!user_id || !session_id || !id) {
    return new Response('Bad Request', { status: 400 });
  }

  await validateUserAndSession(user_id, session_id);

  await deleteExpense(id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function pageAction(request: Request) {
  switch (request.method) {
    case 'POST':
    case 'PATCH':
      return createOrUpdateExpense(request);
    case 'DELETE':
      return deleteExpenseAction(request);
  }

  return new Response('Not Implemented', { status: 501 });
}

export async function pageContent(request: Request, _match: URLPatternResult) {
  const urlSearchParams = new URL(request.url).searchParams;
  const sessionId = urlSearchParams.get('session_id');
  const userId = urlSearchParams.get('user_id');
  const month = urlSearchParams.get('month');

  if (!sessionId || !userId || !month || (!monthRegExp.test(month) && month !== 'all' && month !== 'year')) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user } = await validateUserAndSession(userId, sessionId);

  let expenses: Expense[] = [];

  if (month === 'all') {
    expenses = await getAllExpenses(user.id);
  } else if (month === 'year') {
    expenses = await getExpensesForLastYear(user.id);
  } else {
    expenses = await getExpensesByMonth(user.id, month);
  }

  return new Response(JSON.stringify(expenses), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
