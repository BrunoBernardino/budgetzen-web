import Database, { sql } from '/lib/interfaces/database.ts';
import { getSubscriptions as getStripeSubscriptions } from '/lib/providers/stripe.ts';
// import { getSubscriptions as getPaypalSubscriptions } from '/lib/providers/paypal.ts';
import { updateUser } from '/lib/data-utils.ts';
import { User } from '/lib/types.ts';

const db = new Database();

async function checkSubscriptions() {
  try {
    const users = await db.query<User>(
      sql`SELECT * FROM "budgetzen_users" WHERE "status" IN ('active', 'trial')`,
    );

    let updatedUsers = 0;

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
          matchingUser.status = 'inactive';
        }

        await updateUser(matchingUser);

        ++updatedUsers;
      }
    }

    // const paypalSubscriptions = await getPaypalSubscriptions();

    // for (const subscription of paypalSubscriptions) {
    //   const matchingUser = users.find((user) => user.email === subscription.subscriber.email_address);

    //   if (matchingUser) {
    //     if (!matchingUser.subscription.external.paypal) {
    //       matchingUser.subscription.external.paypal = {
    //         user_id: subscription.subscriber.payer_id,
    //         subscription_id: subscription.id,
    //       };
    //     }

    //     matchingUser.subscription.isMonthly = parseInt(subscription.billing_info.last_payment.amount.value, 10) < 10;
    //     matchingUser.subscription.updated_at = new Date().toISOString();
    //     matchingUser.subscription.expires_at = new Date(subscription.billing_info.next_billing_time).toISOString();

    //     if (['ACTIVE', 'APPROVED'].includes(subscription.status)) {
    //       matchingUser.status = 'active';
    //     } else {
    //       matchingUser.status = 'inactive';
    //     }

    //     await updateUser(matchingUser);

    //     ++updatedUsers;
    //   }
    // }

    console.log('Updated', updatedUsers, 'users');
  } catch (error) {
    console.log(error);
  }
}

await checkSubscriptions();
