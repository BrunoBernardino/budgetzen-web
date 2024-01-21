.PHONY: start
start:
	deno run --watch --allow-net --allow-read --allow-env --allow-write main.ts

.PHONY: format
format:
	deno fmt

.PHONY: test
test:
	deno fmt --check
	deno lint
	deno test --allow-net --allow-read --allow-env --check

.PHONY: migrate-db
migrate-db:
	deno run --allow-net --allow-read --allow-env migrate-db.ts

.PHONY: crons/check-subscriptions
crons/check-subscriptions:
	deno run --allow-net --allow-read --allow-env crons/check-subscriptions.ts

.PHONY: crons/cleanup
crons/cleanup:
	deno run --allow-net --allow-read --allow-env crons/cleanup.ts

.PHONY: exec-db
exec-db:
	docker exec -it -u postgres $(shell basename $(CURDIR))_postgresql_1 psql
