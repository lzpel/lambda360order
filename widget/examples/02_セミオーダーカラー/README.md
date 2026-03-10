# 02. 精密機械・研究機器 — セミオーダー金属カラー／スペーサー / Semi-Custom Metal Collar & Spacer

## 概要
**参考サイト:** https://nps1.jp/collar/

**パラメータ例:** 内径・外径・長さ・材質（SUS304 / A2017 enum）・表面処理（なし／白アルマイト／黒アルマイト enum）・タップ有無

金属カラー／スペーサーは中空円筒（内径 × 外径 × 長さ）であり、`Face::from_polygon` で肉厚 × 長さの矩形断面プロファイルを定義し、`Face::revolve(axis_dir=Z, angle=TAU)` で Z 軸 360° 回転させるだけで完全生成できる。STEPファイル不要で全パラメータが数値入力だけで確定する。

**RevolveNode 構成例:**
```
断面 = Face::from_polygon([
  (r_inner, 0, 0),
  (r_outer, 0, 0),
  (r_outer, 0, length),
  (r_inner, 0, length),
])
カラー = revolve(断面, axis_origin=(0,0,0), axis_dir=(0,0,1), angle=2π)
タップ穴 = SubtractNode(カラー, ネジ穴円柱)  // タップあり選択時のみ
```

内径・外径・長さを入力すると体積・重量（材質密度から自動計算）・価格をリアルタイム表示。大学・研究機関の公費発注から製造業の設備部品調達まで対応できる最もシンプルなセミオーダー構成。

**積算ロジック例:**
```
体積[cm³] = π × (外径² - 内径²) / 4 × 長さ  [mm→cm 換算]
重量[g]   = 体積 × 密度  (SUS304: 7.93, A2017: 2.80 g/cm³)
価格      = 重量 × 材料単価 + 加工費(固定) + 表面処理費
```

## 参考画像
- 参考サイト: https://nps1.jp/collar/
- Google画像検索: https://www.google.com/search?q=metal+collar+spacer+stainless+aluminum+semi+custom&tbm=isch
- Misumi製品例: https://jp.misumi-ec.com/vona2/mech/M1500000000/M1502000000/M1502040000/

## CADモデル（GrabCAD）
- [Shaft Collar](https://grabcad.com/library/shaft-collar-6)
- [Spacer](https://grabcad.com/library/spacer-17)
- [Aluminum Spacer](https://grabcad.com/library/aluminum-spacer-1)
- STEP/IGES collar models: https://grabcad.com/library/tag/collar
