# Budget Zen - Web App

[![](https://github.com/BrunoBernardino/budgetzen-web/workflows/Run%20Tests/badge.svg)](https://github.com/BrunoBernardino/budgetzen-web/actions?workflow=Run+Tests)

This is the web app for the [Budget Zen app](https://budgetzen.net), built with [Deno](https://deno.land) and deployed using [docker-compose](https://docs.docker.com/compose/).

This is v3, which is [end-to-end encrypted with open Web Standards](https://en.wikipedia.org/wiki/End-to-end_encryption), and works via web on any device (it's a PWA - Progressive Web App).

It's not compatible with Budget Zen v2 ([end-to-end encrypted via Userbase](https://userbase.com)) which you can still get locally from [this commit](https://github.com/BrunoBernardino/budgetzen-web/tree/7e88a602be437cd4d54268f87113b21e9cff5c60), nor v1 (not end-to-end encrypted), which you can still get locally from [this commit](https://github.com/BrunoBernardino/budgetzen-web/tree/397d625469b7dfd8d1968c847b32e607ee7c8ee9). You can still export and import the data as the JSON format is the same across all 3 versions (unencrypted).

> **NOTE:** If your Android launcher doesn't show PWAs as an app, I've got a solution for you: [a simple webview app](https://github.com/BrunoBernardino/budgetzen-android-webview).

## Self-host it!

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/BrunoBernardino/budgetzen-web)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/BrunoBernardino/budgetzen-web)

Or check the [Development section below](#development).

> **NOTE:** You don't need to have emails (Postmark) and subscriptions (Stripe) setup to have the app work. Those are only used for allowing others to automatically manage their account. You can simply make any `user.status = 'active'` and `user.subscription.expires_at = new Date('2100-01-01')` to "never" expire, in the database, directly.

## Framework-less

This right here is vanilla TypeScript and JavaScript using Web Standards. It's very easy to update and maintain.

It's meant to have no unnecessary dependencies, packagers, or bundlers. Just vanilla, simple stuff.

## Requirements

This was tested with [`Deno`](https://deno.land)'s version stated in the `.dvmrc` file, though other versions may work.

For the PostgreSQL dependency (used when running locally, self-hosted, or in CI), you should have `Docker` and `docker-compose` installed.

If you want to run the app locally with SSL (Web Crypto standards require `https` except for Chrome), you can use [`Caddy`](https://caddyserver.com) (there's a `Caddyfile` that proxies `https://localhost` to the Deno app).

Don't forget to set up your `.env` file based on `.env.sample`.

## Development

```sh
$ docker-compose up # (optional) runs docker with postgres, locally
$ sudo caddy run # (optional) runs an https proxy for the deno app
$ make migrate-db # runs any missing database migrations
$ make start # runs the app
$ make format # formats the code
$ make test # runs tests
```

## Other less-used commands

```sh
$ make exec-db # runs psql inside the postgres container, useful for running direct development queries like `DROP DATABASE "budgetzen"; CREATE DATABASE "budgetzen";`
```

## Structure

- Backend routes are defined at `routes.ts`.
- Publicly-available files are defined at `public/`.
- Pages are defined at `pages/`.
- Cron jobs are defined at `crons/`.
- Reusable bits of code are defined at `lib/`.
- Database migrations are defined at `db-migrations/`.

## Deployment

- Just push to the `main` branch.

## TODOs:

- [ ] Enable true offline mode (securely cache data, allow read-only)
