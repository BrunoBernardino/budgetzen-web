(() => {
  const cachedData = {
    budgets: [],
    expenses: [],
  };

  async function initializeApp() {
    window.app = window.app || {};
    initializeLoading();

    // if (navigator && navigator.serviceWorker) {
    //   navigator.serviceWorker.register('/public/js/sw.js');
    // }

    // Expose helper functions
    window.app.isLoggedIn = false;
    window.app.showNotification = showNotification;
    window.app.doLogout = doLogout;
    window.app.getUserSession = getUserSession;
    window.app.showValidSessionElements = showValidSessionElements;
    window.app.hideValidSessionElements = hideValidSessionElements;
    window.app.dataUtils = {
      validateLogin,
      createAccount,
      initializeDb,
      fetchExpenses,
      saveExpense,
      deleteExpense,
      fetchBudgets,
      saveBudget,
      deleteBudget,
      copyBudgets,
      deleteAllData,
      exportAllData,
      importData,
      generateId,
    };
    window.app.utils = {
      formatNumber,
      showFormattedDate,
      sortByDate,
      sortByCount,
      sortByName,
      sortByMissingBudget,
      dateDiffInDays,
      debounce,
    };

    const checkForValidSession = async () => {
      const isUserLoggedIn = await isLoggedIn();

      if (isUserLoggedIn) {
        window.app.isLoggedIn = true;
        showValidSessionElements();

        const userSession = await getUserSession();

        if (userSession.trialExpirationDate) {
          const trialExpirationDate = new Date(userSession.trialExpirationDate);
          const now = new Date();

          if (userSession.subscriptionStatus !== 'active' && trialExpirationDate < now) {
            showNotification('Your trial has expired!', 'error');

            // Give people some time to logout or export
            setTimeout(() => {
              window.location.href = '/pricing';
            }, 10000);
          }
        }
      }
    };

    await checkForValidSession();

    document.dispatchEvent(new Event('app-loaded'));

    window.app.hideLoading();
  }

  function initializeLoading() {
    const loadingComponent = document.getElementById('loading');

    window.app.showLoading = () => loadingComponent.classList.remove('hide');
    window.app.hideLoading = () => loadingComponent.classList.add('hide');
  }

  function showValidSessionElements() {
    const elementsToShow = document.querySelectorAll('[data-has-valid-session]');
    const elementsToHide = document.querySelectorAll('[data-has-invalid-session]');

    elementsToShow.forEach((element) => element.classList.remove('hidden'));
    elementsToHide.forEach((element) => element.classList.add('hidden'));
  }

  function hideValidSessionElements() {
    const elementsToShow = document.querySelectorAll('[data-has-invalid-session]');
    const elementsToHide = document.querySelectorAll('[data-has-valid-session]');

    elementsToShow.forEach((element) => element.classList.remove('hidden'));
    elementsToHide.forEach((element) => element.classList.add('hidden'));
  }

  function showNotification(message, type = 'success') {
    const { Swal } = window;

    const Toast = window.Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: type === 'success' ? 2500 : 0,
      timerProgressBar: type === 'success',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: type,
      title: message,
    });
  }

  async function doLogout() {
    try {
      const { userbase } = window;
      await userbase.signOut();
      hideValidSessionElements();

      Swal.fire('Alright!', 'No idea who you are right now.', 'success');
      return true;
    } catch (error) {
      const { Swal } = window;

      Swal.fire(
        'Something went wrong!',
        `Uh oh! Something wrong happened: ${error && error.message}`,
        'error',
      );
    }

    return false;
  }

  async function isLoggedIn() {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      const session = await userbase.init(userbaseConfig);
      if (session.user) {
        return true;
      }
    } catch (_error) {
      // Do nothing
    }

    return false;
  }

  async function getUserSession() {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      const session = await userbase.init(userbaseConfig);
      return session.user;
    } catch (_error) {
      // Do nothing
    }

    return null;
  }

  async function validateLogin(email, password) {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      await userbase.signIn({
        username: email,
        password,
        sessionLength: userbaseConfig.sessionLength,
        rememberMe: 'local',
      });
      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  async function createAccount(email, password) {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      await userbase.signUp({
        username: email,
        password,
        sessionLength: userbaseConfig.sessionLength,
        rememberMe: 'local',
        email,
      });
      return { success: true };
    } catch (error) {
      console.log(error);
      return { success: false, error };
    }
  }

  function getExpenseFromItem(item) {
    try {
      return {
        id: item.itemId,
        cost: item.item.cost,
        description: item.item.description,
        budget: item.item.budget,
        date: item.item.date,
      };
    } catch (_error) {
      return null;
    }
  }

  function getBudgetFromItem(item) {
    try {
      return {
        id: item.itemId,
        name: item.item.name,
        month: item.item.month,
        value: item.item.value,
      };
    } catch (_error) {
      return null;
    }
  }

  async function loadItemsAsync() {
    const { userbase } = window;
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

    await userbase.openDatabase({
      databaseName: 'budgets',
      changeHandler: (items) => {
        const budgets = items
          .map(getBudgetFromItem)
          .filter((budget) => Boolean(budget));

        hasFinishedLoading.budgets = true;

        cachedData.budgets = budgets;
      },
    });
  }

  async function initializeDb() {
    try {
      const { userbase } = window;
      const { userbaseConfig } = window.app;
      await userbase.init(userbaseConfig);

      await loadItemsAsync();
    } catch (error) {
      console.log(error);
      showNotification(error, 'error');
    }
  }

  const hasFinishedLoading = {
    budgets: false,
    expenses: false,
  };

  async function fetchBudgets(month) {
    try {
      // Very ugly, but... works.
      while (!hasFinishedLoading.budgets) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }

      const sortedBudgets = cachedData.budgets
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

      return sortedBudgets;
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong fetching budgets.',
      });

      console.error(error);
    }

    return [];
  }

  async function fetchExpenses(month) {
    try {
      // Very ugly, but... works.
      while (!hasFinishedLoading.expenses) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }

      const sortedExpenses = cachedData.expenses
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

      return sortedExpenses;
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong fetching expenses.',
      });

      console.error(error);
    }

    return [];
  }

  async function saveBudget(budget) {
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

      const { userbase } = window;

      if (budget.id === 'newBudget') {
        budget.id = `${generateId()}`;

        await userbase.insertItem({
          databaseName: 'budgets',
          item: {
            name: budget.name,
            value: budget.value,
            month: budget.month,
          },
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
          },
          itemId: budget.id,
        });

        // Update all expenses with the previous budget name to the new one, if it changed
        if (oldName !== newName) {
          const matchingExpenses = (
            await fetchExpenses(existingBudget.month)
          ).filter((expense) => expense.budget === oldName);

          const updateChunks = splitArrayInChunks(
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
                },
                itemId: expense.id,
              })),
            });
          }
        }
      }

      return true;
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong saving that budget.',
      });

      console.error(error);
    }

    return false;
  }

  async function saveExpense(expense) {
    try {
      if (!expense.cost || typeof expense.cost !== 'number') {
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
        const matchingExpense = (await fetchExpenses()).find(
          (_expense) => _expense.description === expense.description,
        );

        if (matchingExpense && matchingExpense.budget) {
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
        const newBudgetId = `${generateId()}`;

        await userbase.insertItem({
          databaseName: 'budgets',
          item: {
            name: expense.budget,
            month: expense.date.substring(0, 7),
            value: 100,
          },
          itemId: newBudgetId,
        });
      }

      const { userbase } = window;

      if (expense.id === 'newExpense') {
        expense.id = `${generateId()}`;

        await userbase.insertItem({
          databaseName: 'expenses',
          item: {
            cost: expense.cost,
            description: expense.description,
            budget: expense.budget,
            date: expense.date,
          },
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
          },
          itemId: expense.id,
        });
      }

      return true;
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong saving that expense.',
      });

      console.error(error);
    }

    return false;
  }

  async function deleteBudget(budgetId) {
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
            'There are expenses using this budget. You can\'t delete a budget with expenses',
            'error',
          );
          return false;
        }
      }

      const { userbase } = window;

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
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong deleting that budget.',
      });

      console.error(error);
    }

    return false;
  }

  async function deleteExpense(expenseId) {
    try {
      const { userbase } = window;

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
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong deleting that expense.',
      });

      console.error(error);
    }

    return false;
  }

  async function deleteAllData() {
    const budgets = await fetchBudgets();
    const expenses = await fetchExpenses();

    const deleteBudgetChunks = splitArrayInChunks(budgets, 10);
    const deleteExpenseChunks = splitArrayInChunks(expenses, 10);

    const { userbase } = window;

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
  }

  async function exportAllData() {
    // Don't export anything until we're done with the first full load
    if (!hasFinishedLoading.budgets || !hasFinishedLoading.expenses) {
      return {};
    }

    try {
      const budgets = (await fetchBudgets()).sort(sortByName);
      const expenses = (await fetchExpenses()).sort(sortByDate);

      return { budgets, expenses };
    } catch (error) {
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong exporting data.',
      });

      console.error(error);
    }

    return {};
  }

  async function importData(replaceData, budgets, expenses) {
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

      const finalBudgetsToAdd = [];

      for (const budget of budgets) {
        const newBudgetId = `${generateId()}`;
        const newBudget = {
          id: newBudgetId,
          name: budget.name,
          value: budget.value,
          month: budget.month,
        };

        finalBudgetsToAdd.push(newBudget);
      }

      const addBudgetChunks = splitArrayInChunks(
        finalBudgetsToAdd,
        10,
      );

      const { userbase } = window;

      for (const budgetsToAdd of addBudgetChunks) {
        await userbase.putTransaction({
          databaseName: 'budgets',
          operations: budgetsToAdd.map((budget) => ({
            command: 'Insert',
            item: {
              name: budget.name,
              value: budget.value,
              month: budget.month,
            },
            itemId: budget.id,
          })),
        });

        // Wait a second, to avoid hitting rate limits
        await new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      }

      const finalExpensesToAdd = [];

      for (const expense of expenses) {
        const newExpenseId = `${generateId()}`;
        const newExpense = {
          id: newExpenseId,
          cost: expense.cost,
          budget: expense.budget,
          description: expense.description,
          date: expense.date,
        };

        finalExpensesToAdd.push(newExpense);
      }

      const addExpenseChunks = splitArrayInChunks(
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
            },
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
      const { Swal } = window;

      Swal.fire({
        title: 'Uh-oh',
        text: 'Something went wrong importing data.',
      });

      console.error(error);
    }

    return false;
  }

  async function copyBudgets(originalMonth, destinationMonth) {
    // Don't copy anything until we're done with the first full load
    if (!hasFinishedLoading.budgets || !hasFinishedLoading.expenses) {
      return;
    }

    const originalBudgets = await fetchBudgets(originalMonth);
    const destinationBudgets = originalBudgets.map((budget) => {
      const newBudget = { ...budget };
      newBudget.id = `${generateId()}`;
      newBudget.month = destinationMonth;
      return newBudget;
    });
    if (destinationBudgets.length > 0) {
      try {
        const finalBudgetsToAdd = [];

        for (const budget of destinationBudgets) {
          const newBudget = {
            id: budget.id,
            name: budget.name,
            value: budget.value,
            month: budget.month,
          };

          finalBudgetsToAdd.push(newBudget);
        }

        const addBudgetChunks = splitArrayInChunks(
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
              },
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
  }

  function generateId() {
    return `${Date.now().toString()}:${Math.random()}`;
  }

  function splitArrayInChunks(array, chunkLength) {
    const chunks = [];
    let chunkIndex = 0;
    const arrayLength = array.length;

    while (chunkIndex < arrayLength) {
      chunks.push(array.slice(chunkIndex, chunkIndex += chunkLength));
    }

    return chunks;
  }

  function sortByDate(objectA, objectB) {
    if (objectA.date < objectB.date) {
      return -1;
    }
    if (objectA.date > objectB.date) {
      return 1;
    }
    return 0;
  }

  function sortByCount(objectA, objectB) {
    if (objectA.count < objectB.count) {
      return 1;
    }
    if (objectA.count > objectB.count) {
      return -1;
    }
    return 0;
  }

  function sortByName(objectA, objectB) {
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

  function sortByMissingBudget(objectA, objectB) {
    const valueA = objectA.value - objectA.expensesCost;
    const valueB = objectB.value - objectB.expensesCost;
    return valueB - valueA;
  }

  const currencyMap = new Map([
    ['$', 'USD'],
    ['€', 'EUR'],
    ['£', 'GBP'],
    ['¥', 'JPY'],
    ['₹', 'INR'],
  ]);

  function formatNumber(currency, number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyMap.get(currency) || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number.parseFloat(`${number}`.replace(',', '.')));
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

  function showFormattedDate(
    stringDate,
    { showDay = true, showYear = false, longMonth = false, longYear = false } = {},
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

  function dateDiffInDays(startDate, endDate) {
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  function isValidDate(dateObject) {
    return new Date(dateObject).toString() !== 'Invalid Date';
  }

  function debounce(callback, waitInMs) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, waitInMs);
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
})();
