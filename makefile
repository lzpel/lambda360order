export MSYS_NO_PATHCONV := 1 # MSYS_NO_PATHCONV=1 は gitbash で /apiがパス変換されることを防ぐことで rebab が正しく動作するようにする
MAKE_RECURSIVE_DIRS := openapi frontend api widget # aws # make -C frontend generate が widget用のデモも作成するのでこの順番
export MAKE_RECURSIVE = time printf '%s\n' $(MAKE_RECURSIVE_DIRS) | xargs -IX sh -c '$(MAKE) -C X $@ || exit 255'
# TODO: AWS SES本番環境の承認はap-northeast-1でしかとってない
export AWS_REGION := ap-northeast-1
generate: # 前処理を行います。開発・本番問わず実行前に叩いてください
	cargo install --root out rebab
	bash -c "$${MAKE_RECURSIVE}"
run: # 開発用のサーバー起動コマンド フォアグラウンド実行されます Ctrl+Cで止まります
	MSYS_NO_PATHCONV=1 ./out/bin/rebab --frontend 127.0.0.1:8000 --rule "prefix=/api,port=7998,command=make -C api run" --rule "port=7999,command=make -C frontend run"
deploy: generate # 最終成果物の出力
	echo ${REPONAME}
	bash -c "$${MAKE_RECURSIVE}"
deploy-aws: generate deploy
	make -C aws deploy