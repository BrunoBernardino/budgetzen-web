#!/bin/sh

set -e

echo '
-------------------------------------
BudgetZen - A simple budgeting app by Bruno Bernardino

https://github.com/BrunoBernardino/budgetzen-web
-------------------------------------'

echo "**** Run migrations ****"
deno run --allow-net --allow-read --allow-env migrate-db.ts

echo "**** Setup complete, starting the server. ****"
deno run --allow-all main.ts
