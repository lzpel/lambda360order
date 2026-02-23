MAKE_RECURSIVE_DIRS := openapi widget frontend api # aws
PATH_OUT_FRONTEND := api/out
URL_ORIGIN := https://dfrujiq0byx89.cloudfront.net
define MAKE_RECURSIVE
	time printf '%s\n' $(MAKE_RECURSIVE_DIRS) | xargs -IX sh -c '$(MAKE) -C X $@ || exit 255'
endef
export
generate: # 前処理を行います。開発・本番問わず実行前に叩いてください
	bash -c "$${MAKE_RECURSIVE}"
run: # 開発用のサーバー起動コマンド フォアグラウンド実行されます Ctrl+Cで止まります
	rebab --frontend 127.0.0.1:8000 --rule "prefix=/api,port=7996,command=make -C api run" --rule "port=7997,command=make -C frontend run"
deploy: # 本番用のサーバー起動コマンド バックグラウンド実行されます
	echo ${NEXT_PUBLIC_REPO}
	bash -c "$${MAKE_RECURSIVE}"
deploy-aws: generate deploy
	make -C aws deploy