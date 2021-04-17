import {
  addRxPlugin,
  createRxDatabase,
  PouchDB,
  RxJsonSchema,
  RxDocument,
  RxDatabase,
} from 'rxdb';
import Swal from 'sweetalert2';
import moment from 'moment';

// NOTE: These below are only required for production. Vercel is cleaning them up
// import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBValidatePlugin } from 'rxdb/plugins/validate';
import { RxDBKeyCompressionPlugin } from 'rxdb/plugins/key-compression';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBEncryptionPlugin } from 'rxdb/plugins/encryption';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBWatchForChangesPlugin } from 'rxdb/plugins/watch-for-changes';
import { RxDBReplicationPlugin } from 'rxdb/plugins/replication';
import { RxDBAdapterCheckPlugin } from 'rxdb/plugins/adapter-check';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';
import { RxDBInMemoryPlugin } from 'rxdb/plugins/in-memory';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { RxDBLocalDocumentsPlugin } from 'rxdb/plugins/local-documents';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

import {
  sortByName,
  sortByDate,
  showNotification,
  splitArrayInChunks,
} from './utils';
import * as T from './types';

const localDbName = './BudgetZen__data__v0';

// NOTE: These below are only required for production. Vercel is cleaning them up
// addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBValidatePlugin);
addRxPlugin(RxDBKeyCompressionPlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBEncryptionPlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBWatchForChangesPlugin);
addRxPlugin(RxDBReplicationPlugin);
addRxPlugin(RxDBAdapterCheckPlugin);
addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBInMemoryPlugin);
addRxPlugin(RxDBAttachmentsPlugin);
addRxPlugin(RxDBLocalDocumentsPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

addRxPlugin(require('pouchdb-adapter-idb'));
addRxPlugin(require('pouchdb-adapter-http'));
PouchDB.plugin(require('pouchdb-erase'));

export type ExpenseDocument = RxDocument<T.Expense>;
export const expenseSchema: RxJsonSchema<T.Expense> = {
  title: 'expense schema',
  description: 'describes an expense',
  version: 0,
  keyCompression: true,
  type: 'object',
  properties: {
    id: {
      type: 'string',
      primary: true,
    },
    cost: {
      type: 'number',
    },
    description: {
      type: 'string',
    },
    budget: {
      type: 'string',
    },
    date: {
      type: 'string',
    },
  },
  required: ['cost', 'description', 'budget', 'date'],
};

export type BudgetDocument = RxDocument<T.Budget>;
export const budgetSchema: RxJsonSchema<T.Budget> = {
  title: 'budget schema',
  description: 'describes a budget',
  version: 0,
  keyCompression: true,
  type: 'object',
  properties: {
    id: {
      type: 'string',
      primary: true,
    },
    name: {
      type: 'string',
    },
    month: {
      type: 'string',
    },
    value: {
      type: 'number',
    },
  },
  required: ['name', 'month', 'value'],
};

const _hasFinishedFirstSync = {
  budgets: false,
  expenses: false,
};

export const initializeDb = async (syncToken: string) => {
  if (!syncToken) {
    return null;
  }

  const db = await createRxDatabase({
    name: localDbName,
    adapter: 'idb',
  });

  await db.addCollections({
    expenses: {
      schema: expenseSchema,
    },
    budgets: {
      schema: budgetSchema,
    },
  });

  const syncOptions = {
    remote: syncToken,
    options: {
      live: true,
      retry: true,
    },
  };

  const budgetsSync = db.budgets.sync(syncOptions);

  const expensesSync = db.expenses.sync(syncOptions);

  budgetsSync.complete$.subscribe((completed) => {
    console.log('budgetsSync.complete$', completed);
    _hasFinishedFirstSync.budgets = true;
  });

  budgetsSync.change$.subscribe((docData) => {
    console.log('budgetsSync.change$', docData);
  });

  // budgetsSync.docs$.subscribe((docs) => {
  //   console.log('budgetsSync.docs$', docs);
  // });

  // budgetsSync.active$.subscribe((active) => {
  //   console.log('budgetsSync.active$', active);
  // });

  budgetsSync.error$.subscribe((error) => {
    console.log('budgetsSync.error$', error);
  });

  budgetsSync.denied$.subscribe((error) => {
    console.log('budgetsSync.denied$', error);
  });

  expensesSync.complete$.subscribe((completed) => {
    console.log('expensesSync.complete$', completed);
    _hasFinishedFirstSync.expenses = true;
  });

  expensesSync.change$.subscribe((docData) => {
    console.log('expensesSync.change$', docData);
  });

  // expensesSync.docs$.subscribe((docs) => {
  //   console.log('expensesSync.docs$', docs);
  // });

  // expensesSync.active$.subscribe((active) => {
  //   console.log('expensesSync.active$', active);
  // });

  expensesSync.error$.subscribe((error) => {
    console.log('expensesSync.error$', error);
  });

  expensesSync.denied$.subscribe((error) => {
    console.log('expensesSync.denied$', error);
  });

  return db;
};

export const fetchBudgets = async (db: RxDatabase, month: string) => {
  try {
    const budgets: BudgetDocument[] = await db.budgets
      .find()
      .where('month')
      .eq(month)
      .exec();

    const sortedBudgets = budgets
      .map((budget) => budget.toJSON())
      .sort(sortByName);

    return sortedBudgets;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong fetching budgets.',
    });

    console.error(error);
  }

  return [];
};

export const saveBudget = async (db: RxDatabase, budget: T.Budget) => {
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
    const duplicateBudget: BudgetDocument = await db.budgets
      .findOne()
      .where('month')
      .eq(budget.month)
      .where('name')
      .eq(budget.name)
      .where('id')
      .ne(budget.id)
      .exec();

    if (duplicateBudget) {
      showNotification(
        'A budget with the same name for the same month already exists.',
        'error',
      );
      return false;
    }

    if (budget.id === 'newBudget') {
      budget.id = `${Date.now().toString()}:${Math.random()}`;
      await db.budgets.insert({
        id: budget.id,
        name: budget.name,
        value: budget.value,
        month: budget.month,
      });
    } else {
      const existingBudget: BudgetDocument = await db.budgets
        .findOne()
        .where('id')
        .eq(budget.id)
        .exec();

      const oldName = existingBudget.name;
      const newName = budget.name;

      await existingBudget.update({
        $set: {
          name: budget.name,
          value: budget.value,
        },
      });

      // Update all expenses with the previous budget name to the new one, if it changed
      if (oldName !== newName) {
        const matchingExpenses: ExpenseDocument[] = await db.expenses
          .find()
          .where('date')
          .gte(`${existingBudget.month}-01`)
          .lte(`${existingBudget.month}-31`)
          .where('budget')
          .eq(oldName)
          .exec();

        for (const expense of matchingExpenses) {
          await expense.update({
            $set: {
              budget: newName,
            },
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

export const deleteBudget = async (db: RxDatabase, budgetId: string) => {
  try {
    const existingBudget: BudgetDocument = await db.budgets
      .findOne()
      .where('id')
      .eq(budgetId)
      .exec();

    // Check if the budget has no expenses, if so, don't delete
    const matchingExpenses: ExpenseDocument[] = await db.expenses
      .find()
      .where('date')
      .gte(`${existingBudget.month}-01`)
      .lte(`${existingBudget.month}-31`)
      .where('budget')
      .eq(existingBudget.name)
      .exec();

    if (matchingExpenses.length > 0) {
      // Check if there are duplicate budgets (can happen on slow sync)
      const matchingBudgets: BudgetDocument[] = await db.budgets
        .find()
        .where('month')
        .eq(existingBudget.month)
        .where('name')
        .eq(existingBudget.name)
        .exec();

      if (matchingBudgets.length === 1) {
        showNotification(
          "There are expenses using this budget. You can't delete a budget with expenses",
          'error',
        );
        return false;
      }
    }

    await existingBudget.remove();

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

export const fetchExpenses = async (db: RxDatabase, month: string) => {
  try {
    const expenses: ExpenseDocument[] = await db.expenses
      .find()
      .where('date')
      .gte(`${month}-01`)
      .lte(`${month}-31`)
      .exec();

    const sortedExpenses = expenses
      .map((expense) => expense.toJSON())
      .sort(sortByDate)
      .reverse();

    return sortedExpenses;
  } catch (error) {
    Swal.fire({
      title: 'Uh-oh',
      text: 'Something went wrong fetching expenses.',
    });

    console.error(error);
  }

  return [];
};

export const saveExpense = async (db: RxDatabase, expense: T.Expense) => {
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
      const matchingExpenseDoc: ExpenseDocument = await db.expenses
        .findOne()
        .where('description')
        .eq(expense.description)
        .exec();

      const matchingExpense = (matchingExpenseDoc &&
        matchingExpenseDoc.toJSON()) || { budget: '' };

      if (matchingExpense.budget) {
        expense.budget = matchingExpense.budget;
      }
    }

    if (!expense.budget || typeof expense.budget !== 'string') {
      expense.budget = 'Misc';
    }

    // Check if the budget exists for the expense in that given month, otherwise create one
    const existingBudget: BudgetDocument = await db.budgets
      .findOne()
      .where('month')
      .eq(expense.date.substr(0, 7))
      .where('name')
      .eq(expense.budget)
      .exec();

    if (!existingBudget) {
      const newBudget: T.Budget = {
        id: `${Date.now().toString()}:${Math.random()}`,
        name: expense.budget,
        month: expense.date.substr(0, 7),
        value: 100,
      };

      await db.budgets.insert(newBudget);
    }

    if (expense.id === 'newExpense') {
      expense.id = `${Date.now().toString()}:${Math.random()}`;
      await db.expenses.insert({
        id: expense.id,
        cost: expense.cost,
        budget: expense.budget,
        description: expense.description,
        date: expense.date,
      });
    } else {
      const existingExpense: ExpenseDocument = await db.expenses
        .findOne()
        .where('id')
        .eq(expense.id)
        .exec();
      await existingExpense.update({
        $set: {
          cost: expense.cost,
          description: expense.description,
          budget: expense.budget,
          date: expense.date,
        },
      });
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

export const deleteExpense = async (db: RxDatabase, expenseId: string) => {
  try {
    const existingExpense: ExpenseDocument = await db.expenses
      .findOne()
      .where('id')
      .eq(expenseId)
      .exec();

    await existingExpense.remove();

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

export const deleteAllData = async (db: RxDatabase, syncToken: string) => {
  await db.budgets.remove();
  await db.expenses.remove();

  // NOTE: The erase below doesn't work locally, so we need the two lines above
  const localDb = new PouchDB(localDbName);
  // @ts-ignore erase comes from pouchdb-erase
  await localDb.erase();

  const remoteDb = new PouchDB(syncToken);
  // @ts-ignore erase comes from pouchdb-erase
  await remoteDb.erase();
};

type ExportAllData = (
  db: RxDatabase,
) => Promise<{
  budgets?: T.Budget[];
  expenses?: T.Expense[];
}>;

export const exportAllData: ExportAllData = async (db) => {
  try {
    // NOTE: The queries look weird because .dump() and simple .find() were returning indexes and other stuff
    const budgets: BudgetDocument[] = await db.budgets
      .find()
      .where('month')
      .gte('2000-01')
      .lte('2100-12')
      .exec();
    const sortedBudgets = budgets
      .map((budget) => {
        const rawBudget = budget.toJSON();
        delete rawBudget._rev;
        return rawBudget;
      })
      .sort(sortByName);
    const expenses: ExpenseDocument[] = await db.expenses
      .find()
      .where('date')
      .gte('2000-01-01')
      .lte('2100-12-31')
      .exec();
    const sortedExpenses = expenses
      .map((expense) => {
        const rawExpense = expense.toJSON();
        delete rawExpense._rev;
        return rawExpense;
      })
      .sort(sortByDate);

    return { budgets: sortedBudgets, expenses: sortedExpenses };
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
  db: RxDatabase,
  syncToken: string,
  replaceData: boolean,
  budgets: T.Budget[],
  expenses: T.Expense[],
) => {
  try {
    if (replaceData) {
      await deleteAllData(db, syncToken);

      // Recreate collections
      await db.addCollections({
        expenses: {
          schema: expenseSchema,
        },
        budgets: {
          schema: budgetSchema,
        },
      });
    }

    const chunkLength = 200;

    if (budgets.length > chunkLength) {
      const chunkedBudgets = splitArrayInChunks(budgets, chunkLength);
      for (const budgetsChunk of chunkedBudgets) {
        await db.budgets.bulkInsert(budgetsChunk);
        // Wait a second, to avoid hitting rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } else {
      await db.budgets.bulkInsert(budgets);
    }

    if (expenses.length > chunkLength) {
      const chunkedExpenses = splitArrayInChunks(expenses, chunkLength);
      for (const expensesChunk of chunkedExpenses) {
        await db.expenses.bulkInsert(expensesChunk);
        // Wait a second, to avoid hitting rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } else {
      await db.expenses.bulkInsert(expenses);
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
  db: RxDatabase,
  originalMonth: string,
  destinationMonth: string,
) => {
  // Don't copy anything until we're done with the first sync
  if (!_hasFinishedFirstSync.expenses || !_hasFinishedFirstSync.budgets) {
    return;
  }
  const originalBudgets = await fetchBudgets(db, originalMonth);
  const destinationBudgets = originalBudgets.map((budget) => {
    const newBudget: T.Budget = { ...budget };
    newBudget.id = `${Date.now().toString()}:${Math.random()}`;
    newBudget.month = destinationMonth;
    delete newBudget._rev;
    return newBudget;
  });

  if (destinationBudgets.length > 0) {
    await db.budgets.bulkInsert(destinationBudgets);
  }
};
