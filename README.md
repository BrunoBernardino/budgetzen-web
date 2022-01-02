# Budget Zen v2 - Web App

[![](https://github.com/BrunoBernardino/budgetzen-web/workflows/Run%20Tests/badge.svg)](https://github.com/BrunoBernardino/budgetzen-web/actions?workflow=Run+Tests)

This is the web app for the [Budget Zen app](https://budgetzen.net), built with Next.js and deployed to AWS with Serverless.

It's v2, meaning it is [end-to-end encrypted via etebase](https://etebase.com), and requires an email + [token](https://budgetzen.net/get-sync-token) to work.

It also means it's not compatible with Budget Zen v1, which you can still get locally from [this commit](https://github.com/BrunoBernardino/budgetzen-web/tree/397d625469b7dfd8d1968c847b32e607ee7c8ee9).

## Development

```bash
make install  # installs dependencies
make start  # starts the app
make pretty  # prettifies the code
make test  # runs linting and tests
make deploy  # deploys to v2.budgetzen.net (requires `serverless` to be installed globally)
```

## TODOs

- [ ] Implement billing in signup
- [ ] Implement fetching in chunks + incrementally, via stoken?
- [ ] Implement encrypted session?
- [ ] Improve UI/UX in general
- [ ] Improve dark/light mode
