# 20. 機械部品 — 旋削段付きシャフト / Turned Stepped Shaft (Revolved)

## 概要
**パラメータ例:** 段数（2〜6段 enum）・各段の外径・各段の長さ・キー溝幅・軸端ネジ規格（M8〜M30 enum）・材質（S45C/SCM440/SUS303）

`Face::from_polygon` で r-z 平面上に段付き矩形断面プロファイル（各段の半径・長さを頂点座標として定義）を生成し、`Face::revolve(axis_dir=X, angle=TAU)` で X 軸周りに 360° 回転させて段付きシャフトを生成する。キー溝は `SubtractNode` で直方体を切削。

**RevolveNode 構成例:**
```
シャフト断面 = Face::from_polygon([
  (0,0,0), (r1,0,0), (r1,0,L1),   // 第1段
  (r2,0,L1), (r2,0,L1+L2),        // 第2段
  (r3,0,L1+L2), (r3,0,L1+L2+L3), // 第3段
  (0,0,L_total), (0,0,0)
])
シャフト = revolve(断面, axis_origin=(0,0,0), axis_dir=(0,0,1), angle=2π)
キー溝付き = SubtractNode(シャフト, キー溝直方体)
```

段数スライダーを動かすと断面プロファイルの頂点が増減し 3D がリアルタイム更新される。機種指定（軸受型番）から径・公差が自動入力される発注フローを乗せると納期短縮につながる。

## 参考画像
- Google画像検索: https://www.google.com/search?q=stepped+shaft+machined+CNC+turning&tbm=isch
- Misumi製品例: https://jp.misumi-ec.com/vona2/mech/M1500000000/M1502000000/

## CADモデル（GrabCAD）
- [Stepped Shaft](https://grabcad.com/library/stepped-shaft-3)
- [Shaft with keyway](https://grabcad.com/library/shaft-with-keyway-1)
- STEP/IGES shaft models: https://grabcad.com/library/tag/shaft
