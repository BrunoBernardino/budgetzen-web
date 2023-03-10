import {
  createBudget,
  deleteBudget,
  getAllBudgets,
  getBudgetsByMonth,
  monthRegExp,
  updateBudget,
  validateUserAndSession,
} from '/lib/data-utils.ts';
import { Budget } from '/lib/types.ts';

async function createOrUpdateBudget(request: Request) {
  const { session_id, user_id, name, month, value, extra, id }: Omit<Budget, 'id'> & {
    session_id: string;
    id?: string;
  } = await request.json();

  if (!session_id || !user_id || !name || !month || !extra) {
    return new Response('Bad Request', { status: 400 });
  }

  if ((request.method === 'PATCH' && !id) || (request.method === 'POST' && id)) {
    return new Response('Bad Request', { status: 400 });
  }

  await validateUserAndSession(user_id, session_id);

  if (request.method === 'PATCH') {
    await updateBudget({ id: id!, user_id, name, value, extra });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const newBudget = await createBudget({
    user_id,
    name,
    month,
    value,
    extra,
  });

  return new Response(JSON.stringify(newBudget), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

async function deleteBudgetAction(request: Request) {
  const { user_id, session_id, id }: { user_id: string; session_id: string; id: string } = await request.json();

  if (!user_id || !session_id || !id) {
    return new Response('Bad Request', { status: 400 });
  }

  await validateUserAndSession(user_id, session_id);

  await deleteBudget(id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function pageAction(request: Request) {
  switch (request.method) {
    case 'POST':
    case 'PATCH':
      return createOrUpdateBudget(request);
    case 'DELETE':
      return deleteBudgetAction(request);
  }

  return new Response('Not Implemented', { status: 501 });
}

export async function pageContent(request: Request, _match: URLPatternResult) {
  const urlSearchParams = new URL(request.url).searchParams;
  const sessionId = urlSearchParams.get('session_id');
  const userId = urlSearchParams.get('user_id');
  const month = urlSearchParams.get('month');

  if (!sessionId || !userId || !month || (!monthRegExp.test(month) && month !== 'all')) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user } = await validateUserAndSession(userId, sessionId);

  const events = await (month === 'all' ? getAllBudgets(user.id) : getBudgetsByMonth(user.id, month));

  return new Response(JSON.stringify(events), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
