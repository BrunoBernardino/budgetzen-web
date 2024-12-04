import 'std/dotenv/load';
import { serveFile } from 'std/http/file-server';
import { transpile } from 'deno/emit';
import sass from 'https://deno.land/x/denosass@1.0.6/mod.ts';

import header from '/components/header.ts';
import footer from '/components/footer.ts';
import loading from '/components/loading.ts';

// This allows us to have nice html syntax highlighting in template literals
export const html = String.raw;

export const baseUrl = Deno.env.get('BASE_URL') || 'https://app.budgetzen.net';
export const defaultTitle = 'Budget Zen — Simple and end-to-end encrypted budget and expense manager';
export const defaultDescription = 'Simple and end-to-end encrypted budget and expense manager.';
export const helpEmail = 'help@budgetzen.net';

export const PORT = Deno.env.get('PORT') || 8000;
export const STRIPE_MONTHLY_URL = 'https://buy.stripe.com/7sI3dT8jO5UJ3qE00y';
export const STRIPE_YEARLY_URL = 'https://buy.stripe.com/28og0F8jOgzn8KY00z';
export const STRIPE_CUSTOMER_URL = 'https://billing.stripe.com/p/login/4gw15w3G9bDyfWU6oo';
export const PAYPAL_CUSTOMER_URL = 'https://www.paypal.com';
export const IS_UNSAFE_SELF_HOSTED = Boolean(Deno.env.get('IS_UNSAFE_SELF_HOSTED') || '');
export const MONTHLY_PRICE = 4;
export const YEARLY_PRICE = 40;

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
      <link rel="stylesheet" href="/public/scss/style.scss">
      <link rel="stylesheet" href="/public/css/style.css">

      <link rel="manifest" href="/public/manifest.json" />
      
      <link rel="alternate" type="application/rss+xml" href="https://budgetzen.net/rss.xml" />
      <link rel="alternate" type="application/atom+xml" href="https://budgetzen.net/atom.xml" />
      <link rel="alternate" type="application/feed+json" href="https://budgetzen.net/feed.json" />
    </head>
    <body>
      ${loading()}
      ${header(currentPath)}
      <section class="wrapper">
        ${htmlContent}
      </section>
      ${footer()}
      <script type="text/javascript">
        window.app = {
          STRIPE_MONTHLY_URL: '${STRIPE_MONTHLY_URL}',
          STRIPE_YEARLY_URL: '${STRIPE_YEARLY_URL}',
        };
      </script>
      <script src="/public/js/script.js"></script>
      <script src="/public/js/sweetalert.js" defer></script>
    </body>
    </html>
    `;
}

export function basicLayoutResponse(htmlContent: string, options: BasicLayoutOptions) {
  return new Response(basicLayout(htmlContent, options), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy':
        "default-src 'self'; child-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';",
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    },
  });
}

export function isRunningLocally(urlPatternResult: URLPatternResult) {
  return urlPatternResult.hostname.input.includes('localhost');
}

export function escapeHtml(unsafe: string) {
  return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function transpileTs(content: string, specifier: URL) {
  const urlStr = specifier.toString();
  const result = await transpile(specifier, {
    load(specifier: string) {
      if (specifier !== urlStr) {
        return Promise.resolve({ kind: 'module', specifier, content: '' });
      }
      return Promise.resolve({ kind: 'module', specifier, content });
    },
  });
  return result.get(urlStr) || '';
}

export async function serveFileWithTs(request: Request, filePath: string, extraHeaders?: ResponseInit['headers']) {
  const response = await serveFile(request, filePath);

  if (response.status !== 200) {
    return response;
  }

  const tsCode = await response.text();
  const jsCode = await transpileTs(tsCode, new URL('file:///src.ts'));
  const { headers } = response;
  headers.set('content-type', 'application/javascript; charset=utf-8');
  headers.delete('content-length');

  return new Response(jsCode, {
    status: response.status,
    statusText: response.statusText,
    headers,
    ...(extraHeaders || {}),
  });
}

function transpileSass(content: string) {
  const compiler = sass(content);

  return compiler.to_string('compressed') as string;
}

export async function serveFileWithSass(request: Request, filePath: string, extraHeaders?: ResponseInit['headers']) {
  const response = await serveFile(request, filePath);

  if (response.status !== 200) {
    return response;
  }

  const sassCode = await response.text();
  const cssCode = transpileSass(sassCode);
  const { headers } = response;
  headers.set('content-type', 'text/css; charset=utf-8');
  headers.delete('content-length');

  return new Response(cssCode, {
    status: response.status,
    statusText: response.statusText,
    headers,
    ...(extraHeaders || {}),
  });
}

export function generateRandomCode(length = 6) {
  const getRandomDigit = () => Math.floor(Math.random() * (10)); // 0-9

  const codeDigits = Array.from({ length }).map(getRandomDigit);

  return codeDigits.join('');
}

export function splitArrayInChunks<T = any>(array: T[], chunkLength: number) {
  const chunks = [];
  let chunkIndex = 0;
  const arrayLength = array.length;

  while (chunkIndex < arrayLength) {
    chunks.push(array.slice(chunkIndex, chunkIndex += chunkLength));
  }

  return chunks;
}

// Because new URLSearchParams(Object.entries(object)).toString() doesn't work recursively
export function jsonToFormUrlEncoded(object: any, key = '', list: string[] = []) {
  if (typeof object === 'object') {
    for (const subKey in object) {
      jsonToFormUrlEncoded(object[subKey], key ? `${key}[${subKey}]` : subKey, list);
    }
  } else {
    list.push(`${key}=${encodeURIComponent(object)}`);
  }
  return list.join('&');
}
