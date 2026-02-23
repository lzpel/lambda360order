generate:
	npm install

run:
	# No run step for aws

deploy: generate check-docker
	npm run cdk -- deploy --require-approval never

audit:
	npm audit fix --force
	npm audit fix

check-docker:
	@docker ps > /dev/null 2>&1 || (echo "Error: Docker is not running. Is the Docker daemon really running?"; exit 1)

bootstrap: check-docker
	npm run cdk -- bootstrap
