import { html, PageContentResult } from '/lib/utils.ts';
import verificationCodeModal from '/components/modals/verification-code.ts';

export function pageAction() {
  return new Response('Not Implemented', { status: 501 });
}

export function pageContent() {
  const htmlContent = html`
    <section class="main-section">
      <h1>Settings</h1>
      <section class="hero" data-has-invalid-session>
        <p>Before you can change your settings, you need to <a href="/">Signup or Login</a> first.</p>
      </section>
      <section class="hidden" data-has-valid-session>
        <h2>Change currency</h2>
        <p>When you change the currency, it only affects the displayed numbers for this client/browser. It won't make any currency conversions.</p>
        <form id="change-currency-form">
          <fieldset class="input-wrapper">
            <label for="new-currency">Currency</label>
            <select
              id="new-currency"
              placeholder="$"
              name="new-currency"
            >
            <option>$</option>
            <option>€</option>
            <option>£</option>
            <option>¥</option>
            <option>₹</option>
          </select>
          </fieldset>
          <button type="submit" id="change-currency-button">
            Change currency
          </button>
        </form>
      </section>
      <section class="hidden" data-has-valid-session style="margin-top: 2rem;">
        <h2>Import/Export data</h2>
        <p>
          You can import a JSON file exported from Budget Zen (v1, v2, or v3) before. <a href="https://budgetzen.net/import-export-file-format">Learn more about the file format</a>.
        </p>
        <div class="buttons-wrapper">
          <button type="button" id="import-button">
            Import data
          </button>
          <span class="or">&nbsp;</span>
          <button type="button" id="export-button">
            Export data
          </button>
        </div>
      </section>
      <section class="hidden" data-has-valid-session style="margin-top: 2rem;">
        <h2>Change Email</h2>
        <p>
          When you change your email or password, you'll need to login in other devices again.
        </p>
        <form id="change-email-form">
          <fieldset class="input-wrapper">
            <label for="new-email">New Email</label>
            <input
              id="new-email"
              type="email"
              placeholder="you@example.com"
              name="new-email"
            />
          </fieldset>
          <button type="submit" id="change-email-button">
            Change email
          </button>
        </form>
      </section>
      <section class="hidden" data-has-valid-session style="margin-top: 2rem;">
        <h2>Change Password / Encryption Key</h2>
        <form id="change-password-form">
          <fieldset class="input-wrapper">
            <label for="current-password">Current Password / Encryption Key</label>
            <input
              id="current-password"
              type="password"
              placeholder="something secret"
              name="current-password"
            />
          </fieldset>
          <fieldset class="input-wrapper">
            <label for="new-password">New Password / Encryption Key</label>
            <input
              id="new-password"
              type="password"
              placeholder="something even more secret"
              name="new-password"
            />
          </fieldset>
          <button type="submit" id="change-password-button">
            Change password / encryption key
          </button>
        </form>
      </section>
      <section class="hidden" data-has-valid-session style="margin-top: 2rem;">
        <h2>Delete account</h2>
        <p>
          You can delete your account and cancel your subscription from the <a href="/billing">billing section</a>.
        </p>
      </section>
    </section>

    ${verificationCodeModal()}
    
    <script src="/public/ts/settings.ts" type="module"></script>
  `;

  return {
    htmlContent,
    titlePrefix: 'Settings',
    description: 'Settings for Budget Zen.',
  } as PageContentResult;
}
