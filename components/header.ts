import { html } from '/lib/utils.ts';

export default function header(currentPath: string) {
  return html`
    <header>
      <section class="wrapper">
        <h1>
          <a href="/">
            <img alt="Logo: stack of money notes with a 'B' on them and stylized letters Budget Zen below" src="/public/images/logo.svg" />
          </a>
        </h1>
        <nav>
          <ul>
            <li data-has-valid-session class="hidden ${currentPath.includes('/settings') ? 'active' : ''}">
              <a href="/settings">Settings</a>
            </li>
            <li data-has-valid-session class="hidden ${currentPath.includes('/billing') ? 'active' : ''}">
              <a href="/billing">Billing</a>
            </li>
            <li class="${currentPath.includes('/pricing') ? 'active' : ''}">
              <a href="/pricing">Pricing</a>
            </li>
            <li data-has-valid-session class="hidden">
              <select id="swap-accounts-select">
                <option value="">Swap account...</option>
              </select>
            </li>
            <li data-has-valid-session class="hidden">
              <a onclick="window.app.doLogout();" style="cursor: pointer;">Logout</a>
            </li>
          </ul>
        </nav>
      </section>
    </header>
  `;
}
