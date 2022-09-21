.PHONY: start
start:
	deno run --watch --allow-net --allow-read=public,pages,.env,.env.defaults --allow-env main.ts

.PHONY: format
format:
	deno fmt

.PHONY: test
test:
	deno fmt --check
	deno lint
	deno test --allow-net --allow-read=public,pages,.env,.env.defaults --allow-env --check=all
