import Database, { sql } from '/lib/interfaces/database.ts';
import { getSubscriptions as getStripeSubscriptions } from '/lib/providers/stripe.ts';
import { getPayments as getPaypalPayments } from '/lib/providers/paypal.ts';
import { sendSubscriptionExpiredEmail } from '/lib/providers/postmark.ts';
import { updateUser } from '/lib/data-utils.ts';
import { User } from '/lib/types.ts';

const db = new Database();

async function checkSubscriptions() {
  try {
    const users = await db.query<User>(
      sql`SELECT * FROM "budgetzen_users" WHERE "status" IN ('active', 'trial')`,
    );

    let updatedUsers = 0;

    const now = new Date();

    const stripeSubscriptions = await getStripeSubscriptions();

    for (const subscription of stripeSubscriptions) {
      // Skip subscriptions that aren't related to Budget Zen
      if (!subscription.items.data.some((item) => item.price.id.startsWith('budget-zen-'))) {
        continue;
      }

      const matchingUser = users.find((user) => user.email === subscription.customer.email);

      if (matchingUser) {
        if (!matchingUser.subscription.external.stripe) {
          matchingUser.subscription.external.stripe = {
            user_id: subscription.customer.id,
            subscription_id: subscription.id,
          };
        }

        matchingUser.subscription.isMonthly = subscription.items.data.some((item) => item.price.id.includes('monthly'));
        matchingUser.subscription.updated_at = new Date().toISOString();
        matchingUser.subscription.expires_at = new Date(subscription.current_period_end * 1000).toISOString();

        if (['active', 'paused'].includes(subscription.status)) {
          matchingUser.status = 'active';
        } else if (subscription.status === 'trialing') {
          matchingUser.status = 'trial';
        } else {
          if (matchingUser.status === 'active') {
            await sendSubscriptionExpiredEmail(matchingUser.email);
          }

          matchingUser.status = 'inactive';
        }

        await updateUser(matchingUser);

        ++updatedUsers;
      }
    }

    const paypalPayments = await getPaypalPayments();

    for (const payment of paypalPayments) {
      const matchingUser = users.find((user) =>
        user.email === payment.payer.payer_info.email &&
        // Skip payments that aren't related to Budget Zen
        payment.transactions.find((transaction) =>
          transaction.soft_descriptor.toLocaleLowerCase().includes('budget zen')
        )
      );

      if (matchingUser) {
        if (!matchingUser.subscription.external.paypal) {
          matchingUser.subscription.external.paypal = {
            user_id: payment.payer.payer_info.payer_id,
            subscription_id: payment.id,
          };
        }

        matchingUser.subscription.expires_at = new Date(
          new Date(payment.update_time).setUTCMonth(new Date(payment.update_time).getUTCMonth() + 1),
        ).toISOString();
        matchingUser.subscription.updated_at = new Date().toISOString();

        if (new Date(matchingUser.subscription.expires_at) > now) {
          matchingUser.status = 'active';
        } else {
          if (matchingUser.status === 'active') {
            await sendSubscriptionExpiredEmail(matchingUser.email);
          }

          matchingUser.status = 'inactive';
        }

        await updateUser(matchingUser);

        ++updatedUsers;
      }
    }

    console.log('Updated', updatedUsers, 'users');
  } catch (error) {
    console.log(error);
  }
}

await checkSubscriptions();
