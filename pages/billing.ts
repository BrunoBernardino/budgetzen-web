import { html, PageContentResult } from '../lib/utils.ts';

export function pageAction() {
  return new Response('Not Implemented', { status: 501 });
}

export function pageContent() {
  const htmlContent = html`
    <section class="main-section">
      <h1>Billing</h1>
      <section class="hero">
        <p>Billing is simple.</p>
        <p>Below, you can easily cancel your subscription anytime and email me to ask for a refund. You can also update your payment details.</p>
      </section>
      <div data-has-invalid-session style="margin-top: 2rem;">
        <h2>Signup or Login first</h2>
        <p>Before you can pay, you need to <a href="/">Signup or Login</a> first.</p>
      </div>
      <div data-has-valid-session class="hidden" id="subscription-info" style="margin-top: 2rem;">
      </div>
      <div data-has-valid-session class="hidden" style="margin-top: 5rem;">
        <h2>Delete your account</h2>
        <p>
          You can delete your account which will cancel your subscription and delete your data.
        </p>
        <button class="delete-button" type="button" id="delete-account" style="margin: 2rem 0 1rem;">
          Delete account
        </button>
      </div>
    </section>
    <template id="valid-subscription">
      <section>
        <h2>Thank you so much for your support!</h2>
        <p>You're currently paying <strong class="subscription-value">...</strong>.</p>
        <button class="secondary" type="button" id="update-payment" style="margin: 2rem auto 1rem;">
          Update payment details
        </button>
        <div id="subscription-is-not-canceled">
          <button class="delete-button" type="button" id="cancel-subscription" style="margin: 5rem auto 1rem;">
            Cancel subscription
          </button>
          <p>
            The subscription will be canceled at the end of the current billing period.
          </p>
        </div>
        <div class="hidden" id="subscription-is-canceled">
          <p style="margin-top: 5rem;">
            Your subscription is currently set to be canceled at the end of the current billing period.
          </p>
          <button class="secondary" type="button" id="resume-subscription" style="margin: 2rem auto 1rem;">
            Resume subscription
          </button>
        </div>
      </section>
    </template>
    <template id="trial-subscription">
      <section>
        <h2>You are on an active trial!</h2>
        <p>If you're ready to pay, you probably want to check out the <a href="/pricing">pricing section</a> instead.</p>
      </section>
    </template>
    <template id="invalid-subscription">
      <section>
        <h2>Your subscription has expired!</h2>
        <p>You probably want to check out the <a href="/pricing">pricing section</a> instead.</p>
      </section>
    </template>
    <script type="text/javascript">
      (() => {
        document.addEventListener('app-loaded', () => {
          const subscriptionInfo = document.getElementById('subscription-info');
          const deleteAccountButton = document.getElementById('delete-account');
          async function updatePayment(event) {
            event.preventDefault();
            event.stopPropagation();
            window.app.showLoading();
            await userbase.updatePaymentMethod({
              successUrl: window.location.href,
              cancelUrl: window.location.href,
            });
          }
          async function cancelSubscription(event) {
            const { userbase } = window;
            event.preventDefault();
            event.stopPropagation();
            window.app.showLoading();
            await userbase.cancelSubscription();
            window.location.reload();
          }
          async function resumeSubscription(event) {
            const { userbase } = window;
            event.preventDefault();
            event.stopPropagation();
            window.app.showLoading();
            await userbase.resumeSubscription();
            window.location.reload();
          }
          async function deleteAccount(event) {
            const { userbase } = window;
            event.preventDefault();
            event.stopPropagation();
            const { isConfirmed } = await Swal.fire({
              title: 'Are you sure?',
              text: 'You won\'t be able to recover your data!',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: 'red',
              confirmButtonText: 'Yes, delete it!',
            });
            if (isConfirmed) {
              window.app.showLoading();
              await userbase.deleteUser();
              window.location.reload();
            }
          }
          function getValidSubscriptionHtmlElement({ isSubscriptionCanceled, isSubscriptionMonthly }) {
            const template = document.getElementById('valid-subscription');
            const clonedElement = template.content.firstElementChild.cloneNode(true);
            const paymentTextElement = clonedElement.querySelector('.subscription-value');
            paymentTextElement.textContent = isSubscriptionMonthly ? '€2 / month' : '€18 / year';
            const notCanceledElement = clonedElement.querySelector('#subscription-is-not-canceled');
            const canceledElement = clonedElement.querySelector('#subscription-is-canceled');
            if (isSubscriptionCanceled) {
              notCanceledElement.classList.add('hidden');
              canceledElement.classList.remove('hidden');
            }
            return clonedElement;
          }
          function getInvalidSubscriptionHtmlElement() {
            const template = document.getElementById('invalid-subscription');
            const clonedElement = template.content.firstElementChild.cloneNode(true);
            return clonedElement;
          }
          function getTrialSubscriptionHtmlElement() {
            const template = document.getElementById('trial-subscription');
            const clonedElement = template.content.firstElementChild.cloneNode(true);
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
            const isTrialing = userSession.subscriptionStatus !== 'active' && trialDaysLeft > 0;
            const isSubscriptionCanceled = Boolean(userSession.cancelSubscriptionAt);
            const isSubscriptionMonthly = userSession.subscriptionPlanId === 'budget-zen-v2-monthly';
            subscriptionInfo.replaceChildren();
            if (isSubscriptionValid) {
              const subscriptionElement = getValidSubscriptionHtmlElement({ isSubscriptionCanceled, isSubscriptionMonthly });
              subscriptionInfo.appendChild(subscriptionElement);
              const updateButton = document.getElementById('update-payment');
              const cancelButton = document.getElementById('cancel-subscription');
              const resumeButton = document.getElementById('resume-subscription');
              updateButton.addEventListener('click', updatePayment);
              cancelButton.addEventListener('click', cancelSubscription);
              resumeButton.addEventListener('click', resumeSubscription);
            } else if (isTrialing) {
              const subscriptionElement = getTrialSubscriptionHtmlElement();
              subscriptionInfo.appendChild(subscriptionElement);
            } else {
              const subscriptionElement = getInvalidSubscriptionHtmlElement();
              subscriptionInfo.appendChild(subscriptionElement);
            }
          }
          async function initializePage() {
            await window.app.dataUtils.initializeDb();
            updateUI();
          }
          if (window.app.isLoggedIn) {
            initializePage();
          }
          deleteAccountButton.addEventListener('click', deleteAccount);
        });
      })();
    </script>
  `;

  return {
    htmlContent,
    titlePrefix: 'Billing',
    description: 'Simple billing for Budget Zen.',
  } as PageContentResult;
}
