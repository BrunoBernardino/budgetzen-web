# Budget Zen - Web App

[![](https://github.com/BrunoBernardino/budgetzen-web/workflows/Run%20Tests/badge.svg)](https://github.com/BrunoBernardino/budgetzen-web/actions?workflow=Run+Tests)

This is the web app for the [Budget Zen app](https://budgetzen.net), built with [Deno](https://deno.land) and deployed to [Deno Deploy](https://deno.com/deploy).

This is v2, which is [end-to-end encrypted via userbase](https://userbase.com), and works via web on any device (it's a PWA - Progressive Web App).

It's not compatible with Budget Zen v1 (not end-to-end encrypted), which you can still get locally from [this commit](https://github.com/BrunoBernardino/budgetzen-web/tree/397d625469b7dfd8d1968c847b32e607ee7c8ee9). You can still export and import the data as the JSON format is the same (unencrypted).

## Requirements

This was tested with `deno`'s version in the `.dvmrc` file, though it's possible other versions might work.

There are no other dependencies. **Deno**!

## Development

```sh
$ make start
$ make format
$ make test
```

## Structure

This is vanilla JS, web standards, no frameworks. If you'd like to see/use [the Next.js version deployed to AWS via Serverless, check this commit](https://github.com/BrunoBernardino/budgetzen-web/tree/b1097c710ba89abf9aed044a7d7444e91d04a6a7).

- Backend routes are defined at `routes.ts`.
- Static files are defined at `public/`.
- Pages are defined at `pages/`.

## Deployment

- Deno Deploy: Just push to the `main` branch. Any other branch will create a preview deployment.

## TODOs:

- [ ] Enable true offline mode (securely cache data, allow read-only)
  - https://github.com/smallbets/userbase/issues/255 has interesting ideas, while it's not natively supported
