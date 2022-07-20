import { html, PageContentResult } from '../lib/utils.ts';

export function pageAction() {
  return new Response('Not Implemented', { status: 501 });
}

export function pageContent() {
  const htmlContent = html`
    <section class="main-section">
      <h1>Pricing</h1>
      <section class="hero">
        <p>Pricing is simple.</p>
        <p>You have a <strong>30-day free trial</strong> (no credit card required), and at the end, you can pay <strong>€18 / year</strong>, or <strong>€2 / month</strong>, no limits.</p>
      </section>
      <div data-has-invalid-session>
        <h2>Signup or Login first</h2>
        <p>Before you can pay, you need to <a href="/">Signup or Login</a> first.</p>
      </div>
      <div data-has-valid-session class="hidden" id="subscription-info">
      </div>
    </section>
    <template id="valid-subscription">
      <section>
        <h2>You're already a customer!</h2>
        <p>
          You probably want to check out the <a href="/billing">billing section</a> instead.
        </p>
      </section>
    </template>
    <template id="trial-subscription">
      <section>
        <p class="expiration">
          ...
        </p>
        <div class="buttons-wrapper">
          <button class="secondary" type="button" id="subscribe-month">
            Pay €2 / month
          </button>
          <span class="or">or</span>
          <button type="button" id="subscribe-year">
            Pay €18 / year
          </button>
        </div>
      </section>
    </template>
    <script type="text/javascript">
      (() => {
        document.addEventListener('app-loaded', () => {
          const subscriptionInfo = document.getElementById('subscription-info');
          async function subscribeMonthly(event) {
            event.preventDefault();
            event.stopPropagation();
            await userbase.purchaseSubscription({
              successUrl: window.location.href,
              cancelUrl: window.location.href,
              priceId: 'budget-zen-v2-monthly',
            });
          }
          async function subscribeYearly(event) {
            event.preventDefault();
            event.stopPropagation();
            await userbase.purchaseSubscription({
              successUrl: window.location.href,
              cancelUrl: window.location.href,
              priceId: 'budget-zen-v2-annual',
            });
          }
          function getValidSubscriptionHtmlElement() {
            const template = document.getElementById('valid-subscription');
            const clonedElement = template.content.firstElementChild.cloneNode(true);
            return clonedElement;
          }
          function getTrialSubscriptionHtmlElement(trialDaysLeft) {
            const template = document.getElementById('trial-subscription');
            const clonedElement = template.content.firstElementChild.cloneNode(true);
            const expirationTextElement = clonedElement.querySelector('.expiration');
            const message = ['Your trial'];
            if (trialDaysLeft > 0) {
              message.push('will expire in');
              message.push(trialDaysLeft);
              message.push(trialDaysLeft === 1 ? 'day.' : 'days.');
            } else {
              message.push('has expired.');
            }
            expirationTextElement.textContent = message.join(' ');
            return clonedElement;
          }
          async function updateUI() {
            const userSession = await window.app.getUserSession();
            const isSubscriptionValid = userSession.subscriptionStatus === 'active';
            let trialDaysLeft = 30;
            if (userSession.trialExpirationDate) {
              const trialExpirationDate = new Date(userSession.trialExpirationDate);
              trialDaysLeft = window.app.utils.dateDiffInDays(new Date(), trialExpirationDate);
            }
            subscriptionInfo.replaceChildren();
            if (isSubscriptionValid) {
              const subscriptionElement = getValidSubscriptionHtmlElement();
              subscriptionInfo.appendChild(subscriptionElement);
            } else {
              const subscriptionElement = getTrialSubscriptionHtmlElement(trialDaysLeft);
              subscriptionInfo.appendChild(subscriptionElement);
              const subscribeMonthButton = document.getElementById('subscribe-month');
              const subscribeYearButton = document.getElementById('subscribe-year');
              subscribeMonthButton.addEventListener('click', subscribeMonthly);
              subscribeYearButton.addEventListener('click', subscribeYearly);
            }
          }
          async function initializePage() {
            await window.app.dataUtils.initializeDb();
            updateUI();
          }
          if (window.app.isLoggedIn) {
            initializePage();
          }
        });
      })();
    </script>
  `;

  return {
    htmlContent,
    titlePrefix: 'Pricing',
    description: 'Simple pricing for Budget Zen.',
  } as PageContentResult;
}
