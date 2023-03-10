import { checkForValidSession, commonRequestHeaders, dateDiffInDays, showNotification } from './utils.ts';
import LocalData from './local-data.ts';

document.addEventListener('app-loaded', async () => {
  const user = await checkForValidSession();

  const subscriptionInfo = document.getElementById('subscription-info') as HTMLDivElement;
  const deleteAccountButton = document.getElementById('delete-account') as HTMLButtonElement;

  function updatePayment(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    let updateUrl = '';

    if (user?.subscription.external.stripe) {
      updateUrl = window.app.STRIPE_CUSTOMER_URL;
    }
    if (user?.subscription.external.paypal) {
      updateUrl = window.app.PAYPAL_CUSTOMER_URL;
    }

    if (!updateUrl) {
      showNotification('You need to reach out in order to update your subscription, sorry!', 'error');
      return;
    }

    window.open(updateUrl, '_blank');
  }

  function cancelSubscription(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    let cancelUrl = '';

    if (user?.subscription.external.stripe) {
      cancelUrl = window.app.STRIPE_CUSTOMER_URL;
    }
    if (user?.subscription.external.paypal) {
      cancelUrl = window.app.PAYPAL_CUSTOMER_URL;
    }

    if (!cancelUrl) {
      showNotification('You need to reach out in order to cancel your subscription, sorry!', 'error');
      return;
    }

    window.open(cancelUrl, '_blank');
  }

  function resumeSubscription(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    let updateUrl = '';

    if (user?.subscription.external.stripe) {
      updateUrl = window.app.STRIPE_CUSTOMER_URL;
    }
    if (user?.subscription.external.paypal) {
      updateUrl = window.app.PAYPAL_CUSTOMER_URL;
    }

    if (!updateUrl) {
      showNotification('You need to reach out in order to resume your subscription, sorry!', 'error');
      return;
    }

    window.open(updateUrl, '_blank');
  }

  async function deleteAccount(event: Event) {
    const { Swal } = window;

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

      const headers = commonRequestHeaders;

      const session = LocalData.get('session')!;

      const body: { user_id: string; session_id: string; code?: string } = {
        user_id: session.userId,
        session_id: session.sessionId,
      };

      await fetch('/api/user', { method: 'DELETE', headers, body: JSON.stringify(body) });

      window.app.hideLoading();

      const { value: code } = await Swal.fire({
        template: '#verification-code-modal',
        focusConfirm: false,
        allowEscapeKey: true,
        preConfirm: () => {
          const codeValue = (document.getElementById('verification-code-input') as HTMLInputElement).value;

          if (!codeValue) {
            showNotification('You need to submit a code!', 'error');
            return false;
          }

          return codeValue;
        },
        willOpen: () => {
          (document.getElementById('verification-code-input') as HTMLInputElement).value = '';
        },
      });

      window.app.showLoading();

      body.code = code;

      await fetch('/api/user', { method: 'DELETE', headers, body: JSON.stringify(body) });

      LocalData.clear();

      window.location.reload();
    }
  }

  function getValidSubscriptionHtmlElement(
    { isSubscriptionCanceled, isSubscriptionMonthly }: {
      isSubscriptionCanceled: boolean;
      isSubscriptionMonthly: boolean;
    },
  ) {
    const template = document.getElementById('valid-subscription') as HTMLTemplateElement;

    const clonedElement = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;

    const paymentTextElement = clonedElement.querySelector('.subscription-value') as HTMLSpanElement;
    paymentTextElement.textContent = isSubscriptionMonthly ? '€2 / month' : '€18 / year';

    const notCanceledElement = clonedElement.querySelector('#subscription-is-not-canceled') as HTMLDivElement;
    const canceledElement = clonedElement.querySelector('#subscription-is-canceled') as HTMLDivElement;

    if (isSubscriptionCanceled) {
      notCanceledElement.classList.add('hidden');
      canceledElement.classList.remove('hidden');
    }

    return clonedElement;
  }

  function getInvalidSubscriptionHtmlElement() {
    const template = document.getElementById('invalid-subscription') as HTMLTemplateElement;

    const clonedElement = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;

    return clonedElement;
  }

  function getTrialSubscriptionHtmlElement() {
    const template = document.getElementById('trial-subscription') as HTMLTemplateElement;

    const clonedElement = (template.content.firstElementChild as HTMLDivElement).cloneNode(true) as HTMLDivElement;

    return clonedElement;
  }

  function updateUI() {
    const isSubscriptionValid = user?.status === 'active';
    let trialDaysLeft = 30;

    if (user?.subscription.expires_at) {
      const trialExpirationDate = new Date(user?.subscription.expires_at);
      trialDaysLeft = dateDiffInDays(new Date(), trialExpirationDate);
    }

    const isTrialing = user?.status === 'trial' && trialDaysLeft > 0;
    const isSubscriptionCanceled = user?.status === 'inactive';
    const isSubscriptionMonthly = Boolean(user?.subscription.isMonthly);

    subscriptionInfo.replaceChildren();

    if (isSubscriptionValid) {
      const subscriptionElement = getValidSubscriptionHtmlElement({ isSubscriptionCanceled, isSubscriptionMonthly });

      subscriptionInfo.appendChild(subscriptionElement);

      const updateButton = document.getElementById('update-payment') as HTMLButtonElement;
      const cancelButton = document.getElementById('cancel-subscription') as HTMLButtonElement;
      const resumeButton = document.getElementById('resume-subscription') as HTMLButtonElement;

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

  function initializePage() {
    updateUI();
  }

  if (window.app.isLoggedIn) {
    initializePage();
  }

  deleteAccountButton.addEventListener('click', deleteAccount);
});
