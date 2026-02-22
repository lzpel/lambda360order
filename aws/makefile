generate:
	npm install

run:
	# No run step for aws

deploy: check-docker
	npm run cdk -- deploy --require-approval never

check-docker:
	@docker ps > /dev/null 2>&1 || (echo "Error: Docker is not running. Is the Docker daemon really running?"; exit 1)

bootstrap: check-docker
	npm run cdk -- bootstrap
