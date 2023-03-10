import 'std/dotenv/load.ts';

const STRIPE_API_KEY = Deno.env.get('STRIPE_API_KEY') || '';

interface StripeCustomer {
  id: string;
  object: 'customer';
  balance: number;
  created: number;
  currency?: string | null;
  deleted?: void;
  delinquent?: boolean | null;
  email: string | null;
  name?: string | null;
}

interface StripeSubscription {
  id: string;
  object: 'subscription';
  application: string | null;
  cancel_at: number | null;
  canceled_at: number | null;
  created: number;
  currency: string;
  current_period_end: number;
  current_period_start: number;
  customer: StripeCustomer;
  days_until_due: number | null;
  ended_at: number | null;
  items: {
    object: 'list';
    data: StripeSubscriptionItem[];
  };
  start_date: number;
  status:
    | 'active'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'past_due'
    | 'paused'
    | 'trialing'
    | 'unpaid';
}

interface StripeSubscriptionItem {
  id: string;
  object: 'subscription_item';
  created: number;
  deleted?: void;
  price: {
    id: string;
  };
}

interface StripeResponse {
  object: 'list';
  url: string;
  has_more: boolean;
  data: any[];
}

function getApiRequestHeaders() {
  return {
    'Authorization': `Bearer ${STRIPE_API_KEY}`,
    'Accept': 'application/json; charset=utf-8',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

export async function getSubscriptions() {
  const searchParams = new URLSearchParams();

  searchParams.set('expand[]', 'data.customer');
  searchParams.set('limit', '100');

  const response = await fetch(`https://api.stripe.com/v1/subscriptions?${searchParams.toString()}`, {
    method: 'GET',
    headers: getApiRequestHeaders(),
  });

  const result = (await response.json()) as StripeResponse;

  const subscriptions = result.data as StripeSubscription[];

  if (!subscriptions) {
    console.log(JSON.stringify({ result }, null, 2));
    throw new Error(`Failed to make API request: "${result}"`);
  }

  return subscriptions;
}
