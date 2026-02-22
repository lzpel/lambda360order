export CMAKE_POLICY_VERSION_MINIMUM=3.5
ONLINE_URL=https://dfrujiq0byx89.cloudfront.net
CONTENT_HASH=bf476c07bb0573c8b8a50b9093fea1b8de101e132b87b9e625bfa008a0d5c387
CONTENT_PATH=../public/PA-001-DF7.STEP
generate:
	cargo run --example generate
	cargo fmt
	cargo test -p api -- generate_glb --include-ignored

run:
	cargo run

test:
	cargo test shape

test-online:
	curl $(ONLINE_URL)/api/version
	sha256sum $(CONTENT_PATH)
	@URL=$$(curl -s -X POST $(ONLINE_URL)/api/step/$(CONTENT_HASH)/upload); \
	echo "$$URL" && echo "Uploading" && \
	curl -X PUT -T $(CONTENT_PATH) "$$URL"
	echo "Done"
	curl -X POST $(ONLINE_URL)/api/step/$(CONTENT_HASH)/execute &
	@echo "Polling status..."; \
	while true; do \
		RESP=$$(curl -s $(ONLINE_URL)/api/step/$(CONTENT_HASH)/status); \
		echo "$$RESP"; \
		PROGRESS=$$(echo "$$RESP" | grep -o '"progress":[0-9]*' | grep -o '[0-9]*$$'); \
		if [ "$$PROGRESS" -ge 100 ] 2>/dev/null; then break; fi; \
		sleep 2; \
	done

%:
	echo "No rule to make target '$@'"
