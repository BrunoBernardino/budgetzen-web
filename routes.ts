import { serveFile } from 'std/http/file-server';
import { baseUrl, basicLayoutResponse, PageContentResult, serveFileWithSass, serveFileWithTs } from './lib/utils.ts';

// NOTE: This won't be necessary once https://github.com/denoland/deploy_feedback/issues/433 is closed
import * as indexPage from './pages/index.ts';
import * as pricingPage from './pages/pricing.ts';
import * as settingsPage from './pages/settings.ts';
import * as billingPage from './pages/billing.ts';
import * as apiUserPage from './pages/api/user.ts';
import * as apiSessionPage from './pages/api/session.ts';
import * as apiSubscriptionPage from './pages/api/subscription.ts';
import * as apiDataPage from './pages/api/data.ts';
import * as apiBudgetsPage from './pages/api/budgets.ts';
import * as apiExpensesPage from './pages/api/expenses.ts';
const pages = {
  index: indexPage,
  pricing: pricingPage,
  settings: settingsPage,
  billing: billingPage,
  apiUser: apiUserPage,
  apiSession: apiSessionPage,
  apiSubscription: apiSubscriptionPage,
  apiData: apiDataPage,
  apiBudgets: apiBudgetsPage,
  apiExpenses: apiExpensesPage,
};

export interface Route {
  pattern: URLPattern;
  handler: (
    request: Request,
    match: URLPatternResult,
  ) => Response | Promise<Response>;
}

interface Routes {
  [routeKey: string]: Route;
}

function createBasicRouteHandler(id: string, pathname: string) {
  return {
    pattern: new URLPattern({ pathname }),
    handler: async (request: Request, match: URLPatternResult) => {
      try {
        // NOTE: Use this instead once https://github.com/denoland/deploy_feedback/issues/433 is closed
        // const { pageContent, pageAction } = await import(`./pages/${id}.ts`);

        // @ts-ignore necessary because of the comment above
        const { pageContent, pageAction } = pages[id];

        if (request.method !== 'GET') {
          return pageAction(request, match) as Response;
        }

        const pageContentResult = await pageContent(request, match);

        if (pageContentResult instanceof Response) {
          return pageContentResult;
        }

        const { htmlContent: htmlContent, titlePrefix } = pageContentResult as PageContentResult;

        return basicLayoutResponse(htmlContent, { currentPath: match.pathname.input, titlePrefix });
      } catch (error) {
        if ((error as Error).toString().includes('NotFound')) {
          return new Response('Not Found', { status: 404 });
        }

        console.error(error);

        return new Response('Internal Server Error', { status: 500 });
      }
    },
  };
}

const oneDayInSeconds = 24 * 60 * 60;

const routes: Routes = {
  sitemap: {
    pattern: new URLPattern({ pathname: '/sitemap.xml' }),
    handler: (_request) => {
      const pages = [
        '/',
        '/pricing',
      ];

      const oneHourAgo = new Date(new Date().setHours(new Date().getHours() - 1));

      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${
        pages.map((page) => `
    <url>
      <loc>${baseUrl}${page}</loc>
      <lastmod>${oneHourAgo.toISOString()}</lastmod>
      <priority>${page === '/' ? '1.0' : '0.8'}</priority>
    </url>
  `).join('')
      }
</urlset>
`;

      return new Response(sitemapContent, {
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': `max-age=${oneDayInSeconds}, public`,
        },
      });
    },
  },
  robots: {
    pattern: new URLPattern({ pathname: '/robots.txt' }),
    handler: async (request) => {
      const response = await serveFile(request, `public/robots.txt`);
      response.headers.set('cache-control', `max-age=${oneDayInSeconds}, public`);
      return response;
    },
  },
  favicon: {
    pattern: new URLPattern({ pathname: '/favicon.ico' }),
    handler: async (request) => {
      const response = await serveFile(request, `public/images/favicon.ico`);
      response.headers.set('cache-control', `max-age=${oneDayInSeconds}, public`);
      return response;
    },
  },
  public: {
    pattern: new URLPattern({ pathname: '/public/:filePath*' }),
    handler: async (request, match) => {
      const { filePath } = match.pathname.groups;

      try {
        const fullFilePath = `public/${filePath}`;

        const fileExtension = filePath!.split('.').pop()?.toLowerCase();

        let response: Response;

        if (fileExtension === 'ts') {
          response = await serveFileWithTs(request, fullFilePath);
        } else if (fileExtension === 'scss') {
          response = await serveFileWithSass(request, fullFilePath);
        } else {
          response = await serveFile(request, `public/${filePath}`);
        }

        response.headers.set('cache-control', `max-age=${oneDayInSeconds}, public`);
        return response;
      } catch (error) {
        if ((error as Error).toString().includes('NotFound')) {
          return new Response('Not Found', { status: 404 });
        }

        console.error(error);

        return new Response('Internal Server Error', { status: 500 });
      }
    },
  },
  index: createBasicRouteHandler('index', '/'),
  pricing: createBasicRouteHandler('pricing', '/pricing'),
  settings: createBasicRouteHandler('settings', '/settings'),
  billing: createBasicRouteHandler('billing', '/billing'),
  apiUser: createBasicRouteHandler('apiUser', '/api/user'),
  apiSession: createBasicRouteHandler('apiSession', '/api/session'),
  apiSubscription: createBasicRouteHandler('apiSubscription', '/api/subscription'),
  apiData: createBasicRouteHandler('apiData', '/api/data'),
  apiBudgets: createBasicRouteHandler('apiBudgets', '/api/budgets'),
  apiExpenses: createBasicRouteHandler('apiExpenses', '/api/expenses'),
};

export default routes;
