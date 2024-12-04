import { html, MONTHLY_PRICE, PageContentResult, YEARLY_PRICE } from '/lib/utils.ts';

export function pageAction() {
  return new Response('Not Implemented', { status: 501 });
}

export function pageContent() {
  const htmlContent = html`
    <section class="main-section">
      <h1>Pricing</h1>
      <section class="hero">
        <p>Pricing is simple.</p>
        <p>You have a <strong>30-day free trial</strong> (no credit card required), and at the end, you can pay <strong>€40 / year</strong>, or <strong>€4 / month</strong>, no limits.</p>
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
            Pay €${MONTHLY_PRICE} / month
          </button>
          <span class="or">or</span>
          <button type="button" id="subscribe-year">
            Pay €${YEARLY_PRICE} / year
          </button>
        </div>
      </section>
    </template>
    <script src="/public/ts/pricing.ts" type="module"></script>
  `;

  return {
    htmlContent,
    titlePrefix: 'Pricing',
    description: 'Simple pricing for Budget Zen',
  } as PageContentResult;
}
