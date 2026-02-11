MAKE_RECURSIVE_DIRS := frontend api aws
OUT_FRONTEND_DIR := api/out
SECRET_DIR_AGE := secret secret.age
define MAKE_RECURSIVE
	time printf '%s\n' $(MAKE_RECURSIVE_DIRS) | xargs -IX sh -c '$(MAKE) -C X $@ || exit 255'
endef
export
generate: # 前処理を行います。開発・本番問わず実行前に叩いてください
	bash -c "$${MAKE_RECURSIVE}"
run: # 開発用のサーバー起動コマンド フォアグラウンド実行されます Ctrl+Cで止まります
	bash -c "$${MAKE_RECURSIVE}"
deploy: # 本番用のサーバー起動コマンド バックグラウンド実行されます
	bash -c "$${MAKE_RECURSIVE}"
action: generate # github actionで実行される
	echo ${NEXT_PUBLIC_REPO}