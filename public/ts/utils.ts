import { Budget, Expense, KeyPair, User } from '/lib/types.ts';
import Encryption from './encryption.ts';
import LocalData, { StoredSession } from './local-data.ts';

declare global {
  // deno-lint-ignore no-var
  var app: App;
  // deno-lint-ignore no-var
  var Swal: any;
}

export interface App {
  STRIPE_MONTHLY_URL: string;
  STRIPE_YEARLY_URL: string;
  isLoggedIn: boolean;
  showLoading: () => void;
  hideLoading: () => void;
  doLogout?: () => void;
}

interface CachedData {
  expenses: Expense[];
}

const CACHED_DATA: CachedData = { expenses: [] };

export function showValidSessionElements() {
  const elementsToShow = document.querySelectorAll('[data-has-valid-session]');
  const elementsToHide = document.querySelectorAll('[data-has-invalid-session]');

  elementsToShow.forEach((element) => element.classList.remove('hidden'));
  elementsToHide.forEach((element) => element.classList.add('hidden'));
}

export function hideValidSessionElements() {
  const elementsToShow = document.querySelectorAll('[data-has-invalid-session]');
  const elementsToHide = document.querySelectorAll('[data-has-valid-session]');

  elementsToShow.forEach((element) => element.classList.remove('hidden'));
  elementsToHide.forEach((element) => element.classList.add('hidden'));
}

export async function checkForValidSession() {
  const isUserLoggedIn = isLoggedIn();

  if (isUserLoggedIn) {
    globalThis.app.isLoggedIn = true;
    showValidSessionElements();

    const user = await getUser();

    if (user?.status === 'inactive') {
      showNotification('Your trial has expired!', 'error');

      // Give people some time to logout or export
      setTimeout(() => {
        globalThis.location.href = '/pricing';
      }, 10000);
    }

    return user;
  }
}

export function showNotification(message: string, type = 'success') {
  const { Swal } = globalThis;

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: type === 'success' ? 2500 : 0,
    timerProgressBar: type === 'success',
    didOpen: (toast: any) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: type,
    title: message,
  });
}

export function doLogout() {
  const { Swal } = globalThis;

  try {
    LocalData.clear();
    hideValidSessionElements();

    Swal.fire('Alright!', 'No idea who you are right now.', 'success');
    return true;
  } catch (error) {
    Swal.fire(
      'Something went wrong!',
      `Uh oh! Something wrong happened: ${error && (error as Error).message}`,
      'error',
    );
  }

  return false;
}

if (globalThis.app && !globalThis.app.doLogout) {
  globalThis.app.doLogout = doLogout;
}

export function isLoggedIn() {
  try {
    const session = LocalData.get('session');
    if (session) {
      return true;
    }
  } catch (_error) {
    // Do nothing
  }

  return false;
}

let cachedCryptoKey: CryptoKey;

async function getCryptoKey(keyPair: KeyPair) {
  if (cachedCryptoKey) {
    return cachedCryptoKey;
  }

  const decryptionKey = await Encryption.deriveKey(keyPair.publicKeyJwk, keyPair.privateKeyJwk);

  cachedCryptoKey = decryptionKey;

  return decryptionKey;
}

export const commonRequestHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Accept': 'application/json; charset=utf-8',
};

async function getUser() {
  try {
    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const searchParams = new URLSearchParams();

    searchParams.set('session_id', session.sessionId);
    searchParams.set('user_id', session.userId);
    searchParams.set('email', session.email);

    const response = await fetch(`/api/user?${searchParams.toString()}`, { method: 'GET', headers });
    const user = (await response.json()) as User & { customerPortalUrl: string };

    return user;
  } catch (_error) {
    // Do nothing
  }

  LocalData.clear();

  return null;
}

export function getOtherAccounts() {
  try {
    const session = LocalData.get('session')!;

    return session.otherSessions?.map((otherSession) => ({
      email: otherSession.email,
    })) || [];
  } catch (_error) {
    // Do nothing
  }

  return [];
}

export function swapAccount(newEmail: string) {
  try {
    const session = LocalData.get('session')!;

    const foundSession = session.otherSessions?.find((otherSession) => otherSession.email === newEmail);

    if (foundSession) {
      const otherSessions = [...(session.otherSessions || [])].filter((otherSession) =>
        otherSession.email !== foundSession.email
      );

      otherSessions.unshift(session);

      const newSession: StoredSession = {
        ...foundSession,
        otherSessions,
      };

      LocalData.set('session', newSession);

      globalThis.location.reload();
    }
  } catch (_error) {
    // Do nothing
  }

  return [];
}

export async function validateLogin(email: string, password: string) {
  const { Swal } = globalThis;

  let existingSession: StoredSession | null = null;

  try {
    existingSession = LocalData.get('session');
  } catch (_error) {
    // Do nothing
  }

  try {
    const headers = commonRequestHeaders;

    const passwordKey = await Encryption.getAuthKey(password);

    const lowercaseEmail = (email || '').toLocaleLowerCase().trim();

    const body: { email: string } = {
      email: lowercaseEmail,
    };

    const response = await fetch('/api/session', { method: 'POST', headers, body: JSON.stringify(body) });
    const { session_id: sessionId } = (await response.json()) as { session_id: string };

    globalThis.app.hideLoading();

    const { value: code } = await Swal.fire({
      template: '#verification-code-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      preConfirm: () => {
        const codeValue = (document.getElementById('verification-code-input') as HTMLInputElement).value;

        if (!codeValue) {
          showNotification('You need to submit a code!', 'error');
          return false;
        }

        return codeValue;
      },
      willOpen: () => {
        (document.getElementById('verification-code-input') as HTMLInputElement).value = '';
      },
    });

    globalThis.app.showLoading();

    const verificationBody: { email: string; session_id: string; code: string } = {
      email: lowercaseEmail,
      session_id: sessionId,
      code,
    };

    const verificationResponse = await fetch('/api/session', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(verificationBody),
    });
    const { user, success } = (await verificationResponse.json()) as { user: User; success: boolean };

    if (!user || !success) {
      throw new Error('Failed code verification.');
    }

    let keyPair: KeyPair;

    try {
      keyPair = JSON.parse(await Encryption.decrypt(user.encrypted_key_pair, passwordKey));
    } catch (error) {
      console.log(error);
      await fetch('/api/session', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ user_id: user.id, session_id: sessionId }),
      });
      throw new Error('Failed email/password combination.');
    }

    const otherSessions = [...(existingSession?.otherSessions || [])];

    if (existingSession && existingSession.email !== lowercaseEmail) {
      otherSessions.unshift(existingSession);
    }

    const session: StoredSession = {
      sessionId,
      userId: user.id,
      email: lowercaseEmail,
      keyPair,
      otherSessions,
    };

    LocalData.set('session', session);

    checkForValidSession();

    return { success: true };
  } catch (error) {
    console.log(error);

    LocalData.clear();

    return { success: false, error };
  }
}

export async function createAccount(email: string, password: string) {
  let existingSession: StoredSession | null = null;

  try {
    existingSession = LocalData.get('session');
  } catch (_error) {
    // Do nothing
  }

  try {
    const headers = commonRequestHeaders;

    const passwordKey = await Encryption.getAuthKey(password);
    const keyPair = await Encryption.generateKeyPair();
    const encryptedKeyPair = await Encryption.encrypt(JSON.stringify(keyPair), passwordKey);

    const lowercaseEmail = (email || '').toLocaleLowerCase().trim();

    const body: { email: string; encrypted_key_pair: string } = {
      email: lowercaseEmail,
      encrypted_key_pair: encryptedKeyPair,
    };

    const response = await fetch('/api/user', { method: 'POST', headers, body: JSON.stringify(body) });
    const { user, session_id: sessionId } = (await response.json()) as { user: User; session_id: string };

    if (!user) {
      throw new Error('Failed to create user. Try logging in instead.');
    }

    const otherSessions = [...(existingSession?.otherSessions || [])];

    if (existingSession && existingSession.email !== lowercaseEmail) {
      otherSessions.unshift(existingSession);
    }

    const session: StoredSession = {
      sessionId,
      userId: user.id,
      email: lowercaseEmail,
      keyPair,
      otherSessions,
    };

    LocalData.set('session', session);

    checkForValidSession();

    return { success: true };
  } catch (error) {
    console.log(error);

    LocalData.clear();

    return { success: false, error };
  }
}

export async function fetchBudgets(month: string) {
  try {
    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const searchParams = new URLSearchParams();
    searchParams.set('session_id', session.sessionId);
    searchParams.set('user_id', session.userId);
    searchParams.set('month', month);

    const response = await fetch(`/api/budgets?${searchParams.toString()}`, { method: 'GET', headers });
    const budgets = (await response.json()) as Budget[];

    if (!budgets) {
      throw new Error('Failed to fetch budgets');
    }

    const cryptoKey = await getCryptoKey(session.keyPair);

    for (const budget of budgets) {
      budget.name = await Encryption.decrypt(budget.name, cryptoKey);
      budget.value = await Encryption.decrypt(budget.value, cryptoKey);
    }

    const sortedBudgets = budgets.sort(sortByName);

    return sortedBudgets;
  } catch (error) {
    const { Swal } = globalThis;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong fetching budgets.',
    });

    console.error(error);
  }

  return [];
}

export async function fetchExpenses(month: string) {
  try {
    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const searchParams = new URLSearchParams();
    searchParams.set('session_id', session.sessionId);
    searchParams.set('user_id', session.userId);
    searchParams.set('month', month);

    const response = await fetch(`/api/expenses?${searchParams.toString()}`, { method: 'GET', headers });
    const expenses = (await response.json()) as Expense[];

    if (!expenses) {
      throw new Error('Failed to fetch expenses');
    }

    const cryptoKey = await getCryptoKey(session.keyPair);

    for (const expense of expenses) {
      expense.description = await Encryption.decrypt(expense.description, cryptoKey);
      expense.cost = await Encryption.decrypt(expense.cost, cryptoKey);
      expense.budget = await Encryption.decrypt(expense.budget, cryptoKey);
    }

    if (month === 'all') {
      CACHED_DATA.expenses = expenses;
    }

    return expenses;
  } catch (error) {
    const { Swal } = globalThis;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong fetching expenses.',
    });

    console.error(error);
  }

  return [];
}

export async function saveBudget(budget: Omit<Pick<Budget, 'name' | 'month' | 'value'>, 'id'> & { id?: string }) {
  try {
    if (budget.name === 'Total') {
      showNotification('Cannot create budget named "Total".', 'error');
      return false;
    }

    if (budget.name.trim().length === 0) {
      showNotification('The budget needs a valid name.', 'error');
      return false;
    }

    const value = Number(budget.value);

    if (value <= 0 || Number.isNaN(value)) {
      showNotification('The budget needs a valid value.', 'error');
      return false;
    }

    if (!isValidDate(budget.month)) {
      budget.month = new Date().toISOString().substring(0, 7);
    }

    // Check if the name is unique for the given month
    const existingBudgetsInMonth = await fetchBudgets(budget.month);
    const duplicateBudget = existingBudgetsInMonth.find(
      (existingBudget) => existingBudget.name === budget.name && existingBudget.id !== budget.id,
    );

    if (duplicateBudget) {
      showNotification(
        'A budget with the same name for the same month already exists.',
        'error',
      );
      return false;
    }

    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const cryptoKey = await getCryptoKey(session.keyPair);

    const body: Omit<Budget, 'id'> & { session_id: string; id?: string } = {
      session_id: session.sessionId,
      user_id: session.userId,
      name: await Encryption.encrypt(budget.name, cryptoKey),
      month: budget.month,
      value: await Encryption.encrypt(value.toFixed(2), cryptoKey),
      extra: {},
    };

    if (budget.id !== 'newBudget') {
      body.id = budget.id;
    } else {
      const existingBudget = existingBudgetsInMonth.find(
        (_budget) => _budget.id === budget.id,
      )!; // We can be "sure" this exists because we don't allow changing months (in the backend, and will allow this to error if trying to do it in the frontend)
      const oldName = existingBudget?.name;
      const newName = budget.name;

      // Update all expenses with the previous budget name to the new one, if it changed
      if (existingBudget && oldName !== newName) {
        const matchingExpenses = (
          await fetchExpenses(existingBudget.month)
        ).filter((expense) => expense.budget === oldName);

        for (const expense of matchingExpenses) {
          expense.budget = newName;
          await saveExpense(expense);
        }
      }
    }

    await fetch('/api/budgets', { method: body.id ? 'PATCH' : 'POST', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = globalThis;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong saving that budget.',
    });

    console.error(error);
  }

  return false;
}

export async function saveExpense(
  expense: Omit<Pick<Expense, 'description' | 'date' | 'cost' | 'budget' | 'is_recurring'>, 'id'> & { id?: string },
) {
  try {
    const cost = Number(expense.cost);

    if (cost <= 0 || Number.isNaN(cost)) {
      showNotification('Cost missing or invalid', 'error');
      return false;
    }

    if (expense.description.trim().length === 0) {
      showNotification('The expense needs a valid description.', 'error');
      return false;
    }

    if (!isValidDate(expense.date)) {
      expense.date = new Date().toISOString().substring(0, 10);
    }

    // Check if there's an existing expense with a better budget
    if (
      (!expense.budget || expense.budget === 'Misc') &&
      expense.id === 'newExpense'
    ) {
      if (CACHED_DATA.expenses.length === 0) {
        await fetchExpenses('all');
      }

      const matchingExpense = CACHED_DATA.expenses.find(
        (_expense) => _expense.description === expense.description,
      );

      if (matchingExpense && matchingExpense.budget) {
        expense.budget = matchingExpense.budget;
      }
    }

    if (!expense.budget || typeof expense.budget !== 'string') {
      expense.budget = 'Misc';
    }

    if (!expense.is_recurring || typeof expense.is_recurring !== 'boolean') {
      expense.is_recurring = false;
    }

    // Check if the budget exists for the expense in that given month, otherwise create one
    const existingBudget = (
      await fetchBudgets(expense.date.substring(0, 7))
    ).find((budget) => budget.name === expense.budget);

    if (!existingBudget) {
      await saveBudget({ name: expense.budget, month: expense.date.substring(0, 7), value: '100' });
    }

    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const cryptoKey = await getCryptoKey(session.keyPair);

    const body: Omit<Expense, 'id'> & { session_id: string; id?: string } = {
      session_id: session.sessionId,
      user_id: session.userId,
      description: await Encryption.encrypt(expense.description, cryptoKey),
      budget: await Encryption.encrypt(expense.budget, cryptoKey),
      date: expense.date,
      cost: await Encryption.encrypt(cost.toFixed(2), cryptoKey),
      is_recurring: expense.is_recurring,
      extra: {},
    };

    if (expense.id !== 'newExpense') {
      body.id = expense.id;
    }

    CACHED_DATA.expenses.push({ ...expense, id: expense.id!, user_id: body.user_id, extra: body.extra });

    await fetch('/api/expenses', { method: body.id ? 'PATCH' : 'POST', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = globalThis;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong saving that budget.',
    });

    console.error(error);
  }

  return false;
}

export async function deleteBudget(budgetId: string) {
  try {
    const session = LocalData.get('session')!;

    const existingBudget = (await fetchBudgets('all')).find(
      (budget) => budget.id === budgetId,
    )!;

    // Check if the budget has expenses, if so, don't delete
    const matchingExpenses = (await fetchExpenses(existingBudget.month)).filter(
      (expense) => expense.budget === existingBudget.name,
    );

    if (matchingExpenses.length > 0) {
      // Check if there are duplicate budgets (can happen on slow sync)
      const matchingBudgets = (await fetchBudgets(existingBudget.month)).filter(
        (budget) => budget.name === existingBudget.name,
      );

      if (matchingBudgets.length === 1) {
        showNotification(
          "There are expenses using this budget. You can't delete a budget with expenses",
          'error',
        );
        return false;
      }
    }

    const headers = commonRequestHeaders;

    const body: { session_id: string; user_id: string; id: string } = {
      session_id: session.sessionId,
      user_id: session.userId,
      id: budgetId,
    };

    await fetch('/api/budgets', { method: 'DELETE', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = globalThis;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong deleting that budget.',
    });

    console.error(error);
  }

  return false;
}

export async function deleteExpense(expenseId: string) {
  try {
    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const body: { session_id: string; user_id: string; id: string } = {
      session_id: session.sessionId,
      user_id: session.userId,
      id: expenseId,
    };

    await fetch('/api/expenses', { method: 'DELETE', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = globalThis;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong deleting that expense.',
    });

    console.error(error);
  }

  return false;
}

export async function copyBudgetsAndExpenses(originalMonth: string, destinationMonth: string) {
  const { Swal } = globalThis;

  const originalBudgets = await fetchBudgets(originalMonth);
  const destinationBudgets = originalBudgets.map((budget) => {
    const newBudget = { ...budget };
    newBudget.month = destinationMonth;
    return newBudget;
  });

  if (destinationBudgets.length > 0) {
    try {
      for (const budget of destinationBudgets) {
        await saveBudget({ name: budget.name, value: budget.value, month: budget.month });
      }
    } catch (error) {
      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong copying budgets.',
      });

      console.error(error);
    }
  }

  const originalRecurringExpenses = (await fetchExpenses(originalMonth)).filter((expense) => expense.is_recurring);
  const destinationExpenses = originalRecurringExpenses.map((expense) => {
    const expenseDay = new Date(expense.date).getDate();
    const newExpense = { ...expense };
    newExpense.date = `${destinationMonth}-${(`0${expenseDay}`).slice(-2)}`;
    return newExpense;
  });

  if (destinationExpenses.length > 0) {
    try {
      for (const expense of destinationExpenses) {
        await saveExpense({
          cost: expense.cost,
          description: expense.description,
          budget: expense.budget,
          date: expense.date,
          is_recurring: expense.is_recurring,
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong copying recurring expenses.',
      });

      console.error(error);
    }
  }
}

export async function deleteAllData() {
  const { Swal } = globalThis;
  try {
    globalThis.app.showLoading();

    const headers = commonRequestHeaders;

    const session = LocalData.get('session')!;

    const body: { user_id: string; session_id: string; code?: string } = {
      user_id: session.userId,
      session_id: session.sessionId,
    };

    await fetch('/api/data', { method: 'DELETE', headers, body: JSON.stringify(body) });

    globalThis.app.hideLoading();

    const { value: code } = await Swal.fire({
      template: '#verification-code-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      preConfirm: () => {
        const codeValue = (document.getElementById('verification-code-input') as HTMLInputElement).value;

        if (!codeValue) {
          showNotification('You need to submit a code!', 'error');
          return false;
        }

        return codeValue;
      },
      willOpen: () => {
        (document.getElementById('verification-code-input') as HTMLInputElement).value = '';
      },
    });

    globalThis.app.showLoading();

    body.code = code;

    await fetch('/api/data', { method: 'DELETE', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = globalThis;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong deleting all data.',
    });

    console.error(error);
  }

  return false;
}

export async function exportAllData() {
  try {
    const budgets: (Omit<Budget, 'user_id'> & { user_id?: string })[] = await fetchBudgets('all');
    const expenses: (Omit<Expense, 'user_id'> & { user_id?: string })[] = await fetchExpenses('all');

    if (!budgets) {
      throw new Error('Failed to fetch budgets');
    }

    if (!expenses) {
      throw new Error('Failed to fetch expenses');
    }

    for (const budget of budgets) {
      delete budget.user_id;
    }

    for (const expense of expenses) {
      delete expense.user_id;
    }

    return { budgets, expenses };
  } catch (error) {
    const { Swal } = globalThis;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong exporting data.',
    });

    console.error(error);
  }

  return {};
}

export async function importData(replaceData: boolean, budgets: Budget[], expenses: Expense[]) {
  try {
    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const cryptoKey = await getCryptoKey(session.keyPair);

    if (replaceData) {
      await deleteAllData();
    }

    const finalBudgetsToAdd: Omit<Budget, 'id' | 'user_id'>[] = [];

    for (const budget of budgets) {
      const newBudget: typeof finalBudgetsToAdd[0] = {
        name: await Encryption.encrypt(budget.name, cryptoKey),
        month: budget.month,
        value: await Encryption.encrypt(Number(budget.value).toFixed(2), cryptoKey),
        extra: {},
      };

      finalBudgetsToAdd.push(newBudget);
    }

    const finalExpensesToAdd: Omit<Expense, 'id' | 'user_id'>[] = [];

    for (const expense of expenses) {
      const newExpense: typeof finalExpensesToAdd[0] = {
        description: await Encryption.encrypt(expense.description, cryptoKey),
        date: expense.date,
        cost: await Encryption.encrypt(Number(expense.cost).toFixed(2), cryptoKey),
        budget: await Encryption.encrypt(expense.budget, cryptoKey),
        is_recurring: Boolean(expense.is_recurring),
        extra: {},
      };

      finalExpensesToAdd.push(newExpense);
    }

    const body: {
      session_id: string;
      user_id: string;
      budgets: typeof finalBudgetsToAdd;
      expenses: typeof finalExpensesToAdd;
    } = {
      session_id: session.sessionId,
      user_id: session.userId,
      budgets: finalBudgetsToAdd,
      expenses: finalExpensesToAdd,
    };

    await fetch('/api/data', { method: 'POST', headers, body: JSON.stringify(body) });

    return true;
  } catch (error) {
    const { Swal } = globalThis;

    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong importing data.',
    });

    console.error(error);
  }

  return false;
}

export async function commonInitializer() {
  const user = await checkForValidSession();
  const swapAccountsSelect = document.getElementById('swap-accounts-select') as HTMLSelectElement;

  function populateSwapAccountsSelect() {
    if (user) {
      const otherSessions = getOtherAccounts();
      otherSessions.sort(sortByEmail);

      const currentUserOptionHtml = `<option>${user.email}</option>`;
      const newLoginOptionHtml = `<option value="new">Login to another account</option>`;
      const fullSelectHtmlStrings: string[] = [currentUserOptionHtml];

      for (const otherSession of otherSessions) {
        const optionHtml = `<option>${otherSession.email}</option>`;
        fullSelectHtmlStrings.push(optionHtml);
      }

      fullSelectHtmlStrings.push(newLoginOptionHtml);

      swapAccountsSelect.innerHTML = fullSelectHtmlStrings.join('\n');
    }
  }

  function chooseAnotherAccount() {
    const currentEmail = user?.email;
    const chosenEmail = swapAccountsSelect.value;

    if (!chosenEmail) {
      return;
    }

    if (chosenEmail === currentEmail) {
      return;
    }

    if (chosenEmail === 'new') {
      // Show login form again
      hideValidSessionElements();
      return;
    }

    swapAccount(chosenEmail);
  }

  populateSwapAccountsSelect();

  swapAccountsSelect.removeEventListener('change', chooseAnotherAccount);
  swapAccountsSelect.addEventListener('change', chooseAnotherAccount);
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface ShowFormattedDateOptions {
  showDay?: boolean;
  showYear?: boolean;
  longMonth?: boolean;
  longYear?: boolean;
}

export function showFormattedDate(
  stringDate: string,
  { showDay = true, showYear = false, longMonth = false, longYear = false }: ShowFormattedDateOptions = {},
) {
  const dateYear = parseInt(stringDate.substring(0, 4));
  const dateMonth = parseInt(stringDate.substring(5, 7), 10) - 1;
  const dateDay = parseInt(stringDate.substring(8, 10), 10);

  const monthName = longMonth ? months[dateMonth] : months[dateMonth].substring(0, 3);
  const yearName = longYear ? dateYear.toString() : `'${dateYear.toString().substring(2, 4)}`;

  if (showYear) {
    if (showDay) {
      return `${dateDay} ${monthName} ${yearName}`;
    }

    return `${monthName} ${yearName}`;
  }

  return `${dateDay} ${monthName}`;
}

function isValidDate(dateObject: Date | string) {
  return new Date(dateObject).toString() !== 'Invalid Date';
}

export function dateDiffInDays(startDate: Date, endDate: Date) {
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

type SortableByName = { name: string };
export function sortByName(
  objectA: SortableByName,
  objectB: SortableByName,
) {
  const nameA = objectA.name.toUpperCase();
  const nameB = objectB.name.toUpperCase();
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}

type SortableByEmail = { email: string };
export function sortByEmail(
  objectA: SortableByEmail,
  objectB: SortableByEmail,
) {
  const emailA = objectA.email.toLowerCase();
  const emailB = objectB.email.toLowerCase();
  if (emailA < emailB) {
    return -1;
  }
  if (emailA > emailB) {
    return 1;
  }
  return 0;
}

export interface BudgetToShow extends Omit<Budget, 'user_id' | 'extra'> {
  expensesCost: number;
}

export function sortByMissingBudget(objectA: BudgetToShow, objectB: BudgetToShow) {
  const valueA = Number(objectA.value) - objectA.expensesCost;
  const valueB = Number(objectB.value) - objectB.expensesCost;
  return valueB - valueA;
}

export type SupportedCurrencySymbol = '$' | '€' | '£' | '¥' | '₹';
type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR';

export const currencyMap = new Map<SupportedCurrencySymbol, SupportedCurrency>([
  ['$', 'USD'],
  ['€', 'EUR'],
  ['£', 'GBP'],
  ['¥', 'JPY'],
  ['₹', 'INR'],
]);

export function formatNumber(currency: SupportedCurrencySymbol, number: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyMap.get(currency) || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.parseFloat(`${number}`.replace(',', '.')));
}

export function debounce(callback: any, waitInMs: number) {
  let timeoutId: number | undefined = undefined;
  return (...args: any) => {
    globalThis.clearTimeout(timeoutId);

    timeoutId = globalThis.setTimeout(() => {
      callback.apply(null, args);
    }, waitInMs);
  };
}

export function validateEmail(email: string) {
  const trimmedEmail = (email || '').trim().toLocaleLowerCase();
  if (!trimmedEmail) {
    return false;
  }

  const requiredCharsNotInEdges = ['@', '.'];
  return requiredCharsNotInEdges.every((char) =>
    trimmedEmail.includes(char) && !trimmedEmail.startsWith(char) && !trimmedEmail.endsWith(char)
  );
}
