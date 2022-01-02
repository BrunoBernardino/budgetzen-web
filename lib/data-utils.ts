import * as Etebase from 'etebase';
import Swal from 'sweetalert2';
import moment from 'moment';

import { sortByName, sortByDate, showNotification, doLogin } from './utils';
import * as T from './types';

const ETEBASE_SERVER_URL = process.env.NEXT_PUBLIC_ETEBASE_SERVER_URL;

const collectionTypes = {
  budget: 'budgetzen.budget',
  expense: 'budgetzen.expense',
};

const collectionUids = {
  budgets: '',
  expenses: '',
};

export const validateLogin = async (email: string, syncToken: string) => {
  try {
    const etebase = await Etebase.Account.login(
      email,
      syncToken,
      ETEBASE_SERVER_URL,
    );
    const savedSession = await etebase.save();
    doLogin(savedSession);
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
};

export const createAccount = async (email: string, syncToken: string) => {
  try {
    const etebase = await Etebase.Account.signup(
      {
        username: Etebase.toBase64(Etebase.randomBytes(24)),
        email,
      },
      syncToken,
      ETEBASE_SERVER_URL,
    );
    const savedSession = await etebase.save();
    doLogin(savedSession);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const initializeDb = async (session: string) => {
  if (!session) {
    return null;
  }

  const etebase = await Etebase.Account.restore(session);

  const collectionManager = etebase.getCollectionManager();
  try {
    const collections = await collectionManager.list([
      collectionTypes.budget,
      collectionTypes.expense,
    ]);

    if (collections.data.length === 0) {
      const budgetsCollection = await collectionManager.create(
        collectionTypes.budget,
        {
          name: 'Budgets',
          description: 'BudgetZen Budgets',
          color: '#7fa780ff',
        },
        '', // Empty content
      );
      const expensesCollection = await collectionManager.create(
        collectionTypes.expense,
        {
          name: 'Expenses',
          description: 'BudgetZen Expenses',
          color: '#84848aff',
        },
        '', // Empty content
      );

      await collectionManager.transaction(budgetsCollection);
      await collectionManager.transaction(expensesCollection);

      collectionUids.budgets = budgetsCollection.uid;
      collectionUids.expenses = expensesCollection.uid;
    } else {
      for (const collection of collections.data) {
        const collectionType = collection.getCollectionType();
        if (collectionType === collectionTypes.budget) {
          collectionUids.budgets = collection.uid;
        } else if (collectionType === collectionTypes.expense) {
          collectionUids.expenses = collection.uid;
        }
      }
    }
  } catch (error) {
    console.log(error);
    showNotification(error, 'error');
    return null;
  }

  return etebase;
};

const getBudgetFromItem = async (item: Etebase.Item) => {
  try {
    const data: T.BudgetContent = JSON.parse(
      await item.getContent(Etebase.OutputFormat.String),
    );

    return {
      id: item.uid,
      name: data.name,
      month: data.month,
      value: data.value,
    } as T.Budget;
  } catch (error) {
    return null;
  }
};

export const fetchBudgets = async (
  etebase: Etebase.Account,
  month?: string,
) => {
  try {
    const collectionManager = etebase.getCollectionManager();
    const collection = await collectionManager.fetch(collectionUids.budgets);
    const itemManager = collectionManager.getItemManager(collection);
    const items = await itemManager.list();

    const budgets = (await Promise.all(items.data.map(getBudgetFromItem)))
      .filter((budget) => {
        if (!budget) {
          return false;
        }

        if (!month) {
          return true;
        }

        if (budget.month === month) {
          return true;
        }

        return false;
      })
      .sort(sortByName);

    return budgets;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong fetching budgets.',
    });

    console.error(error);
  }

  return [];
};

const getExpenseFromItem = async (item: Etebase.Item) => {
  try {
    const data: T.ExpenseContent = JSON.parse(
      await item.getContent(Etebase.OutputFormat.String),
    );

    return {
      id: item.uid,
      cost: data.cost,
      description: data.description,
      budget: data.budget,
      date: data.date,
    } as T.Expense;
  } catch (error) {
    return null;
  }
};

export const fetchExpenses = async (
  etebase: Etebase.Account,
  month?: string,
) => {
  try {
    const collectionManager = etebase.getCollectionManager();
    const collection = await collectionManager.fetch(collectionUids.expenses);
    const itemManager = collectionManager.getItemManager(collection);
    const items = await itemManager.list();

    const expenses = (await Promise.all(items.data.map(getExpenseFromItem)))
      .filter((expense) => {
        if (!expense) {
          return false;
        }

        if (!month) {
          return true;
        }

        if (expense.date >= `${month}-01` && expense.date <= `${month}-31`) {
          return true;
        }

        return false;
      })
      .sort(sortByDate)
      .reverse();

    return expenses;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong fetching expenses.',
    });

    console.error(error);
  }

  return [];
};

export const saveBudget = async (
  etebase: Etebase.Account,
  budget: T.Budget,
) => {
  try {
    if (budget.name === 'Total') {
      showNotification('Cannot create budget named "Total".', 'error');
      return false;
    }

    if (budget.name.trim().length === 0) {
      showNotification('The budget needs a valid name.', 'error');
      return false;
    }

    if (budget.value <= 0 || Number.isNaN(budget.value)) {
      showNotification('The budget needs a valid value.', 'error');
      return false;
    }

    if (!moment(budget.month, 'YYYY-MM').isValid()) {
      budget.month = moment().format('YYYY-MM');
    }

    // Check if the name is unique for the given month
    const existingBudgetsInMonth = await fetchBudgets(etebase, budget.month);
    const duplicateBudget = existingBudgetsInMonth.find(
      (existingBudget) =>
        existingBudget.name === budget.name && existingBudget.id !== budget.id,
    );

    if (duplicateBudget) {
      showNotification(
        'A budget with the same name for the same month already exists.',
        'error',
      );
      return false;
    }

    const collectionManager = etebase.getCollectionManager();
    const collection = await collectionManager.fetch(collectionUids.budgets);
    const itemManager = collectionManager.getItemManager(collection);

    if (budget.id === 'newBudget') {
      budget.id = `${Date.now().toString()}:${Math.random()}`;

      const item = await itemManager.create(
        {
          type: 'budget',
          mtime: new Date().getTime(),
        },
        JSON.stringify({
          name: budget.name,
          value: budget.value,
          month: budget.month,
        } as T.BudgetContent),
      );

      await itemManager.batch([item]);
    } else {
      const existingBudgetItem = await itemManager.fetch(budget.id);
      const existingBudget = await getBudgetFromItem(existingBudgetItem);
      const oldName = existingBudget.name;
      const newName = budget.name;

      await existingBudgetItem.setContent(
        JSON.stringify({
          name: budget.name,
          value: budget.value,
          month: existingBudget.month, // Don't allow changing a budget's month
        } as T.BudgetContent),
      );
      await itemManager.batch([existingBudgetItem]);

      // Update all expenses with the previous budget name to the new one, if it changed
      if (oldName !== newName) {
        const matchingExpenses = (
          await fetchExpenses(etebase, existingBudget.month)
        ).filter((expense) => expense.budget === oldName);
        const expensesCollection = await collectionManager.fetch(
          collectionUids.expenses,
        );
        const expensesItemManager =
          collectionManager.getItemManager(expensesCollection);
        const expenseItemsToUpdate = [];
        for (const expense of matchingExpenses) {
          const expenseItem = await expensesItemManager.fetch(expense.id);
          await expenseItem.setContent(
            JSON.stringify({
              cost: expense.cost,
              description: expense.description,
              budget: newName,
              date: expense.date,
            } as T.ExpenseContent),
          );
          expenseItemsToUpdate.push(expenseItem);
        }
        await expensesItemManager.batch(expenseItemsToUpdate);
      }
    }

    return true;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong saving that budget.',
    });

    console.error(error);
  }

  return false;
};

export const deleteBudget = async (
  etebase: Etebase.Account,
  budgetId: string,
) => {
  try {
    const collectionManager = etebase.getCollectionManager();
    const collection = await collectionManager.fetch(collectionUids.budgets);
    const itemManager = collectionManager.getItemManager(collection);
    const item = await itemManager.fetch(budgetId);

    const existingBudget = await getBudgetFromItem(item);

    // Check if the budget has no expenses, if so, don't delete
    const matchingExpenses = (
      await fetchExpenses(etebase, existingBudget.month)
    ).filter((expense) => expense.budget === existingBudget.name);

    if (matchingExpenses.length > 0) {
      // Check if there are duplicate budgets (can happen on slow sync)
      const matchingBudgets = (
        await fetchBudgets(etebase, existingBudget.month)
      ).filter((budget) => budget.name === existingBudget.name);

      if (matchingBudgets.length === 1) {
        showNotification(
          "There are expenses using this budget. You can't delete a budget with expenses",
          'error',
        );
        return false;
      }
    }

    item.delete();
    await itemManager.batch([item]);

    return true;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong deleting that budget.',
    });

    console.error(error);
  }

  return false;
};

export const saveExpense = async (
  etebase: Etebase.Account,
  expense: T.Expense,
) => {
  try {
    if (!expense.cost || typeof expense.cost !== 'number') {
      showNotification('Cost missing or invalid', 'error');
      return false;
    }

    if (!expense.description || typeof expense.description !== 'string') {
      showNotification('Description missing or invalid', 'error');
      return false;
    }

    if (!expense.date || typeof expense.date !== 'string') {
      expense.date = moment().format('YYYY-MM-DD');
    }

    // Check if there's an existing expense with a better budget
    if (
      (!expense.budget || expense.budget === 'Misc') &&
      expense.id === 'newExpense'
    ) {
      const matchingExpense = (await fetchExpenses(etebase)).find(
        (_expense) => _expense.description === expense.description,
      );

      if (matchingExpense.budget) {
        expense.budget = matchingExpense.budget;
      }
    }

    if (!expense.budget || typeof expense.budget !== 'string') {
      expense.budget = 'Misc';
    }

    // Check if the budget exists for the expense in that given month, otherwise create one
    const existingBudget = (
      await fetchBudgets(etebase, expense.date.substring(0, 7))
    ).find((budget) => budget.name === expense.budget);

    if (!existingBudget) {
      const collectionManager = etebase.getCollectionManager();
      const collection = await collectionManager.fetch(collectionUids.budgets);
      const itemManager = collectionManager.getItemManager(collection);

      const item = await itemManager.create(
        {
          type: 'budget',
          mtime: new Date().getTime(),
        },
        JSON.stringify({
          name: expense.budget,
          month: expense.date.substring(0, 7),
          value: 100,
        } as T.BudgetContent),
      );

      await itemManager.batch([item]);
    }

    const collectionManager = etebase.getCollectionManager();
    const collection = await collectionManager.fetch(collectionUids.expenses);
    const itemManager = collectionManager.getItemManager(collection);

    if (expense.id === 'newExpense') {
      expense.id = `${Date.now().toString()}:${Math.random()}`;

      const item = await itemManager.create(
        {
          type: 'expense',
          mtime: new Date().getTime(),
        },
        JSON.stringify({
          cost: expense.cost,
          budget: expense.budget,
          description: expense.description,
          date: expense.date,
        } as T.ExpenseContent),
      );

      await itemManager.batch([item]);
    } else {
      const existingExpenseItem = await itemManager.fetch(expense.id);

      await existingExpenseItem.setContent(
        JSON.stringify({
          cost: expense.cost,
          description: expense.description,
          budget: expense.budget,
          date: expense.date,
        } as T.ExpenseContent),
      );
      await itemManager.batch([existingExpenseItem]);
    }

    return true;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong saving that expense.',
    });

    console.error(error);
  }

  return false;
};

export const deleteExpense = async (
  etebase: Etebase.Account,
  expenseId: string,
) => {
  try {
    const collectionManager = etebase.getCollectionManager();
    const collection = await collectionManager.fetch(collectionUids.expenses);
    const itemManager = collectionManager.getItemManager(collection);
    const item = await itemManager.fetch(expenseId);

    item.delete();
    await itemManager.batch([item]);

    return true;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong deleting that expense.',
    });

    console.error(error);
  }

  return false;
};

export const deleteAllData = async (etebase: Etebase.Account) => {
  const collectionManager = etebase.getCollectionManager();
  const collections = await collectionManager.list([
    collectionTypes.budget,
    collectionTypes.expense,
  ]);

  for (const collection of collections.data) {
    collection.delete();
    await collectionManager.upload(collection);
  }
};

type ExportAllData = (etebase: Etebase.Account) => Promise<{
  budgets?: T.Budget[];
  expenses?: T.Expense[];
}>;

export const exportAllData: ExportAllData = async (
  etebase: Etebase.Account,
) => {
  try {
    // NOTE: The queries look weird because .dump() and simple .find() were returning indexes and other stuff
    const budgets = (await fetchBudgets(etebase)).sort(sortByName);
    const expenses = (await fetchExpenses(etebase)).sort(sortByDate);

    return { budgets, expenses };
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong exporting data.',
    });

    console.error(error);
  }

  return {};
};

export const importData = async (
  etebase: Etebase.Account,
  session: string,
  replaceData: boolean,
  budgets: T.Budget[],
  expenses: T.Expense[],
) => {
  try {
    if (replaceData) {
      await deleteAllData(etebase);

      await initializeDb(session);
    }

    const collectionManager = etebase.getCollectionManager();
    const budgetsCollection = await collectionManager.fetch(
      collectionUids.budgets,
    );
    const budgetsItemManager =
      collectionManager.getItemManager(budgetsCollection);
    const budgetItems: Etebase.Item[] = [];

    for (const budget of budgets) {
      const item = await budgetsItemManager.create(
        {
          type: 'budget',
          mtime: new Date().getTime(),
        },
        JSON.stringify({
          name: budget.name,
          value: budget.value,
          month: budget.month,
        } as T.BudgetContent),
      );

      budgetItems.push(item);
    }

    await budgetsItemManager.batch(budgetItems);

    const expensesCollection = await collectionManager.fetch(
      collectionUids.expenses,
    );
    const expensesItemManager =
      collectionManager.getItemManager(expensesCollection);
    const expenseItems: Etebase.Item[] = [];

    for (const expense of expenses) {
      const item = await expensesItemManager.create(
        {
          type: 'expense',
          mtime: new Date().getTime(),
        },
        JSON.stringify({
          cost: expense.cost,
          budget: expense.budget,
          description: expense.description,
          date: expense.date,
        } as T.ExpenseContent),
      );

      expenseItems.push(item);
    }

    await expensesItemManager.batch(expenseItems);

    return true;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong importing data.',
    });

    console.error(error);
  }

  return false;
};

export const copyBudgets = async (
  etebase: Etebase.Account,
  originalMonth: string,
  destinationMonth: string,
) => {
  const originalBudgets = await fetchBudgets(etebase, originalMonth);
  const destinationBudgets = originalBudgets.map((budget) => {
    const newBudget: T.Budget = { ...budget };
    newBudget.id = `${Date.now().toString()}:${Math.random()}`;
    newBudget.month = destinationMonth;
    return newBudget;
  });
  if (destinationBudgets.length > 0) {
    try {
      const collectionManager = etebase.getCollectionManager();
      const collection = await collectionManager.fetch(collectionUids.budgets);
      const itemManager = collectionManager.getItemManager(collection);
      const items: Etebase.Item[] = [];

      for (const budget of destinationBudgets) {
        const item = await itemManager.create(
          {
            type: 'budget',
            mtime: new Date().getTime(),
          },
          JSON.stringify({
            name: budget.name,
            value: budget.value,
            month: budget.month,
          } as T.BudgetContent),
        );

        items.push(item);
      }

      await itemManager.batch(items);
    } catch (error) {
      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong copying budgets.',
      });

      console.error(error);
    }
  }
};
