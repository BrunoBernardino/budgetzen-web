import { Budget, Expense } from '/lib/types.ts';
import {
  BudgetToShow,
  checkForValidSession,
  commonInitializer,
  copyBudgetsAndExpenses,
  createAccount,
  debounce,
  deleteBudget,
  deleteExpense,
  fetchBudgets,
  fetchExpenses,
  formatNumber,
  saveBudget,
  saveExpense,
  showFormattedDate,
  showNotification,
  showValidSessionElements,
  sortByMissingBudget,
  SupportedCurrencySymbol,
  validateLogin,
} from './utils.ts';

document.addEventListener('app-loaded', async () => {
  await checkForValidSession();

  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const loginButton = document.getElementById('login-button') as HTMLButtonElement;
  const signupButton = document.getElementById('signup-button') as HTMLButtonElement;

  const expensesFilterForm = document.getElementById('expenses-filter') as HTMLFormElement;
  const expensesFilterSearchInput = document.getElementById('expenses-filter-search') as HTMLInputElement;
  const budgetsFilterButton = document.getElementById('budgets-filter-button') as HTMLButtonElement;
  const addBudgetButton = document.getElementById('add-budget-button') as HTMLButtonElement;

  const expensesList = document.getElementById('expenses') as HTMLDivElement;
  const budgetsList = document.getElementById('budgets') as HTMLDivElement;
  const addExpenseForm = document.getElementById('add-expense-form') as HTMLFormElement;
  const addExpenseButton = document.getElementById('add-expense-button') as HTMLButtonElement;
  const expenseCostInput = document.getElementById('expense-cost') as HTMLInputElement;
  const expenseDescriptionInput = document.getElementById('expense-description') as HTMLInputElement;
  const expenseDescriptionAutocompleteSuggestionsList = document.getElementById(
    'expense-description-autocomplete-suggestions',
  ) as HTMLDivElement;
  const expenseBudgetSelect = document.getElementById('expense-budget') as HTMLSelectElement;
  const expenseDateInput = document.getElementById('expense-date') as HTMLInputElement;
  const monthNavigationPreviousButton = document.getElementById('month-navigation-previous') as HTMLButtonElement;
  const monthNavigationNextButton = document.getElementById('month-navigation-next') as HTMLButtonElement;
  const monthNavigationLabel = document.getElementById('current-month')!;

  let currentMonth = (new Date().toISOString()).substring(0, 7);
  let currency: SupportedCurrencySymbol = '$';
  const budgetFilters = new Set<string>();
  const uniqueExpenseNames = new Set<string>();

  async function login(event: MouseEvent | SubmitEvent) {
    loginButton.textContent = 'Logging in...';
    await loginOrSignup(event, false);
    loginButton.textContent = 'Login';
  }

  async function signup(event: MouseEvent | SubmitEvent) {
    signupButton.textContent = 'Signing up...';
    await loginOrSignup(event, true);
    signupButton.textContent = 'Signup';
  }

  let isLoggingInOrSigningUp = false;

  async function loginOrSignup(event: MouseEvent | SubmitEvent, isSigningUp?: boolean) {
    event.preventDefault();
    event.stopPropagation();

    if (isLoggingInOrSigningUp) {
      return;
    }

    isLoggingInOrSigningUp = true;
    window.app.showLoading();

    const email = emailInput.value;
    const password = passwordInput.value;

    const loginOrSignupMethod = isSigningUp ? createAccount : validateLogin;

    const { success, error } = await loginOrSignupMethod(email, password);

    if (success) {
      showNotification('Logged in successfully.', 'success');

      showValidSessionElements();
      loginForm.reset();
      initializePage();
    } else {
      if (error) {
        showNotification('Invalid email/password.', 'error');
        window.app.hideLoading();
      }
    }

    isLoggingInOrSigningUp = false;
  }

  function getExpenseItemHtmlElement(expense: Expense) {
    const template = document.getElementById('expense-item') as HTMLTemplateElement;

    const clonedElement = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;
    clonedElement.dataset.id = expense.id;

    const costElement = clonedElement.querySelector('article span.cost') as HTMLSpanElement;
    costElement.textContent = formatNumber(currency, Number(expense.cost));

    const budgetElement = clonedElement.querySelector('article span.budget') as HTMLSpanElement;
    budgetElement.textContent = expense.budget;

    const descriptionElement = clonedElement.querySelector('span.description') as HTMLSpanElement;
    descriptionElement.textContent = expense.description;

    const dateElement = clonedElement.querySelector('time') as HTMLTimeElement;
    dateElement.textContent = showFormattedDate(expense.date);

    return clonedElement;
  }

  function getBudgetItemHtmlElement(budget: BudgetToShow) {
    const template = document.getElementById('budget-item') as HTMLTemplateElement;

    const clonedElement = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;
    clonedElement.dataset.name = budget.name;

    const costElement = clonedElement.querySelector('article span.cost') as HTMLSpanElement;
    costElement.textContent = `${formatNumber(currency, budget.expensesCost)} of ${
      formatNumber(currency, Number(budget.value))
    }`;

    const missingBarWrapperElement = clonedElement.querySelector('span.missing-bar') as HTMLSpanElement;
    const missingBarElement = missingBarWrapperElement.querySelector('span') as HTMLSpanElement;
    let missingBarPercent = Math.floor(100 * budget.expensesCost / Number(budget.value));
    if (missingBarPercent >= 100) {
      missingBarPercent = 100;
      missingBarElement.style.backgroundColor = '#611928';
    }
    missingBarElement.style.width = `${missingBarPercent}%`;

    const nameElement = clonedElement.querySelector('article span.name') as HTMLSpanElement;
    nameElement.textContent = budget.name;

    const missingElement = clonedElement.querySelector('span.missing') as HTMLSpanElement;
    missingElement.textContent = formatNumber(currency, Number(budget.value) - budget.expensesCost);

    if (budget.id === 'total') {
      clonedElement.classList.add('total');
    }

    return clonedElement;
  }

  function getBudgetSelectOptionHtmlElement(budgetName: string) {
    const template = document.getElementById('budget-select-option') as HTMLTemplateElement;

    const clonedElement = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;
    clonedElement.textContent = budgetName;

    return clonedElement;
  }

  function getBudgetsFilterModalBudgetItemHtmlElement(budget: Budget) {
    const template = document.getElementById('budgets-filter-modal-budget-item') as HTMLTemplateElement;

    const clonedElement = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;

    const labelElement = clonedElement.querySelector('label') as HTMLLabelElement;
    labelElement.attributes[0].value = `budget-filter-name-${budget.id}`;

    const nameElement = clonedElement.querySelector('label span') as HTMLSpanElement;
    nameElement.textContent = budget.name;

    const inputElement = clonedElement.querySelector('input') as HTMLInputElement;
    inputElement.value = budget.name;
    inputElement.id = `budget-filter-name-${budget.id}`;

    if (budgetFilters.has(budget.name)) {
      inputElement.checked = true;
    }

    return clonedElement;
  }

  async function showData(isComingFromEmptyState = false) {
    window.app.showLoading();

    const user = await checkForValidSession();

    currency = user?.extra.currency || '$';

    monthNavigationLabel.textContent = showFormattedDate(currentMonth, {
      showDay: false,
      showYear: true,
      longMonth: true,
      longYear: true,
    });

    const allBudgets = await fetchBudgets('all');
    const budgets = await fetchBudgets(currentMonth);
    const expenses = await fetchExpenses(currentMonth);

    // IIFE because we don't want to wait for all expenses in the main event-loop, but need it to get unique names
    (async () => {
      const yearExpenses = await fetchExpenses('year');
      const recentExpenseNames: string[] = []; // This is necessary because you can't sort a Set, but it follows insertion order
      yearExpenses.forEach((expense) => recentExpenseNames.push(expense.description));
      recentExpenseNames.sort();
      recentExpenseNames.forEach((expenseName) => uniqueExpenseNames.add(expenseName));
    })();

    const budgetOptions = new Set([{ name: 'Misc' }, ...allBudgets].map((budget) => budget.name));

    let totalCost = 0;
    let totalBudget = 0;

    const budgetsToShow: BudgetToShow[] = [...budgets]
      .map((budget) => {
        const budgetToShow = {
          expensesCost: 0,
          ...budget,
        };

        // Calculate expenses cost
        expenses.forEach((expense) => {
          if (expense.budget === budget.name) {
            budgetToShow.expensesCost += Number(expense.cost);
          }
        });

        totalCost += budgetToShow.expensesCost;
        totalBudget += Number(budgetToShow.value);

        return budgetToShow;
      })
      .sort(sortByMissingBudget);

    // Add Total budget
    if (budgetsToShow.length > 0) {
      budgetsToShow.unshift({
        id: 'total',
        name: 'Total',
        value: totalBudget.toFixed(2),
        expensesCost: totalCost,
        month: currentMonth,
      });
    }

    // If this is for the current or next month and there are no budgets, create budgets based on the previous/current month.
    if (budgets.length === 0 && !isComingFromEmptyState) {
      const currentMonthDate = new Date(`${currentMonth}-15`);
      currentMonthDate.setMonth(currentMonthDate.getMonth());
      const actualCurrentMonth = currentMonthDate.toISOString().substring(0, 7);

      const nextMonthDate = new Date();
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      const nextMonth = nextMonthDate.toISOString().substring(0, 7);

      if (currentMonth === nextMonth || currentMonth === actualCurrentMonth) {
        const previousMonthDate = new Date(`${currentMonth}-15`);
        previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
        const previousMonth = previousMonthDate.toISOString().substring(0, 7);

        await copyBudgetsAndExpenses(previousMonth, currentMonth);
        await showData(true);
        return;
      }
    }

    let expensesToShow = expenses;

    if (expensesFilterSearchInput.value) {
      expensesToShow = expensesToShow.filter((expense) =>
        expense.description
          .toLowerCase()
          .includes(expensesFilterSearchInput.value.toLowerCase())
      );
    }

    if (budgetFilters.size > 0) {
      budgetsFilterButton.classList.add('active');
      expensesToShow = expensesToShow.filter((expense) => budgetFilters.has(expense.budget));
    } else {
      budgetsFilterButton.classList.remove('active');
    }

    // Show month's budgets
    budgetsList.replaceChildren();
    for (const budget of budgetsToShow) {
      const element = getBudgetItemHtmlElement(budget);

      if (budget.id !== 'total') {
        element.addEventListener('click', () => showEditBudgetModal(budget));
      }

      budgetsList.appendChild(element);
    }

    if (budgetsToShow.length === 0) {
      budgetsList.innerHTML = '<span class="no-data">There are no budgets yet. Add some!</span>';
    }

    // Show month's expenses
    expensesList.replaceChildren();
    for (const expense of expensesToShow) {
      const element = getExpenseItemHtmlElement(expense);

      element.addEventListener('click', () => showEditExpenseModal(expense));

      expensesList.appendChild(element);
    }

    if (expensesToShow.length === 0) {
      expensesList.innerHTML = '<span class="no-data">No expenses found for this month. Add some!</span>';
    }

    // Show all budgets in expenseBudgetSelect
    expenseBudgetSelect.replaceChildren();
    for (const budgetName of budgetOptions.values()) {
      const element = getBudgetSelectOptionHtmlElement(budgetName);

      expenseBudgetSelect.appendChild(element);
    }

    window.app.hideLoading();
  }

  async function navigateToMonth(month: string) {
    currentMonth = month;
    budgetFilters.clear();
    await showData();
  }

  async function navigateToPreviousMonth() {
    const previousMonthDate = new Date(`${currentMonth}-15`);
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
    const month = previousMonthDate.toISOString().substring(0, 7);

    await navigateToMonth(month);
  }

  async function navigateToNextMonth() {
    const currentMonthDate = new Date(`${currentMonth}-15`);
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    const month = currentMonthDate.toISOString().substring(0, 7);

    const nextMonthDate = new Date();
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = nextMonthDate.toISOString().substring(0, 7);

    if (month > nextMonth) {
      showNotification('Cannot travel further into the future!', 'error');
      return;
    }

    await navigateToMonth(month);
  }

  function initializePage() {
    showData();
    commonInitializer();
  }

  let isAddingExpense = false;

  async function addExpense(event: MouseEvent | SubmitEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (isAddingExpense) {
      return;
    }

    addExpenseButton.textContent = 'Adding...';
    isAddingExpense = true;
    window.app.showLoading();
    hideAutocompleteSuggestions();

    const cost = Number.parseFloat(expenseCostInput.value.replace(',', '.'));
    const description = expenseDescriptionInput.value;
    const budget = expenseBudgetSelect.value;
    const date = expenseDateInput.value;

    const parsedExpense = {
      id: 'newExpense',
      cost: cost.toFixed(2),
      description,
      budget,
      date,
      is_recurring: false,
    };

    const success = await saveExpense(parsedExpense);

    if (success) {
      showNotification('Expense added successfully.');
      addExpenseForm.reset();
    }

    await showData();

    window.app.hideLoading();
    isAddingExpense = false;
    addExpenseButton.textContent = 'Add Expense';
  }

  async function showEditExpenseModal(expense: Expense) {
    const { Swal } = window;

    let isUpdating = false;

    await Swal.fire({
      template: '#edit-expense-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      preConfirm: async () => {
        const updatedExpense = {
          id: expense.id,
          cost: Number.parseFloat(
            (document.getElementById('edit-expense-cost') as HTMLInputElement).value.replace(',', '.'),
          ).toFixed(2),
          description: (document.getElementById('edit-expense-description') as HTMLInputElement).value,
          budget: (document.getElementById('edit-expense-budget') as HTMLSelectElement).value,
          date: (document.getElementById('edit-expense-date') as HTMLInputElement).value,
          is_recurring: (document.getElementById('edit-expense-recurring') as HTMLSelectElement).value === 'yes',
        };

        const saveExpenseButton = Swal.getConfirmButton();

        if (isUpdating) {
          return false;
        }

        saveExpenseButton.textContent = 'Saving...';
        isUpdating = true;
        window.app.showLoading();

        const success = await saveExpense(updatedExpense);

        if (success) {
          showNotification('Expense updated successfully.');
        }

        await showData();

        window.app.hideLoading();
        isUpdating = false;
        saveExpenseButton.textContent = 'Save';

        return Boolean(success);
      },
      preDeny: async () => {
        const deleteExpenseButton = Swal.getDenyButton();

        if (isUpdating) {
          return false;
        }

        const { isConfirmed } = await Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to recover this expense!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: 'red',
          confirmButtonText: 'Yes, delete it!',
        });

        if (isConfirmed) {
          deleteExpenseButton.textContent = 'Deleting...';
          isUpdating = true;
          window.app.showLoading();

          const success = await deleteExpense(expense.id);

          if (success) {
            showNotification('Expense deleted successfully.');
          }

          await showData();

          window.app.hideLoading();
          isUpdating = false;
          deleteExpenseButton.textContent = 'Delete';

          return Boolean(success);
        }

        return false;
      },
      willOpen: async () => {
        // Show all budgets in expenseBudgetSelect
        const allBudgets = await fetchBudgets('all');
        const budgetOptions = new Set([{ name: 'Misc' }, ...allBudgets].map((budget) => budget.name));
        const budgetSelect = document.getElementById('edit-expense-budget') as HTMLSelectElement;
        budgetSelect.replaceChildren();
        for (const budgetName of budgetOptions.values()) {
          const element = getBudgetSelectOptionHtmlElement(budgetName);

          budgetSelect.appendChild(element);
        }

        (document.getElementById('edit-expense-cost') as HTMLInputElement).value = expense.cost;
        (document.getElementById('edit-expense-description') as HTMLInputElement).value = expense.description;
        (document.getElementById('edit-expense-budget') as HTMLSelectElement).value = expense.budget;
        (document.getElementById('edit-expense-date') as HTMLInputElement).value = expense.date;
        (document.getElementById('edit-expense-recurring') as HTMLSelectElement).value = expense.is_recurring
          ? 'yes'
          : 'no';
        (document.getElementById('edit-expense-recurring') as HTMLSelectElement).selectedIndex = expense.is_recurring
          ? 1
          : 0;
      },
    });
  }

  async function showEditBudgetModal(budget: BudgetToShow) {
    const { Swal } = window;

    let isUpdating = false;

    await Swal.fire({
      template: '#edit-budget-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      preConfirm: async () => {
        const updatedBudget = {
          id: budget.id,
          name: (document.getElementById('edit-budget-name') as HTMLInputElement).value,
          value: Number.parseFloat(
            (document.getElementById('edit-budget-value') as HTMLInputElement).value.replace(',', '.'),
          ).toFixed(2),
          month: (document.getElementById('edit-budget-month') as HTMLInputElement).value.substring(0, 7),
        };

        const saveBudgetButton = Swal.getConfirmButton();

        if (isUpdating) {
          return false;
        }

        saveBudgetButton.textContent = 'Saving...';
        isUpdating = true;
        window.app.showLoading();

        const success = await saveBudget(updatedBudget);

        if (success) {
          showNotification('Budget updated successfully.');
        }

        await showData();

        window.app.hideLoading();
        isUpdating = false;
        saveBudgetButton.textContent = 'Save';

        return Boolean(success);
      },
      preDeny: async () => {
        const deleteBudgetButton = Swal.getDenyButton();

        if (isUpdating) {
          return false;
        }

        const { isConfirmed } = await Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to recover this budget!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: 'red',
          confirmButtonText: 'Yes, delete it!',
        });

        if (isConfirmed) {
          deleteBudgetButton.textContent = 'Deleting...';
          isUpdating = true;
          window.app.showLoading();

          const success = await deleteBudget(budget.id);

          if (success) {
            showNotification('Budget deleted successfully.');
          }

          await showData();

          window.app.hideLoading();
          isUpdating = false;
          deleteBudgetButton.textContent = 'Delete';

          return Boolean(success);
        }

        return false;
      },
      willOpen: () => {
        (document.getElementById('edit-budget-name') as HTMLInputElement).value = budget.name;
        (document.getElementById('edit-budget-value') as HTMLInputElement).value = budget.value;
        (document.getElementById('edit-budget-month') as HTMLInputElement).value = `${budget.month}-15`;
      },
    });
  }

  async function showAddBudgetModal() {
    const { Swal } = window;

    let isAdding = false;

    await Swal.fire({
      template: '#edit-budget-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      showDenyButton: false,
      title: 'Add Budget',
      preConfirm: async () => {
        const newBudget = {
          id: 'newBudget',
          name: (document.getElementById('edit-budget-name') as HTMLInputElement).value,
          value: Number.parseFloat(
            (document.getElementById('edit-budget-value') as HTMLInputElement).value.replace(',', '.'),
          ).toFixed(2),
          month: (document.getElementById('edit-budget-month') as HTMLInputElement).value.substring(0, 7),
        };

        const saveBudgetButton = Swal.getConfirmButton();

        if (isAdding) {
          return false;
        }

        saveBudgetButton.textContent = 'Adding...';
        isAdding = true;
        window.app.showLoading();

        const success = await saveBudget(newBudget);

        if (success) {
          showNotification('Budget added successfully.');
        }

        await showData();

        window.app.hideLoading();
        isAdding = false;
        saveBudgetButton.textContent = 'Add';

        return Boolean(success);
      },
      willOpen: () => {
        const saveBudgetButton = Swal.getConfirmButton();
        saveBudgetButton.textContent = 'Add';

        (document.getElementById('edit-budget-name') as HTMLInputElement).value = '';
        (document.getElementById('edit-budget-value') as HTMLInputElement).value = '100';
        (document.getElementById('edit-budget-month') as HTMLInputElement).value = `${currentMonth}-15`;
      },
    });
  }

  async function showBudgetsFilterModal() {
    const { Swal } = window;

    await Swal.fire({
      template: '#budgets-filter-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      showConfirmButton: false,
      didClose: () => {
        budgetsFilterButton.blur();
      },
      willOpen: async () => {
        // Show month's budgets in #budgets-filter-form
        const monthBudgets = await fetchBudgets(currentMonth);
        const budgetsFilterForm = document.getElementById('budgets-filter-form') as HTMLFormElement;
        budgetsFilterForm.replaceChildren();
        for (const budget of monthBudgets) {
          const element = getBudgetsFilterModalBudgetItemHtmlElement(budget);

          const inputElement = element.querySelector('input') as HTMLInputElement;

          inputElement.addEventListener('change', () => {
            if (!inputElement.checked) {
              budgetFilters.delete(budget.name);
            } else {
              budgetFilters.add(budget.name);
            }

            showData();
          });

          budgetsFilterForm.appendChild(element);
        }
      },
    });
  }

  async function chooseMonthModal() {
    const { Swal } = window;

    const { value: newMonth } = await Swal.fire({
      template: '#choose-month-modal',
      focusConfirm: false,
      allowEscapeKey: true,
      preConfirm: () => {
        const monthInput = (document.getElementById('choose-month-input') as HTMLInputElement).value;
        const month = monthInput.substring(0, 7);

        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        const nextMonth = nextMonthDate.toISOString().substring(0, 7);

        if (month > nextMonth) {
          showNotification('Cannot travel further into the future!', 'error');
          return false;
        }

        return month;
      },
      willOpen: () => {
        (document.getElementById('choose-month-input') as HTMLInputElement).value = `${currentMonth}-15`;
      },
    });

    if (newMonth) {
      await navigateToMonth(newMonth);
    }
  }

  function showAutocompleteSuggestions() {
    const { value } = expenseDescriptionInput;

    if (value.length <= 2 || isAddingExpense) {
      hideAutocompleteSuggestions();
      return;
    }

    const suggestedExpenseNames = new Set<string>();

    uniqueExpenseNames.forEach((expenseName) => {
      if (expenseName.toLocaleLowerCase().includes(value.toLocaleLowerCase())) {
        suggestedExpenseNames.add(expenseName);
      }
    });

    expenseDescriptionAutocompleteSuggestionsList.replaceChildren();
    suggestedExpenseNames.forEach((expenseName) => {
      const expenseNameElement = document.createElement('span');
      expenseNameElement.innerText = expenseName;

      expenseNameElement.addEventListener('click', () => {
        expenseDescriptionInput.value = expenseName;
        expenseDescriptionInput.focus();
      });

      expenseDescriptionAutocompleteSuggestionsList.appendChild(expenseNameElement);
    });

    expenseDescriptionAutocompleteSuggestionsList.classList.remove('hidden');
  }

  function hideAutocompleteSuggestions() {
    expenseDescriptionAutocompleteSuggestionsList.classList.add('hidden');
  }

  if (window.app.isLoggedIn) {
    initializePage();
  }

  loginForm.addEventListener('submit', login);
  signupButton.addEventListener('click', signup);
  expensesFilterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    showData();
  });
  addExpenseForm.addEventListener('submit', addExpense);
  addBudgetButton.addEventListener('click', showAddBudgetModal);
  budgetsFilterButton.addEventListener('click', showBudgetsFilterModal);
  expensesFilterSearchInput.addEventListener('keyup', debounce(showData, 150));
  monthNavigationPreviousButton.addEventListener('click', navigateToPreviousMonth);
  monthNavigationNextButton.addEventListener('click', navigateToNextMonth);
  monthNavigationLabel.addEventListener('click', chooseMonthModal);
  expenseDescriptionInput.addEventListener('focus', showAutocompleteSuggestions);
  expenseDescriptionInput.addEventListener('keyup', debounce(showAutocompleteSuggestions, 150));
  expenseDescriptionInput.addEventListener('blur', debounce(hideAutocompleteSuggestions, 150));
});
