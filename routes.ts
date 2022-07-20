import { readableStreamFromReader } from 'https://deno.land/std@0.142.0/streams/mod.ts';
import { baseUrl, basicLayoutResponse, isRunningLocally, PageContentResult, recordPageView } from './lib/utils.ts';

// NOTE: This won't be necessary once https://github.com/denoland/deploy_feedback/issues/1 is closed
import * as indexPage from './pages/index.ts';
import * as pricingPage from './pages/pricing.ts';
import * as settingsPage from './pages/settings.ts';
import * as billingPage from './pages/billing.ts';
const pages = {
  index: indexPage,
  pricing: pricingPage,
  settings: settingsPage,
  billing: billingPage,
};

export interface Route {
  pattern: URLPattern;
  handler: (
    request: Request,
    match: URLPatternResult,
  ) => (Response | Promise<Response>);
}

interface Routes {
  [routeKey: string]: Route;
}

function createBasicRouteHandler(id: string, pathname: string) {
  return {
    pattern: new URLPattern({ pathname }),
    handler: async (request: Request, match: URLPatternResult) => {
      try {
        // NOTE: Use this instead once https://github.com/denoland/deploy_feedback/issues/1 is closed
        // const { pageContent, pageAction } = await import(`./pages/${id}.ts`);

        // @ts-ignore necessary because of the comment above
        const { pageContent, pageAction } = pages[id];

        if (!request.url.startsWith('http://localhost')) {
          recordPageView(match.pathname.input);
        }

        if (request.method !== 'GET') {
          return pageAction(request, match) as Response;
        }

        const pageContentResult = await pageContent(request, match);

        if (pageContentResult instanceof Response) {
          return pageContentResult;
        }

        const { htmlContent: htmlContent, titlePrefix } = (pageContentResult as PageContentResult);

        return basicLayoutResponse(htmlContent, { currentPath: match.pathname.input, titlePrefix });
      } catch (error) {
        if (error.toString().includes('NotFound')) {
          return new Response('Not Found', { status: 404 });
        }

        console.error(error);

        return new Response('Internal Server Error', { status: 500 });
      }
    },
  };
}

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

      const oneDayInSeconds = 24 * 60 * 60;

      return new Response(sitemapContent, {
        headers: {
          'content-type': 'application/xml',
          'cache-control': `max-age=${oneDayInSeconds}, public`,
        },
      });
    },
  },
  robots: {
    pattern: new URLPattern({ pathname: '/robots.txt' }),
    handler: async (_request) => {
      const file = await Deno.open(`public/robots.txt`, { read: true });
      const readableStream = readableStreamFromReader(file);

      const oneDayInSeconds = 24 * 60 * 60;

      return new Response(readableStream, {
        headers: {
          'content-type': 'text/plain',
          'cache-control': `max-age=${oneDayInSeconds}, public`,
        },
      });
    },
  },
  public: {
    pattern: new URLPattern({ pathname: '/public/:filePath*' }),
    handler: async (_request, match) => {
      const { filePath } = match.pathname.groups;

      try {
        const file = await Deno.open(`public/${filePath}`, { read: true });
        const readableStream = readableStreamFromReader(file);

        const oneDayInSeconds = isRunningLocally(match) ? 0 : 24 * 60 * 60;

        const headers: ResponseInit['headers'] = {
          'cache-control': `max-age=${oneDayInSeconds}, public`,
        };

        // NOTE: It would be nice to figure out a better way to deduce content-type without dependencies
        const fileExtension = filePath.split('.').pop()?.toLowerCase();

        if (fileExtension === 'js') {
          headers['content-type'] = 'text/javascript';
        } else if (fileExtension === 'css') {
          headers['content-type'] = 'text/css';
        } else if (fileExtension === 'jpg') {
          headers['content-type'] = 'image/jpeg';
        } else if (fileExtension === 'png') {
          headers['content-type'] = 'image/png';
        } else if (fileExtension === 'svg') {
          headers['content-type'] = 'image/svg+xml';
        } else if (fileExtension === 'json') {
          headers['content-type'] = 'text/json';
        }

        return new Response(readableStream, {
          headers,
        });
      } catch (error) {
        if (error.toString().includes('NotFound')) {
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
};

export default routes;
