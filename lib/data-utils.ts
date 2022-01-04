import userbase from 'userbase-js';
import Swal from 'sweetalert2';
import moment from 'moment';

import {
  sortByName,
  sortByDate,
  splitArrayInChunks,
  showNotification,
} from './utils';
import * as T from './types';

const USERBASE_APP_ID = process.env.NEXT_PUBLIC_USERBASE_APP_ID;

const cachedData: { budgets: T.Budget[]; expenses: T.Expense[] } = {
  budgets: [],
  expenses: [],
};

const hasFinishedLoading = {
  budgets: false,
  expenses: false,
};

const sessionLengthInHours = 90 * 24;

export const validateLogin = async (email: string, password: string) => {
  try {
    await userbase.signIn({
      username: email,
      password,
      sessionLength: sessionLengthInHours,
      rememberMe: 'local',
    });
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
};

export const createAccount = async (email: string, password: string) => {
  try {
    await userbase.signUp({
      username: email,
      password,
      sessionLength: sessionLengthInHours,
      rememberMe: 'local',
      email,
    });
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
};

const getBudgetFromItem = (item: userbase.Item) => {
  try {
    return {
      id: item.itemId,
      name: item.item.name,
      month: item.item.month,
      value: item.item.value,
    } as T.Budget;
  } catch (error) {
    return null;
  }
};

const getExpenseFromItem = (item: userbase.Item) => {
  try {
    return {
      id: item.itemId,
      cost: item.item.cost,
      description: item.item.description,
      budget: item.item.budget,
      date: item.item.date,
    } as T.Expense;
  } catch (error) {
    return null;
  }
};

const loadItemsAsync = async () => {
  await userbase.openDatabase({
    databaseName: 'budgets',
    changeHandler: async (items) => {
      const budgets = items
        .map(getBudgetFromItem)
        .filter((budget) => Boolean(budget));

      hasFinishedLoading.budgets = true;

      cachedData.budgets = budgets;
    },
  });

  await userbase.openDatabase({
    databaseName: 'expenses',
    changeHandler: (items) => {
      const expenses = items
        .map(getExpenseFromItem)
        .filter((expense) => Boolean(expense));

      hasFinishedLoading.expenses = true;

      cachedData.expenses = expenses;
    },
  });
};

export const initializeDb = async () => {
  try {
    await userbase.init({ appId: USERBASE_APP_ID });

    await loadItemsAsync();
  } catch (error) {
    console.log(error);
    showNotification(error, 'error');
  }
};

export const fetchBudgets = async (month?: string) => {
  try {
    // Very ugly, but... works.
    while (!hasFinishedLoading.budgets) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    const budgets = cachedData.budgets
      .filter((budget) => {
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

export const fetchExpenses = async (month?: string) => {
  try {
    // Very ugly, but... works.
    while (!hasFinishedLoading.expenses) {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    const expenses = cachedData.expenses
      .filter((expense) => {
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

export const saveBudget = async (budget: T.Budget) => {
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
    const existingBudgetsInMonth = await fetchBudgets(budget.month);
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

    if (budget.id === 'newBudget') {
      budget.id = `${Date.now().toString()}:${Math.random()}`;

      await userbase.insertItem({
        databaseName: 'budgets',
        item: {
          name: budget.name,
          value: budget.value,
          month: budget.month,
        } as T.BudgetContent,
        itemId: budget.id,
      });
    } else {
      const existingBudget = cachedData.budgets.find(
        (_budget) => _budget.id === budget.id,
      );
      const oldName = existingBudget.name;
      const newName = budget.name;

      await userbase.updateItem({
        databaseName: 'budgets',
        item: {
          name: budget.name,
          value: budget.value,
          month: existingBudget.month, // Don't allow changing a budget's month
        } as T.BudgetContent,
        itemId: budget.id,
      });

      const cachedBudgetIndex = cachedData.budgets.findIndex(
        (_budget) => _budget.id === budget.id,
      );
      if (cachedBudgetIndex !== -1) {
        cachedData.budgets[cachedBudgetIndex].name = budget.name;
        cachedData.budgets[cachedBudgetIndex].value = budget.value;
      }

      // Update all expenses with the previous budget name to the new one, if it changed
      if (oldName !== newName) {
        const matchingExpenses = (
          await fetchExpenses(existingBudget.month)
        ).filter((expense) => expense.budget === oldName);

        for (const expense of matchingExpenses) {
          const cachedExpenseIndex = cachedData.expenses.findIndex(
            (_expense) => _expense.id === expense.id,
          );
          if (cachedExpenseIndex !== -1) {
            cachedData.expenses[cachedExpenseIndex].budget = newName;
          }
        }

        const updateChunks: T.Expense[][] = splitArrayInChunks(
          matchingExpenses,
          10,
        );

        for (const machingExpensesChunk of updateChunks) {
          await userbase.putTransaction({
            databaseName: 'expenses',
            operations: machingExpensesChunk.map((expense) => ({
              command: 'Update',
              item: {
                cost: expense.cost,
                description: expense.description,
                budget: newName,
                date: expense.date,
              } as T.ExpenseContent,
              itemId: expense.id,
            })),
          });
        }
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

export const deleteBudget = async (budgetId: string) => {
  try {
    const existingBudget = cachedData.budgets.find(
      (budget) => budget.id === budgetId,
    );

    // Check if the budget has no expenses, if so, don't delete
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

    await userbase.deleteItem({
      databaseName: 'budgets',
      itemId: budgetId,
    });

    const cachedItemIndex = cachedData.budgets.findIndex(
      (budget) => budget.id === budgetId,
    );
    if (cachedItemIndex !== -1) {
      cachedData.budgets.splice(cachedItemIndex, 1);
    }

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

export const saveExpense = async (expense: T.Expense) => {
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
      const matchingExpense = (await fetchExpenses()).find(
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
      await fetchBudgets(expense.date.substring(0, 7))
    ).find((budget) => budget.name === expense.budget);

    if (!existingBudget) {
      const newBudgetId = `${Date.now().toString()}:${Math.random()}`;

      await userbase.insertItem({
        databaseName: 'budgets',
        item: {
          name: expense.budget,
          month: expense.date.substring(0, 7),
          value: 100,
        } as T.BudgetContent,
        itemId: newBudgetId,
      });
    }

    if (expense.id === 'newExpense') {
      expense.id = `${Date.now().toString()}:${Math.random()}`;

      await userbase.insertItem({
        databaseName: 'expenses',
        item: {
          cost: expense.cost,
          budget: expense.budget,
          description: expense.description,
          date: expense.date,
        } as T.ExpenseContent,
        itemId: expense.id,
      });
    } else {
      await userbase.updateItem({
        databaseName: 'expenses',
        item: {
          cost: expense.cost,
          description: expense.description,
          budget: expense.budget,
          date: expense.date,
        } as T.ExpenseContent,
        itemId: expense.id,
      });

      const cachedItemIndex = cachedData.expenses.findIndex(
        (_expense) => _expense.id === expense.id,
      );
      if (cachedItemIndex !== -1) {
        cachedData.expenses[cachedItemIndex].cost = expense.cost;
        cachedData.expenses[cachedItemIndex].description = expense.description;
        cachedData.expenses[cachedItemIndex].budget = expense.budget;
        cachedData.expenses[cachedItemIndex].date = expense.date;
      }
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

export const deleteExpense = async (expenseId: string) => {
  try {
    await userbase.deleteItem({
      databaseName: 'expenses',
      itemId: expenseId,
    });

    const cachedItemIndex = cachedData.expenses.findIndex(
      (expense) => expense.id === expenseId,
    );
    if (cachedItemIndex !== -1) {
      cachedData.expenses.splice(cachedItemIndex, 1);
    }

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

export const deleteAllData = async () => {
  const budgets = await fetchBudgets();
  const expenses = await fetchExpenses();

  const deleteBudgetChunks: T.Budget[][] = splitArrayInChunks(budgets, 10);
  const deleteExpenseChunks: T.Expense[][] = splitArrayInChunks(expenses, 10);

  for (const budgetsToDelete of deleteBudgetChunks) {
    await userbase.putTransaction({
      databaseName: 'budgets',
      operations: budgetsToDelete.map((budget) => ({
        command: 'Delete',
        itemId: budget.id,
      })),
    });

    // Wait a second, to avoid hitting rate limits
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  for (const expensesToDelete of deleteExpenseChunks) {
    await userbase.putTransaction({
      databaseName: 'expenses',
      operations: expensesToDelete.map((expense) => ({
        command: 'Delete',
        itemId: expense.id,
      })),
    });

    // Wait a second, to avoid hitting rate limits
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  cachedData.budgets.length = 0;
  cachedData.expenses.length = 0;
  hasFinishedLoading.budgets = false;
  hasFinishedLoading.expenses = false;
};

type ExportAllData = () => Promise<{
  budgets?: T.Budget[];
  expenses?: T.Expense[];
}>;

export const exportAllData: ExportAllData = async () => {
  // Don't import anything until we're done with the first full load
  if (!hasFinishedLoading.budgets || !hasFinishedLoading.expenses) {
    return {};
  }

  try {
    const budgets = (await fetchBudgets()).sort(sortByName);
    const expenses = (await fetchExpenses()).sort(sortByDate);

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
  replaceData: boolean,
  budgets: T.Budget[],
  expenses: T.Expense[],
) => {
  // Don't import anything until we're done with the first full load
  if (!hasFinishedLoading.budgets || !hasFinishedLoading.expenses) {
    return false;
  }

  try {
    if (replaceData) {
      await deleteAllData();

      await initializeDb();

      // Very ugly, but... works.
      while (!hasFinishedLoading.budgets || !hasFinishedLoading.expenses) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }
    }

    const finalBudgetsToAdd: T.Budget[] = [];

    for (const budget of budgets) {
      const newBudgetId = `${Date.now().toString()}:${Math.random()}`;
      const newBudget: T.Budget = {
        id: newBudgetId,
        name: budget.name,
        value: budget.value,
        month: budget.month,
      };

      finalBudgetsToAdd.push(newBudget);
    }

    const addBudgetChunks: T.Budget[][] = splitArrayInChunks(
      finalBudgetsToAdd,
      10,
    );

    for (const budgetsToAdd of addBudgetChunks) {
      await userbase.putTransaction({
        databaseName: 'budgets',
        operations: budgetsToAdd.map((budget) => ({
          command: 'Insert',
          item: {
            name: budget.name,
            value: budget.value,
            month: budget.month,
          } as T.BudgetContent,
          itemId: budget.id,
        })),
      });

      // Wait a second, to avoid hitting rate limits
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }

    const finalExpensesToAdd: T.Expense[] = [];

    for (const expense of expenses) {
      const newExpenseId = `${Date.now().toString()}:${Math.random()}`;
      const newExpense: T.Expense = {
        id: newExpenseId,
        cost: expense.cost,
        budget: expense.budget,
        description: expense.description,
        date: expense.date,
      };

      finalExpensesToAdd.push(newExpense);
    }

    const addExpenseChunks: T.Expense[][] = splitArrayInChunks(
      finalExpensesToAdd,
      10,
    );

    for (const expensesToAdd of addExpenseChunks) {
      await userbase.putTransaction({
        databaseName: 'expenses',
        operations: expensesToAdd.map((expense) => ({
          command: 'Insert',
          item: {
            cost: expense.cost,
            budget: expense.budget,
            description: expense.description,
            date: expense.date,
          } as T.ExpenseContent,
          itemId: expense.id,
        })),
      });

      // Wait a second, to avoid hitting rate limits
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    }

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
  originalMonth: string,
  destinationMonth: string,
) => {
  // Don't copy anything until we're done with the first full load
  if (!hasFinishedLoading.budgets || !hasFinishedLoading.expenses) {
    return;
  }

  const originalBudgets = await fetchBudgets(originalMonth);
  const destinationBudgets = originalBudgets.map((budget) => {
    const newBudget: T.Budget = { ...budget };
    newBudget.id = `${Date.now().toString()}:${Math.random()}`;
    newBudget.month = destinationMonth;
    return newBudget;
  });
  if (destinationBudgets.length > 0) {
    try {
      const finalBudgetsToAdd: T.Budget[] = [];

      for (const budget of destinationBudgets) {
        const newBudget: T.Budget = {
          id: budget.id,
          name: budget.name,
          value: budget.value,
          month: budget.month,
        };

        finalBudgetsToAdd.push(newBudget);
      }

      const addBudgetChunks: T.Budget[][] = splitArrayInChunks(
        finalBudgetsToAdd,
        10,
      );

      for (const budgetsToAdd of addBudgetChunks) {
        await userbase.putTransaction({
          databaseName: 'budgets',
          operations: budgetsToAdd.map((budget) => ({
            command: 'Insert',
            item: {
              name: budget.name,
              value: budget.value,
              month: budget.month,
            } as T.BudgetContent,
            itemId: budget.id,
          })),
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong copying budgets.',
      });

      console.error(error);
    }
  }
};
