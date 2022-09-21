import 'https://deno.land/std@0.156.0/dotenv/load.ts';

import header from '../components/header.ts';
import footer from '../components/footer.ts';
import loading from '../components/loading.ts';

// This allows us to have nice html syntax highlighting in template literals
export const html = String.raw;

const USERBASE_APP_ID = Deno.env.get('USERBASE_APP_ID') || '';
const sessionLengthInHours = 90 * 24; // 3 months

export const baseUrl = 'https://app.budgetzen.net';
export const defaultTitle = 'Budget Zen — Simple and end-to-end encrypted budget and expense manager';
export const defaultDescription = 'Simple and end-to-end encrypted budget and expense manager.';

export interface PageContentResult {
  htmlContent: string;
  titlePrefix?: string;
  description?: string;
}

interface BasicLayoutOptions {
  currentPath: string;
  titlePrefix?: string;
  description?: string;
}

function basicLayout(htmlContent: string, { currentPath, titlePrefix, description }: BasicLayoutOptions) {
  let title = defaultTitle;

  if (titlePrefix) {
    title = `${titlePrefix} - Budget Zen`;
  }

  return html`
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      <meta name="description" content="${description || defaultDescription}">
      <meta name="author" content="Bruno Bernardino">
      <meta property="og:title" content="${title}" />
      <link rel="icon" href="/public/images/favicon.png" type="image/png">
      <link rel="apple-touch-icon" href="/public/images/favicon.png">
      <link rel="stylesheet" href="/public/css/style.css">

      <link rel="manifest" href="/public/manifest.json" />
      
      <link rel="alternate" type="application/rss+xml" href="https://budgetzen.net/rss.xml" />
      <link rel="alternate" type="application/atom+xml" href="https://budgetzen.net/atom.xml" />
      <link rel="alternate" type="application/feed+json" href="https://budgetzen.net/feed.json" />
    </head>
    <body>
      ${loading()}
      ${header(currentPath)}
      <section class="wrapper" id="app-root">
        ${htmlContent}
      </section>
      ${footer()}
      <script type="text/javascript">
        window.app = {};
        window.app.userbaseConfig = {
          appId: "${USERBASE_APP_ID}",
          sessionLength: ${sessionLengthInHours},
        };
      </script>
      <script src="/public/js/userbase.js"></script>
      <script src="/public/js/script.js"></script>
      <script src="/public/js/sweetalert.js" defer></script>
      <script src="/public/js/stripe.js" defer></script>
    </body>
    </html>
    `;
}

export function basicLayoutResponse(htmlContent: string, options: BasicLayoutOptions) {
  return new Response(basicLayout(htmlContent, options), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy':
        'default-src \'self\' https://*.userbase.com wss://*.userbase.com https://*.stripe.com https://stripe.com data: blob:; child-src \'self\' data: blob: https://*.stripe.com; img-src \'self\' data: blob: https://*.stripe.com; style-src \'self\' \'unsafe-inline\' https://*.stripe.com; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\';',
      'x-frame-options': 'DENY',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    },
  });
}

export function isRunningLocally(urlPatternResult: URLPatternResult) {
  return urlPatternResult.hostname.input === 'localhost';
}

// NOTE: The functions below are used in the frontend, but this copy allows for easier testing and type-checking

export function escapeHtml(unsafe: string) {
  return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll('\'', '&#039;');
}

export function formatNumber(currency: string, number: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
}

type SortableByDate = { date: string };
export function sortByDate(
  objectA: SortableByDate,
  objectB: SortableByDate,
) {
  if (objectA.date < objectB.date) {
    return -1;
  }
  if (objectA.date > objectB.date) {
    return 1;
  }
  return 0;
}

type SortableByCount = { count: number };
export function sortByCount(
  objectA: SortableByCount,
  objectB: SortableByCount,
) {
  if (objectA.count < objectB.count) {
    return 1;
  }
  if (objectA.count > objectB.count) {
    return -1;
  }
  return 0;
}

type SortableByName = { name: string };
export function sortByName(
  objectA: SortableByName,
  objectB: SortableByName,
) {
  const nameA = objectA.name.toUpperCase();
  const nameB = objectB.name.toUpperCase();
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
}

type SortableByMissingBudget = { expensesCost: number; value: number };
export function sortByMissingBudget(
  objectA: SortableByMissingBudget,
  objectB: SortableByMissingBudget,
) {
  const valueA = objectA.value - objectA.expensesCost;
  const valueB = objectB.value - objectB.expensesCost;
  return valueB - valueA;
}

export function splitArrayInChunks(array: any[], chunkLength: number) {
  const chunks = [];
  let chunkIndex = 0;
  const arrayLength = array.length;

  while (chunkIndex < arrayLength) {
    chunks.push(array.slice(chunkIndex, chunkIndex += chunkLength));
  }

  return chunks;
}

export function uniqueBy(
  array: any[],
  predicate: string | ((item: any) => any),
) {
  const filter = typeof predicate === 'function' ? predicate : (object: any) => object[predicate];

  return [
    ...array
      .reduce((map, item) => {
        const key = item === null || item === undefined ? item : filter(item);

        map.has(key) || map.set(key, item);

        return map;
      }, new Map())
      .values(),
  ];
}

export async function recordPageView(pathname: string) {
  try {
    await fetch('https://stats.onbrn.com/api/event', {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        domain: baseUrl.replace('https://', ''),
        name: 'pageview',
        url: `${baseUrl}${pathname}`,
      }),
    });
  } catch (error) {
    console.log('Failed to log pageview');
    console.error(error);
  }
}
