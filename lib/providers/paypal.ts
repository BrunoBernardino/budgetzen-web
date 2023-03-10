import 'std/dotenv/load.ts';

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';

interface PaypalSubscriber {
  payer_id: string;
  name: {
    given_name: string;
    surname: string;
  };
  email_address: string;
}

interface PaypalSubscription {
  id: string;
  plan_id: string;
  start_time: string;
  subscriber: PaypalSubscriber;
  billing_info: {
    next_billing_time: string;
    last_payment: {
      amount: {
        value: string;
      };
      time: string;
    };
  };
  create_time: string;
  status: 'ACTIVE' | 'APPROVED' | 'APPROVAL_PENDING' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
}

let stripeAccessToken = '';

async function getApiRequestHeaders() {
  if (!stripeAccessToken) {
    stripeAccessToken = await getAccessToken();
  }

  return {
    'Authorization': `Bearer ${stripeAccessToken}`,
    'Accept': 'application/json; charset=utf-8',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

async function getAccessToken() {
  const body = { grant_type: 'client_credentials' };

  const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(Object.entries(body)).toString(),
  });

  const result = (await response.json()) as { access_token: string };

  return result.access_token;
}

export async function getSubscriptions() {
  const searchParams = new URLSearchParams();

  searchParams.set('page_size', '20');

  // NOTE: This doesn't exist yet
  const response = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions?${searchParams.toString()}`, {
    method: 'GET',
    headers: await getApiRequestHeaders(),
  });

  const result = (await response.json()) as PaypalSubscription[];

  if (!result) {
    console.log(JSON.stringify({ result }, null, 2));
    throw new Error(`Failed to make API request: "${result}"`);
  }

  return result;
}
