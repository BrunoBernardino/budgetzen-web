import { html, PageContentResult } from '/lib/utils.ts';
import verificationCodeModal from '/components/modals/verification-code.ts';

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
    
    ${verificationCodeModal()}

    <script src="/public/ts/billing.ts" type="module"></script>
  `;

  return {
    htmlContent,
    titlePrefix: 'Billing',
    description: 'Simple billing for Budget Zen.',
  } as PageContentResult;
}
