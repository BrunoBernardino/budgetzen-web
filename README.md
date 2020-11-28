# Budget Zen - App

[![](https://github.com/BrunoBernardino/budgetzen-app/workflows/Run%20Tests/badge.svg)](https://github.com/BrunoBernardino/budgetzen-app/actions?workflow=Run+Tests)

This is the web app for the [Budget Zen app](https://budgetzen.net), built with Next.js and deployed with Vercel.

It runs completely in the browser, using `localStorage` and `IndexedDB`.

It's not thoroughly tested just yet, so it's available but not announced.

## Development

```bash
make install  # installs dependencies
make start  # starts the app
make pretty  # prettifies the code
make test  # runs linting and tests
make deploy  # deploys to app.budgetzen.net (requires `vercel` to be installed globally)
```

## TODOs

- [ ] Improve initial screen
- [ ] Improve UI/UX in general
- [ ] Improve dark/light mode
- [ ] Improve mobile view (collapse panels and show tab bar to navigate between them?)
