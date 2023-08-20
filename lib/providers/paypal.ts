import 'std/dotenv/load.ts';

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';

interface PaypalPayment {
  id: string;
  intent: 'sale' | 'authorize' | 'order';
  transactions: PaypalTransaction[];
  state: 'created' | 'approved' | 'failed';
  failure_reason: string;
  create_time: string;
  update_time: string;
  payer: {
    payer_info: {
      email: string;
      payer_id: string;
    };
  };
}

interface PaypalTransaction {
  invoice_number: string;
  soft_descriptor: string;
  item_list: {
    items: PaypalItemListItem[];
  };
  amount: {
    currency: string;
    total: string;
  };
}

interface PaypalItemListItem {
  sku: string;
  name: string;
  description: string;
  quantity: string;
  price: string;
  currency: string;
}

interface PaypalResponse {
  count: number;
  next_id: string;
  payments: PaypalPayment[];
}

let paypalAccessToken = '';

async function getApiRequestHeaders() {
  if (!paypalAccessToken) {
    paypalAccessToken = await getAccessToken();
  }

  return {
    'Authorization': `Bearer ${paypalAccessToken}`,
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

export async function getPayments() {
  const searchParams = new URLSearchParams();

  searchParams.set('count', '100');

  // NOTE: This is deprecated, but there's no good alternative yet
  const response = await fetch(`https://api-m.paypal.com/v1/payments/payment?${searchParams.toString()}`, {
    method: 'GET',
    headers: await getApiRequestHeaders(),
  });

  const result = (await response.json()) as PaypalResponse;

  const payments = result.payments;

  if (!payments) {
    console.log(JSON.stringify({ payments }, null, 2));
    throw new Error(`Failed to make API request: "${result}"`);
  }

  return payments;
}
