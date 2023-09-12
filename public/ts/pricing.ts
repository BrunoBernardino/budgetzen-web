import { checkForValidSession, commonRequestHeaders, dateDiffInDays, showNotification } from './utils.ts';
import LocalData from './local-data.ts';

document.addEventListener('app-loaded', async () => {
  const user = await checkForValidSession();

  const urlSearchParams = new URLSearchParams(window.location.search);

  const subscriptionInfo = document.getElementById('subscription-info') as HTMLDivElement;

  async function subscriptionSuccessfull() {
    showNotification('Alright! Will reload in a couple of seconds...', 'success');

    const session = LocalData.get('session')!;

    const headers = commonRequestHeaders;

    const provider = 'stripe';

    const body: { user_id: string; session_id: string; provider: 'stripe' } = {
      user_id: session.userId,
      session_id: session.sessionId,
      provider,
    };

    try {
      await fetch('/api/subscription', { method: 'POST', headers, body: JSON.stringify(body) });
    } catch (_error) {
      // Do nothing
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    window.location.href = '/billing';
  }

  async function subscribeMonthly(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      showNotification('You need to signup or login before subscribing!', 'error');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      window.location.href = '/';
      return;
    }

    window.location.href = `${window.app.STRIPE_MONTHLY_URL}?client_reference_id=${user.id}&customer_email=${
      encodeURIComponent(user.email)
    }`;
  }

  async function subscribeYearly(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      showNotification('You need to signup or login before subscribing!', 'error');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      window.location.href = '/';
      return;
    }

    window.location.href = `${window.app.STRIPE_YEARLY_URL}?client_reference_id=${user.id}&customer_email=${
      encodeURIComponent(user.email)
    }`;
  }

  function getValidSubscriptionHtmlElement() {
    const template = document.getElementById('valid-subscription') as HTMLTemplateElement;

    const clonedElement = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;

    return clonedElement;
  }

  function getTrialSubscriptionHtmlElement(trialDaysLeft: number) {
    const template = document.getElementById('trial-subscription') as HTMLTemplateElement;

    const clonedElement = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;

    const expirationTextElement = clonedElement.querySelector('.expiration') as HTMLParagraphElement;
    const message = ['Your trial'];
    if (trialDaysLeft > 0) {
      message.push('will expire in');
      message.push(trialDaysLeft.toString());
      message.push(trialDaysLeft === 1 ? 'day.' : 'days.');
    } else {
      message.push('has expired.');
    }
    expirationTextElement.textContent = message.join(' ');

    return clonedElement;
  }

  async function updateUI() {
    if (urlSearchParams.get('stripeCheckoutId')) {
      await subscriptionSuccessfull();
    }

    const isSubscriptionValid = user?.status === 'active';
    let trialDaysLeft = 30;

    if (user?.subscription.expires_at) {
      const trialExpirationDate = new Date(user?.subscription.expires_at);
      trialDaysLeft = dateDiffInDays(new Date(), trialExpirationDate);
    }

    subscriptionInfo.replaceChildren();

    if (isSubscriptionValid) {
      const subscriptionElement = getValidSubscriptionHtmlElement();

      subscriptionInfo.appendChild(subscriptionElement);
    } else {
      const subscriptionElement = getTrialSubscriptionHtmlElement(trialDaysLeft);

      subscriptionInfo.appendChild(subscriptionElement);

      const subscribeMonthButton = document.getElementById('subscribe-month') as HTMLButtonElement;
      const subscribeYearButton = document.getElementById('subscribe-year') as HTMLButtonElement;

      subscribeMonthButton.addEventListener('click', subscribeMonthly);
      subscribeYearButton.addEventListener('click', subscribeYearly);
    }
  }

  function initializePage() {
    updateUI();
  }

  if (window.app.isLoggedIn) {
    initializePage();
  }
});
