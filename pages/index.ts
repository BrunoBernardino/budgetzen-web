import { helpEmail, html, MONTHLY_PRICE, PageContentResult, YEARLY_PRICE } from '/lib/utils.ts';
import verificationCodeModal from '/components/modals/verification-code.ts';

export function pageAction() {
  return new Response('Not Implemented', { status: 501 });
}

export function pageContent() {
  const htmlContent = html`
    <section class="main-section">
      <div data-has-invalid-session>
        <h1>Simple + Encrypted Expense Management</h1>
        <section class="hero">
          <p>
            Budget Zen is a simple and <strong>encrypted</strong> expense management
            app. You can <a href="https://budgetzen.net">learn more about it here</a>, as this
            is the app.
          </p>
          <p>
            Currently it's available on every device via web browser, and you
            can browse its source code.
          </p>
          <p>
            You have a <strong>30-day free trial</strong> (no credit card
            required), and at the end, you can pay <strong>€${YEARLY_PRICE} / year</strong>,
            or <strong>€${MONTHLY_PRICE} / month</strong>, no limits.
          </p>
          <form id="login-form">
            <fieldset class="input-wrapper">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                name="email"
              />
            </fieldset>
            <fieldset class="input-wrapper">
              <label for="password">Password / Encryption Key</label>
              <input
                id="password"
                type="password"
                placeholder="something secret"
                name="password"
              />
            </fieldset>
            <div class="buttons-wrapper">
              <button type="submit" id="login-button">
                Login
              </button>
              <span class="or">or</span>
              <button type="button" id="signup-button">
                Signup
              </button>
            </div>
          </form>
          <p>
            Note that logging in will take up a few seconds. This is
            intentional, in order to generate a safer assymetric encryption key.
            After logging in, the app should be blazing fast in any device.
          </p>
        </section>
        <h2>Need help?</h2>
        <p>
          If you're having any issues or have any questions, <strong><a href="mailto:${helpEmail}">please reach out</a></strong>.
        </p>
      </div>
      
      <div data-has-valid-session class="hidden panels">
        <div class="left-panel">
          <div class="panels">
            <section class="expenses-wrapper">
              <section class="expenses-filter-wrapper">
                <form id="expenses-filter">
                  <fieldset class="input-wrapper">
                    <input
                      id="expenses-filter-search"
                      placeholder="Search for an expense"
                      autocomplete="off"
                      type="text"
                    />
                  </fieldset>
                </form>
                <button id="budgets-filter-button" type="button">≡</button>
              </section>
              <section id="expenses">
              </section>
            </section>
            <section class="budgets-wrapper">
              <section id="month-navigation">
                <svg id="month-navigation-previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M224 480c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l169.4 169.4c12.5 12.5 12.5 32.75 0 45.25C240.4 476.9 232.2 480 224 480z"/></svg>
                <span id="current-month">...</span>
                <svg id="month-navigation-next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M96 480c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L242.8 256L73.38 86.63c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25l-192 192C112.4 476.9 104.2 480 96 480z"/></svg>
              </section>
              
              <section id="budgets">
              </section>
              <button type="button" id="add-budget-button">Add Budget</button>
            </section>
          </div>
        </div>
        <section id="add-expense">
          <form id="add-expense-form">
            <span class="text">
              Fill out the form below to add a new expense.
            </span>
            <fieldset class="input-wrapper">
              <label for="expense-cost">Cost</label>
              <input
                id="expense-cost"
                placeholder="10.99"
                autocomplete="off"
                type="text"
                inputmode="decimal"
              />
            </fieldset>
            <fieldset class="input-wrapper">
              <label for="expense-description">Description</label>
              <input
                id="expense-description"
                placeholder="Lunch"
                type="text"
              />
              <aside id="expense-description-autocomplete-suggestions" class="hidden"></aside>
            </fieldset>
            <fieldset class="input-wrapper">
              <label for="expense-budget">Budget</label>
              <select
                id="expense-budget"
                placeholder="Misc"
                autocomplete="off"
              ></select>
            </fieldset>
            <fieldset class="input-wrapper">
              <label for="expense-date">Date</label>
              <input
                id="expense-date"
                placeholder="Today"
                type="date"
              />
            </fieldset>
            
            <button type="submit" id="add-expense-button">Add Expense</button>
          </form>
        </section>
      </div>
    </section>
    <template id="expense-item">
      <section class="expense-item" data-id="{expense.id}">
        <article>
          <span class="cost">{expense.cost}</span>
          <span class="budget">{expense.budget}</span>
        </article>
        <span class="description">{expense.description}</span>
        <time>{expense.date}</time>
      </section>
    </template>
    <template id="budget-item">
      <section class="budget-item" data-name="{budget.name}">
        <article>
          <span class="cost">{budget.expensesCost} of {budget.value}</span>
          <span class="missing-bar"><span></span></span>
          <span class="name">{budget.name}</span>
        </article>
        <span class="missing">{budget.missing}</span>
      </section>
    </template>
    <template id="budget-select-option">
      <option>{budget.name}</option>
    </template>
    <template id="edit-expense-modal">
      <swal-title>
        Edit expense
      </swal-title>
      <swal-html>
        <form id="edit-expense-form">
          <fieldset class="input-wrapper">
            <label for="edit-expense-cost">Cost</label>
            <input
              id="edit-expense-cost"
              placeholder="10.99"
              autocomplete="off"
              type="text"
              inputmode="decimal"
            />
          </fieldset>
          <fieldset class="input-wrapper">
            <label for="edit-expense-description">Description</label>
            <input
              id="edit-expense-description"
              placeholder="Lunch"
              type="text"
            />
          </fieldset>
          <fieldset class="input-wrapper">
            <label for="edit-expense-budget">Budget</label>
            <select
              id="edit-expense-budget"
              placeholder="Misc"
            ></select>
          </fieldset>
          <fieldset class="input-wrapper">
            <label for="edit-expense-date">Date</label>
            <input
              id="edit-expense-date"
              placeholder="Today"
              type="date"
            />
          </fieldset>
          <fieldset class="input-wrapper">
            <label for="edit-expense-recurring">Is Recurring?</label>
            <select
              id="edit-expense-recurring"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </fieldset>
        </form>
      </swal-html>
      <swal-button type="confirm">
        Save
      </swal-button>
      <swal-button type="cancel">
        Cancel
      </swal-button>
      <swal-button type="deny">
        Delete
      </swal-button>
    </template>
    <template id="edit-budget-modal">
      <swal-title>
        Edit budget
      </swal-title>
      <swal-html>
        <form id="edit-budget-form">
          <fieldset class="input-wrapper">
            <label for="edit-budget-name">Name</label>
            <input
              id="edit-budget-name"
              placeholder="Food"
              type="text"
            />
          </fieldset>
          <fieldset class="input-wrapper">
            <label for="edit-budget-value">Value</label>
            <input
              id="edit-budget-value"
              placeholder="100"
              autocomplete="off"
              type="text"
              inputmode="decimal"
            />
          </fieldset>
          <fieldset class="input-wrapper">
            <label for="edit-budget-month">Month</label>
            <input
              id="edit-budget-month"
              placeholder="Today"
              type="date"
            />
          </fieldset>
        </form>
      </swal-html>
      <swal-button type="confirm">
        Save
      </swal-button>
      <swal-button type="cancel">
        Cancel
      </swal-button>
      <swal-button type="deny">
        Delete
      </swal-button>
    </template>
    <template id="budgets-filter-modal">
      <swal-title>
        Filter by Budgets
      </swal-title>
      <swal-html>
        <form id="budgets-filter-form">
        </form>
      </swal-html>
      <swal-button type="cancel">
        Close
      </swal-button>
    </template>
    <template id="budgets-filter-modal-budget-item">
      <fieldset class="input-wrapper">
        <label for="budget-filter-name-{budget.id}" class="checkbox">
          <span>{budget.name}</span>
          <input
            id="budget-filter-name-{budget.id}"
            type="checkbox"
            value="{budget.name}"
          />
        </label>
      </fieldset>
    </template>
    <template id="choose-month-modal">
      <swal-title>
        Navigate to month
      </swal-title>
      <swal-html>
        <form id="choose-month-form">
          <fieldset class="input-wrapper">
            <label for="choose-month-input">Month</label>
            <input
              id="choose-month-input"
              type="date"
            />
          </fieldset>
        </form>
      </swal-html>
      <swal-button type="confirm">
        Go
      </swal-button>
      <swal-button type="cancel">
        Cancel
      </swal-button>
    </template>

    ${verificationCodeModal()}
    
    <script src="/public/ts/index.ts" type="module"></script>
  `;

  return {
    htmlContent,
    titlePrefix: '',
  } as PageContentResult;
}
