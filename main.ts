import { serve } from 'https://deno.land/std@0.142.0/http/server.ts';
import routes, { Route } from './routes.ts';

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

serve(handler, { port: PORT as number, signal: abortController.signal });
