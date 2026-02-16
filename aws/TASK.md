## 0216 完了

- stepを保管するs3
	- アップロードurlを発行できる
- stepをbrepに変換する関数はmemo化されるべき（キーはstepのsha256）
	- s3の一つはbrep保管用
- step+ブーリアン演算の結果もmemo化されるべき（キーはstep+ブーリアン演算のsha256）
	- s3の一つは演算結果glb保管用

