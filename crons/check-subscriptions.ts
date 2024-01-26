import Database, { sql } from '/lib/interfaces/database.ts';
import { getSubscriptions as getStripeSubscriptions } from '/lib/providers/stripe.ts';
import { sendSubscriptionExpiredEmail, sendTrialExpiredEmail } from '/lib/providers/brevo.ts';
import { updateUser } from '/lib/data-utils.ts';
import { User, UserSession } from '/lib/types.ts';

const db = new Database();

const oneDayInSeconds = 86_400;

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
        } else if (matchingUser.subscription.external.stripe.subscription_id !== subscription.id) {
          // Skip previous subscriptions
          continue;
        }

        matchingUser.subscription.isMonthly = subscription.items.data.some((item) => item.price.id.includes('monthly'));
        matchingUser.subscription.updated_at = new Date().toISOString();
        matchingUser.subscription.expires_at = new Date((subscription.current_period_end + oneDayInSeconds) * 1000)
          .toISOString();

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

    console.log('Updated the subscriptions of', updatedUsers, 'users');
  } catch (error) {
    console.log(error);
  }
}

async function checkExpiredTrials() {
  const now = new Date();
  const sevenDaysAgo = new Date(new Date().setUTCDate(new Date().getUTCDate() - 7));

  try {
    const users = await db.query<User>(
      sql`SELECT * FROM "budgetzen_users" WHERE "status" = 'trial' AND "subscription" ->> 'expires_at' <= $1`,
      [
        now,
      ],
    );

    let updatedUsers = 0;

    for (const user of users) {
      // Check if there's any active session in the last 7 days before sending an email
      const userSessions = await db.query<Pick<UserSession, 'id'>>(
        sql`SELECT * FROM "budgetzen_user_sessions" WHERE "user_id" = $1 AND "last_seen_at" >= $2`,
        [
          user.id,
          sevenDaysAgo,
        ],
      );

      if (userSessions.length > 0) {
        await sendTrialExpiredEmail(user.email);
      }

      user.status = 'inactive';

      await updateUser(user);

      ++updatedUsers;
    }

    console.log('Marked', updatedUsers, 'users as inactive');
  } catch (error) {
    console.log(error);
  }
}

// This is necessary for old/manual subscriptions which won't be handled automatically by Stripe
async function checkExpiredSubscriptions() {
  const threeDaysAgo = new Date(new Date().setUTCDate(new Date().getUTCDate() - 3));

  try {
    const users = await db.query<User>(
      sql`SELECT * FROM "budgetzen_users" WHERE "status" = 'active' AND "subscription" ->> 'expires_at' <= $1 AND "subscription" ->> 'updated_at' <= $1`,
      [
        threeDaysAgo,
      ],
    );

    let updatedUsers = 0;

    for (const user of users) {
      await sendSubscriptionExpiredEmail(user.email);

      user.status = 'inactive';

      await updateUser(user);

      ++updatedUsers;
    }

    console.log('Marked', updatedUsers, 'users as inactive');
  } catch (error) {
    console.log(error);
  }
}

await checkSubscriptions();

await checkExpiredTrials();

await checkExpiredSubscriptions();
