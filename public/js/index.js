(() => {
  document.addEventListener('app-loaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    const expensesFilterSearchInput = document.getElementById('expenses-filter-search');
    const budgetsFilterButton = document.getElementById('budgets-filter-button');
    const addBudgetButton = document.getElementById('add-budget-button');

    const expensesList = document.getElementById('expenses');
    const budgetsList = document.getElementById('budgets');
    const addExpenseForm = document.getElementById('add-expense-form');
    const addExpenseButton = document.getElementById('add-expense-button');
    const expenseCostInput = document.getElementById('expense-cost');
    const expenseDescriptionInput = document.getElementById('expense-description');
    const expenseBudgetSelect = document.getElementById('expense-budget');
    const expenseDateInput = document.getElementById('expense-date');

    const monthNavigationPreviousButton = document.getElementById('month-navigation-previous');
    const monthNavigationNextButton = document.getElementById('month-navigation-next');
    const monthNavigationLabel = document.getElementById('current-month');

    let currentMonth = (new Date().toISOString()).substring(0, 7);
    let currency = '$';
    const budgetFilters = new Set();

    async function login(event) {
      loginButton.textContent = 'Logging in...';
      await loginOrSignup(event, false);
      loginButton.textContent = 'Login';
    }

    async function signup(event) {
      signupButton.textContent = 'Signing up...';
      await loginOrSignup(event, true);
      signupButton.textContent = 'Signup';
    }

    let isLoggingInOrSigningUp = false;

    async function loginOrSignup(event, isSigningUp) {
      event.preventDefault();
      event.stopPropagation();

      if (isLoggingInOrSigningUp) {
        return;
      }

      isLoggingInOrSigningUp = true;
      window.app.showLoading();

      const email = emailInput.value;
      const password = passwordInput.value;

      const loginOrSignupMethod = isSigningUp ? window.app.dataUtils.createAccount : window.app.dataUtils.validateLogin;

      const { success, error } = await loginOrSignupMethod(email, password);

      if (success) {
        const { Swal } = window;

        Swal.fire(
          'Alright!',
          'That looks alright. Let\'s get on with it!',
          'success',
        );

        window.app.showValidSessionElements();
        loginForm.reset();
        await initializePage();
      } else {
        if (error) {
          window.app.showNotification(error, 'error');
        }
      }

      window.app.hideLoading();
      isLoggingInOrSigningUp = false;
    }

    function getExpenseItemHtmlElement(expense) {
      const template = document.getElementById('expense-item');

      const clonedElement = template.content.firstElementChild.cloneNode(true);
      clonedElement.dataset.id = expense.id;

      const costElement = clonedElement.querySelector('article span.cost');
      costElement.textContent = window.app.utils.formatNumber(currency, expense.cost);

      const budgetElement = clonedElement.querySelector('article span.budget');
      budgetElement.textContent = expense.budget;

      const descriptionElement = clonedElement.querySelector('span.description');
      descriptionElement.textContent = expense.description;

      const dateElement = clonedElement.querySelector('time');
      dateElement.textContent = window.app.utils.showFormattedDate(expense.date);

      return clonedElement;
    }

    function getBudgetItemHtmlElement(budget) {
      const template = document.getElementById('budget-item');

      const clonedElement = template.content.firstElementChild.cloneNode(true);
      clonedElement.dataset.name = budget.name;

      const costElement = clonedElement.querySelector('article span.cost');
      costElement.textContent = `${window.app.utils.formatNumber(currency, budget.expensesCost)} of ${
        window.app.utils.formatNumber(currency, budget.value)
      }`;

      const nameElement = clonedElement.querySelector('article span.name');
      nameElement.textContent = budget.name;

      const missingElement = clonedElement.querySelector('span.missing');
      missingElement.textContent = window.app.utils.formatNumber(currency, budget.value - budget.expensesCost);

      if (budget.id === 'total') {
        clonedElement.classList.add('total');
      }

      return clonedElement;
    }

    function getBudgetSelectOptionHtmlElement(budgetName) {
      const template = document.getElementById('budget-select-option');

      const clonedElement = template.content.firstElementChild.cloneNode(true);
      clonedElement.textContent = budgetName;

      return clonedElement;
    }

    function getBudgetsFilterModalBudgetItemHtmlElement(budget) {
      const template = document.getElementById('budgets-filter-modal-budget-item');

      const clonedElement = template.content.firstElementChild.cloneNode(true);

      const labelElement = clonedElement.querySelector('label');
      labelElement.attributes[0].value = `budget-filter-name-${budget.id}`;

      const nameElement = clonedElement.querySelector('label span');
      nameElement.textContent = budget.name;

      const inputElement = clonedElement.querySelector('input');
      inputElement.value = budget.name;
      inputElement.id = `budget-filter-name-${budget.id}`;

      if (budgetFilters.has(budget.name)) {
        inputElement.checked = true;
      }

      return clonedElement;
    }

    async function showData(isComingFromEmptyState = false) {
      monthNavigationLabel.textContent = window.app.utils.showFormattedDate(currentMonth, {
        showDay: false,
        showYear: true,
        longMonth: true,
        longYear: true,
      });

      const allBudgets = await window.app.dataUtils.fetchBudgets();
      const budgets = await window.app.dataUtils.fetchBudgets(currentMonth);
      const expenses = await window.app.dataUtils.fetchExpenses(currentMonth);

      const budgetOptions = new Set([{ name: 'Misc' }, ...allBudgets].map((budget) => budget.name));

      let totalCost = 0;
      let totalBudget = 0;

      const budgetsToShow = [...budgets]
        .map((budget) => {
          const budgetToShow = {
            expensesCost: 0,
            ...budget,
          };

          // Calculate expenses cost
          expenses.forEach((expense) => {
            if (expense.budget === budget.name) {
              budgetToShow.expensesCost += expense.cost;
            }
          });

          totalCost += budgetToShow.expensesCost;
          totalBudget += budgetToShow.value;

          return budgetToShow;
        })
        .sort(window.app.utils.sortByMissingBudget);

      // Add Total budget
      if (budgetsToShow.length > 0) {
        budgetsToShow.unshift({
          id: 'total',
          name: 'Total',
          value: totalBudget,
          expensesCost: totalCost,
          month: currentMonth,
        });
      }

      // If this is for the current or next month and there are no budgets, create budgets based on the previous/current month.
      if (budgets.length === 0 && !isComingFromEmptyState) {
        const currentMonthDate = new Date(`${currentMonth}-15`);
        currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
        const actualCurrentMonth = currentMonthDate.toISOString().substring(0, 7);

        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        const nextMonth = nextMonthDate.toISOString().substring(0, 7);

        if (currentMonth === nextMonth || currentMonth === actualCurrentMonth) {
          const previousMonthDate = new Date(`${currentMonth}-15`);
          previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
          const previousMonth = previousMonthDate.toISOString().substring(0, 7);

          await window.app.dataUtils.copyBudgets(previousMonth, currentMonth);
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
    }

    async function navigateToMonth(month) {
      currentMonth = month;
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
        window.app.showNotification('Cannot travel further into the future!', 'error');
        return;
      }

      await navigateToMonth(month);
    }

    async function initializePage() {
      await window.app.dataUtils.initializeDb();

      const userSession = await window.app.getUserSession();
      currency = userSession.profile?.currency || '$';

      showData();
    }

    let isAddingExpense = false;

    async function addExpense(event) {
      event.preventDefault();
      event.stopPropagation();

      if (isAddingExpense) {
        return;
      }

      addExpenseButton.textContent = 'Adding...';
      isAddingExpense = true;
      window.app.showLoading();

      const cost = Number.parseFloat(expenseCostInput.value.replace(',', '.'));
      const description = expenseDescriptionInput.value;
      const budget = expenseBudgetSelect.value;
      const date = expenseDateInput.value;

      const parsedExpense = {
        id: 'newExpense',
        cost,
        description,
        budget,
        date,
      };

      const success = await window.app.dataUtils.saveExpense(parsedExpense);

      if (success) {
        window.app.showNotification('Expense added successfully.');
        addExpenseForm.reset();
      }

      await showData();

      window.app.hideLoading();
      isAddingExpense = false;
      addExpenseButton.textContent = 'Add Expense';
    }

    async function showEditExpenseModal(expense) {
      const { Swal } = window;

      let isUpdating = false;

      await Swal.fire({
        template: '#edit-expense-modal',
        focusConfirm: false,
        allowEscapeKey: true,
        preConfirm: async () => {
          const updatedExpense = {
            id: expense.id,
            cost: Number.parseFloat(document.getElementById('edit-expense-cost').value.replace(',', '.')),
            description: document.getElementById('edit-expense-description').value,
            budget: document.getElementById('edit-expense-budget').value,
            date: document.getElementById('edit-expense-date').value,
          };

          const saveExpenseButton = Swal.getConfirmButton();

          if (isUpdating) {
            return false;
          }

          saveExpenseButton.textContent = 'Saving...';
          isUpdating = true;
          window.app.showLoading();

          const success = await window.app.dataUtils.saveExpense(updatedExpense);

          if (success) {
            window.app.showNotification('Expense updated successfully.');
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
            text: 'You won\'t be able to recover this expense!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'red',
            confirmButtonText: 'Yes, delete it!',
          });

          if (isConfirmed) {
            deleteExpenseButton.textContent = 'Deleting...';
            isUpdating = true;
            window.app.showLoading();

            const success = await window.app.dataUtils.deleteExpense(expense.id);

            if (success) {
              window.app.showNotification('Expense deleted successfully.');
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
          const allBudgets = await window.app.dataUtils.fetchBudgets();
          const budgetOptions = new Set([{ name: 'Misc' }, ...allBudgets].map((budget) => budget.name));
          const budgetSelect = document.getElementById('edit-expense-budget');
          budgetSelect.replaceChildren();
          for (const budgetName of budgetOptions.values()) {
            const element = getBudgetSelectOptionHtmlElement(budgetName);

            budgetSelect.appendChild(element);
          }

          document.getElementById('edit-expense-cost').value = expense.cost;
          document.getElementById('edit-expense-description').value = expense.description;
          document.getElementById('edit-expense-budget').value = expense.budget;
          document.getElementById('edit-expense-date').value = expense.date;
        },
      });
    }

    async function showEditBudgetModal(budget) {
      const { Swal } = window;

      let isUpdating = false;

      await Swal.fire({
        template: '#edit-budget-modal',
        focusConfirm: false,
        allowEscapeKey: true,
        preConfirm: async () => {
          const updatedBudget = {
            id: budget.id,
            name: document.getElementById('edit-budget-name').value,
            value: Number.parseFloat(document.getElementById('edit-budget-value').value.replace(',', '.')),
            month: document.getElementById('edit-budget-month').value.substring(0, 7),
          };

          const saveBudgetButton = Swal.getConfirmButton();

          if (isUpdating) {
            return false;
          }

          saveBudgetButton.textContent = 'Saving...';
          isUpdating = true;
          window.app.showLoading();

          const success = await window.app.dataUtils.saveBudget(updatedBudget);

          if (success) {
            window.app.showNotification('Budget updated successfully.');
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
            text: 'You won\'t be able to recover this budget!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'red',
            confirmButtonText: 'Yes, delete it!',
          });

          if (isConfirmed) {
            deleteBudgetButton.textContent = 'Deleting...';
            isUpdating = true;
            window.app.showLoading();

            const success = await window.app.dataUtils.deleteBudget(budget.id);

            if (success) {
              window.app.showNotification('Budget deleted successfully.');
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
          document.getElementById('edit-budget-name').value = budget.name;
          document.getElementById('edit-budget-value').value = budget.value;
          document.getElementById('edit-budget-month').value = `${budget.month}-15`;
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
            name: document.getElementById('edit-budget-name').value,
            value: Number.parseFloat(document.getElementById('edit-budget-value').value.replace(',', '.')),
            month: document.getElementById('edit-budget-month').value.substring(0, 7),
          };

          const saveBudgetButton = Swal.getConfirmButton();

          if (isAdding) {
            return false;
          }

          saveBudgetButton.textContent = 'Adding...';
          isAdding = true;
          window.app.showLoading();

          const success = await window.app.dataUtils.saveBudget(newBudget);

          if (success) {
            window.app.showNotification('Budget added successfully.');
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

          document.getElementById('edit-budget-name').value = '';
          document.getElementById('edit-budget-value').value = 100;
          document.getElementById('edit-budget-month').value = `${currentMonth}-15`;
        },
      });
    }

    async function showBudgetsFilterModal() {
      const { Swal } = window;

      await Swal.fire({
        template: '#budgets-filter-modal',
        focusConfirm: false,
        allowEscapeKey: true,
        didClose: () => {
          budgetsFilterButton.blur();
        },
        willOpen: async () => {
          // Show all budgets in #budgets-filter-form
          const allBudgets = await window.app.dataUtils.fetchBudgets();
          const allUniquelyNamedBudgets = allBudgets.reduce((budgetsList, budget) => {
            if (!budgetsList.some((_budget) => budget.name === _budget.name)) {
              budgetsList.push(budget);
            }

            return budgetsList;
          }, []);
          const budgetsFilterForm = document.getElementById('budgets-filter-form');
          budgetsFilterForm.replaceChildren();
          for (const budget of allUniquelyNamedBudgets) {
            const element = getBudgetsFilterModalBudgetItemHtmlElement(budget);

            const inputElement = element.querySelector('input');

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
          const monthInput = document.getElementById('choose-month-input').value;
          const month = monthInput.substring(0, 7);

          const nextMonthDate = new Date();
          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
          const nextMonth = nextMonthDate.toISOString().substring(0, 7);

          if (month > nextMonth) {
            window.app.showNotification('Cannot travel further into the future!', 'error');
            return false;
          }

          return month;
        },
        willOpen: () => {
          document.getElementById('choose-month-input').value = `${currentMonth}-15`;
        },
      });

      if (newMonth) {
        await navigateToMonth(newMonth);
      }
    }

    if (window.app.isLoggedIn) {
      initializePage();
    }

    loginForm.addEventListener('submit', login);
    signupButton.addEventListener('click', signup);
    addExpenseForm.addEventListener('submit', addExpense);
    addBudgetButton.addEventListener('click', showAddBudgetModal);
    budgetsFilterButton.addEventListener('click', showBudgetsFilterModal);
    expensesFilterSearchInput.addEventListener('keyup', window.app.utils.debounce(showData, 150));
    monthNavigationPreviousButton.addEventListener('click', navigateToPreviousMonth);
    monthNavigationNextButton.addEventListener('click', navigateToNextMonth);
    monthNavigationLabel.addEventListener('click', chooseMonthModal);
  });
})();
