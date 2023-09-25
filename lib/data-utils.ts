import Database, { sql } from './interfaces/database.ts';
import { Budget, Expense, User, UserSession, VerificationCode } from './types.ts';
import { generateRandomCode, IS_UNSAFE_SELF_HOSTED, splitArrayInChunks } from './utils.ts';

const db = new Database();

export const monthRegExp = new RegExp(/^\d{4}\-\d{2}$/);

export async function getUserByEmail(email: string) {
  const lowercaseEmail = email.toLowerCase().trim();

  const user = (await db.query<User>(sql`SELECT * FROM "budgetzen_users" WHERE "email" = $1 LIMIT 1`, [
    lowercaseEmail,
  ]))[0];

  return user;
}

export async function getUserById(id: string) {
  const user = (await db.query<User>(sql`SELECT * FROM "budgetzen_users" WHERE "id" = $1 LIMIT 1`, [
    id,
  ]))[0];

  return user;
}

export async function createUser(email: User['email'], encryptedKeyPair: User['encrypted_key_pair']) {
  const trialDays = IS_UNSAFE_SELF_HOSTED ? 30_000 : 30;
  const now = new Date();
  const trialEndDate = new Date(new Date().setUTCDate(new Date().getUTCDate() + trialDays));

  const subscription: User['subscription'] = {
    external: {},
    expires_at: trialEndDate.toISOString(),
    updated_at: now.toISOString(),
  };

  const newUser = (await db.query<User>(
    sql`INSERT INTO "budgetzen_users" (
      "email",
      "subscription",
      "status",
      "encrypted_key_pair",
      "extra"
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      email,
      JSON.stringify(subscription),
      IS_UNSAFE_SELF_HOSTED ? 'active' : 'trial',
      encryptedKeyPair,
      JSON.stringify({}),
    ],
  ))[0];

  return newUser;
}

export async function updateUser(user: User) {
  await db.query(
    sql`UPDATE "budgetzen_users" SET
        "email" = $2,
        "subscription" = $3,
        "status" = $4,
        "encrypted_key_pair" = $5,
        "extra" = $6
      WHERE "id" = $1`,
    [
      user.id,
      user.email,
      JSON.stringify(user.subscription),
      user.status,
      user.encrypted_key_pair,
      JSON.stringify(user.extra),
    ],
  );
}

export async function deleteUser(userId: string) {
  await db.query(
    sql`DELETE FROM "budgetzen_user_sessions" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );

  await db.query(
    sql`DELETE FROM "budgetzen_verification_codes" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );

  await db.query(
    sql`DELETE FROM "budgetzen_budgets" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );

  await db.query(
    sql`DELETE FROM "budgetzen_expenses" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );

  await db.query(
    sql`DELETE FROM "budgetzen_users" WHERE "id" = $1`,
    [
      userId,
    ],
  );
}

export async function getSessionById(id: string) {
  const session = (await db.query<UserSession>(
    sql`SELECT * FROM "budgetzen_user_sessions" WHERE "id" = $1 AND "expires_at" > now() LIMIT 1`,
    [
      id,
    ],
  ))[0];

  return session;
}

export async function createSession(user: User, isNewUser = false) {
  // Add new user session to the db
  const oneMonthFromToday = new Date(new Date().setUTCMonth(new Date().getUTCMonth() + 1));

  const newSession: Omit<UserSession, 'id' | 'created_at'> = {
    user_id: user.id,
    expires_at: oneMonthFromToday,
    last_seen_at: new Date(),
    verified: isNewUser,
  };

  const newUserSessionResult = (await db.query<UserSession>(
    sql`INSERT INTO "budgetzen_user_sessions" (
      "user_id",
      "expires_at",
      "verified",
      "last_seen_at"
    ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [
      newSession.user_id,
      newSession.expires_at,
      newSession.verified,
      newSession.last_seen_at,
    ],
  ))[0];

  return newUserSessionResult;
}

export async function updateSession(session: UserSession) {
  await db.query(
    sql`UPDATE "budgetzen_user_sessions" SET
        "expires_at" = $2,
        "verified" = $3,
        "last_seen_at" = $4
      WHERE "id" = $1`,
    [
      session.id,
      session.expires_at,
      session.verified,
      session.last_seen_at,
    ],
  );
}

export async function validateUserAndSession(userId: string, sessionId: string, acceptUnverifiedSession = false) {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error('Not Found');
  }

  const session = await getSessionById(sessionId);

  if (!session || session.user_id !== user.id || (!session.verified && !acceptUnverifiedSession)) {
    throw new Error('Not Found');
  }

  const oneMonthFromToday = new Date(new Date().setUTCMonth(new Date().getUTCMonth() + 1));

  session.last_seen_at = new Date();
  session.expires_at = oneMonthFromToday;

  await updateSession(session);

  return { user, session };
}

export async function createVerificationCode(
  user: User,
  session: UserSession,
  type: VerificationCode['verification']['type'],
) {
  const inThirtyMinutes = new Date(new Date().setUTCMinutes(new Date().getUTCMinutes() + 30));

  const code = generateRandomCode();

  const newVerificationCode: Omit<VerificationCode, 'id' | 'created_at'> = {
    user_id: user.id,
    code,
    expires_at: inThirtyMinutes,
    verification: {
      id: session.id,
      type,
    },
  };

  await db.query(
    sql`INSERT INTO "budgetzen_verification_codes" (
      "user_id",
      "code",
      "expires_at",
      "verification"
    ) VALUES ($1, $2, $3, $4)
      RETURNING "id"`,
    [
      newVerificationCode.user_id,
      newVerificationCode.code,
      newVerificationCode.expires_at,
      JSON.stringify(newVerificationCode.verification),
    ],
  );

  return code;
}

export async function validateVerificationCode(
  user: User,
  session: UserSession,
  code: string,
  type: VerificationCode['verification']['type'],
) {
  const verificationCode = (await db.query<VerificationCode>(
    sql`SELECT * FROM "budgetzen_verification_codes"
      WHERE "user_id" = $1 AND
        "code" = $2 AND
        "verification" ->> 'type' = $3 AND
        "verification" ->> 'id' = $4 AND 
        "expires_at" > now()
      LIMIT 1`,
    [
      user.id,
      code,
      type,
      session.id,
    ],
  ))[0];

  if (verificationCode) {
    await db.query(
      sql`DELETE FROM "budgetzen_verification_codes" WHERE "id" = $1`,
      [
        verificationCode.id,
      ],
    );
  } else {
    throw new Error('Not Found');
  }
}

export async function getAllBudgets(userId: string) {
  const budgets = await db.query<Budget>(
    sql`SELECT * FROM "budgetzen_budgets"
      WHERE "user_id" = $1
      ORDER BY "month" DESC, "id" DESC`,
    [
      userId,
    ],
  );

  return budgets;
}

export async function getBudgetsByMonth(userId: string, month: string) {
  const budgets = await db.query<Budget>(
    sql`SELECT * FROM "budgetzen_budgets"
      WHERE "user_id" = $1 AND
        "month" = $2
      ORDER BY "month" DESC, "id" DESC`,
    [
      userId,
      month,
    ],
  );

  return budgets;
}

export async function createBudget(budget: Omit<Budget, 'id'>) {
  const newBudget = (await db.query<Budget>(
    sql`INSERT INTO "budgetzen_budgets" (
      "user_id",
      "name",
      "month",
      "value",
      "extra"
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [
      budget.user_id,
      budget.name,
      budget.month,
      budget.value,
      JSON.stringify(budget.extra),
    ],
  ))[0];

  return newBudget;
}

// Don't allow updating a budget's month
export async function updateBudget(budget: Omit<Budget, 'month'> & { month?: Budget['month'] }) {
  await db.query(
    sql`UPDATE "budgetzen_budgets" SET
        "name" = $2,
        "value" = $3,
        "extra" = $4
      WHERE "id" = $1`,
    [
      budget.id,
      budget.name,
      budget.value,
      JSON.stringify(budget.extra),
    ],
  );
}

export async function deleteBudget(budgetId: string) {
  await db.query(
    sql`DELETE FROM "budgetzen_budgets" WHERE "id" = $1`,
    [
      budgetId,
    ],
  );
}

export async function deleteAllBudgets(userId: string) {
  await db.query(
    sql`DELETE FROM "budgetzen_budgets" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );
}

export async function getAllExpenses(userId: string) {
  const expenses = await db.query<Expense>(
    sql`SELECT * FROM "budgetzen_expenses"
      WHERE "user_id" = $1
      ORDER BY "date" DESC, "id" DESC`,
    [
      userId,
    ],
  );

  return expenses;
}

export async function getExpensesByMonth(userId: string, month: string) {
  const expenses = await db.query<Expense>(
    sql`SELECT * FROM "budgetzen_expenses"
      WHERE "user_id" = $1 AND
        "date" >= '${month}-01' AND
        "date" <= '${month}-31'
      ORDER BY "date" DESC, "id" DESC`,
    [
      userId,
    ],
  );

  return expenses;
}

export async function getExpensesForLastYear(userId: string) {
  const twelveMonthsAgoMonth = new Date(new Date().setUTCMonth(new Date().getUTCMonth() - 12)).toISOString().substring(
    0,
    7,
  );
  const currentMonth = new Date().toISOString().substring(0, 7);

  const expenses = await db.query<Expense>(
    sql`SELECT * FROM "budgetzen_expenses"
      WHERE "user_id" = $1 AND
        "date" >= '${twelveMonthsAgoMonth}-01' AND
        "date" <= '${currentMonth}-31'
      ORDER BY "date" DESC, "id" DESC`,
    [
      userId,
    ],
  );

  return expenses;
}

export async function createExpense(expense: Omit<Expense, 'id'>) {
  const newExpense = (await db.query<Expense>(
    sql`INSERT INTO "budgetzen_expenses" (
      "user_id",
      "cost",
      "description",
      "budget",
      "date",
      "is_recurring",
      "extra"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      expense.user_id,
      expense.cost,
      expense.description,
      expense.budget,
      expense.date,
      expense.is_recurring,
      JSON.stringify(expense.extra),
    ],
  ))[0];

  return newExpense;
}

export async function updateExpense(expense: Expense) {
  await db.query(
    sql`UPDATE "budgetzen_expenses" SET
        "cost" = $2,
        "description" = $3,
        "budget" = $4,
        "date" = $5,
        "is_recurring" = $6,
        "extra" = $7
      WHERE "id" = $1`,
    [
      expense.id,
      expense.cost,
      expense.description,
      expense.budget,
      expense.date,
      expense.is_recurring,
      JSON.stringify(expense.extra),
    ],
  );
}

export async function deleteExpense(expenseId: string) {
  await db.query(
    sql`DELETE FROM "budgetzen_expenses" WHERE "id" = $1`,
    [
      expenseId,
    ],
  );
}

export async function deleteAllExpenses(userId: string) {
  await db.query(
    sql`DELETE FROM "budgetzen_expenses" WHERE "user_id" = $1`,
    [
      userId,
    ],
  );
}

export async function importUserData(
  userId: string,
  budgets: Omit<Budget, 'id' | 'user_id'>[],
  expenses: Omit<Expense, 'id' | 'user_id'>[],
) {
  const addBudgetChunks = splitArrayInChunks(
    budgets,
    1000, // import in transactions of 1000 budgets each
  );

  for (const budgetsToAdd of addBudgetChunks) {
    await db.query(sql`BEGIN;`);

    for (const budget of budgetsToAdd) {
      await createBudget({ ...budget, user_id: userId });
    }

    await db.query(sql`COMMIT;`);
  }

  const addExpenseChunks = splitArrayInChunks(
    expenses,
    1000, // import in transactions of 1000 expenses each
  );

  for (const expensesToAdd of addExpenseChunks) {
    await db.query(sql`BEGIN;`);

    for (const expense of expensesToAdd) {
      await createExpense({ ...expense, user_id: userId });
    }

    await db.query(sql`COMMIT;`);
  }
}
