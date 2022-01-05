# Budget Zen - Web App

[![](https://github.com/BrunoBernardino/budgetzen-web/workflows/Run%20Tests/badge.svg)](https://github.com/BrunoBernardino/budgetzen-web/actions?workflow=Run+Tests)

This is the web app for the [Budget Zen app](https://budgetzen.net), built with Next.js and deployed to AWS with Serverless.

This is v2, which is [end-to-end encrypted via userbase](https://userbase.com), and works via web on any device (it's a PWA - Progressive Web App).

It's not compatible with Budget Zen v1 (not end-to-end encrypted), which you can still get locally from [this commit](https://github.com/BrunoBernardino/budgetzen-web/tree/397d625469b7dfd8d1968c847b32e607ee7c8ee9) and built in [here](https://v1.budgetzen.net). You can still export and import the data as the JSON format is the same (unencrypted).

## Development

```bash
make install  # installs dependencies
make start  # starts the app
make pretty  # prettifies the code
make test  # runs linting and tests
make deploy  # deploys to app.budgetzen.net (requires `serverless` to be installed globally)
```

## TODOs

- [ ] Improve UI/UX in general
- [ ] Improve dark/light mode
