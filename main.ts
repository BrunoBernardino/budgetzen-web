import routes, { Route } from './routes.ts';
import { IS_UNSAFE_SELF_HOSTED } from './lib/utils.ts';

function handler(request: Request) {
  const routeKeys = Object.keys(routes);

  for (const routeKey of routeKeys) {
    const route: Route = routes[routeKey];
    const match = route.pattern.exec(request.url);

    if (match) {
      return route.handler(request, match);
    }
  }

  return new Response('Not found', {
    status: 404,
  });
}

export const abortController = new AbortController();

const PORT = Deno.env.get('PORT') || 8000;

if (IS_UNSAFE_SELF_HOSTED) {
  console.log('IS_UNSAFE_SELF_HOSTED enabled! No emails will be sent and all signups will be forever.');
}

Deno.serve({ port: PORT as number, signal: abortController.signal }, handler);
