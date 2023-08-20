import { updateUser, validateUserAndSession } from '/lib/data-utils.ts';
import { getSubscriptions as getStripeSubscriptions } from '/lib/providers/stripe.ts';
import { getPayments as getPaypalPayments } from '/lib/providers/paypal.ts';

export async function pageAction(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Not Implemented', { status: 501 });
  }

  const { session_id, user_id, provider }: { session_id: string; user_id: string; provider: 'paypal' | 'stripe' } =
    await request.json();

  if (!session_id || !user_id) {
    return new Response('Bad Request', { status: 400 });
  }

  const { user } = await validateUserAndSession(user_id, session_id);

  if (provider === 'stripe') {
    const subscriptions = await getStripeSubscriptions();

    const subscription = subscriptions.find((subscription) =>
      subscription.customer.email === user.email &&
      subscription.items.data.some((item) => item.price.id.startsWith('budget-zen-'))
    );

    if (subscription) {
      user.subscription.isMonthly = subscription.items.data.some((item) => item.price.id.includes('monthly'));
      user.subscription.updated_at = new Date().toISOString();
      user.subscription.expires_at = new Date(subscription.current_period_end * 1000).toISOString();
      user.subscription.external.stripe = {
        user_id: subscription.customer.id,
        subscription_id: subscription.id,
      };
      user.status = 'active';

      await updateUser(user);
    }
  } else if (provider === 'paypal') {
    const payments = await getPaypalPayments();

    const payment = payments.find((payment) =>
      payment.payer.payer_info.email === user.email &&
      payment.transactions.find((transaction) => transaction.soft_descriptor.toLocaleLowerCase().includes('budget zen'))
    );

    if (payment) {
      user.subscription.isMonthly = parseInt(payment.transactions[0].amount.total, 10) < 10;
      user.subscription.updated_at = new Date().toISOString();
      user.subscription.expires_at = new Date(
        new Date(payment.update_time).setUTCMonth(new Date(payment.update_time).getUTCMonth() + 1),
      ).toISOString();
      user.subscription.external.paypal = {
        user_id: payment.payer.payer_info.payer_id,
        subscription_id: payment.id,
      };
      user.status = 'active';

      await updateUser(user);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function pageContent() {
  return new Response('Not Implemented', { status: 501 });
}
