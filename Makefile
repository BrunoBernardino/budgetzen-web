.PHONY: start
start:
	deno run --watch --allow-net --allow-read --allow-env=PORT,USERBASE_APP_ID main.ts

.PHONY: format
format:
	deno fmt

.PHONY: test
test:
	deno fmt --check
	deno lint
	deno test --allow-net --allow-read --allow-env=PORT,USERBASE_APP_ID --check=all
