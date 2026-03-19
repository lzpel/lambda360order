# 18. 流体・配管機器 — 配管フランジ / Pipe Flange (Revolved)

## 概要
**パラメータ例:** 呼び径（DN25/50/80/100/150）・圧力クラス（JIS 10K/16K/20K）・ボルト穴数・フランジ面形状（FF/RF）・材質（SUS304/SUS316L/炭素鋼）

`Face::from_polygon` で L 字断面プロファイル（フランジ外径・ネック径・フランジ厚・ネック長を頂点座標として定義）を生成し、`Face::revolve(axis_origin=origin, axis_dir=Z, angle=TAU)` で 360° 回転させてフランジ本体を生成する。ボルト穴は `SubtractNode` で円柱を配置して抜く。

**RevolveNode 構成例:**
```
フランジ = revolve(
  profile = Face::from_polygon([
    (r_neck, 0, 0), (r_flange, 0, 0), (r_flange, 0, h_flange),
    (r_neck, 0, h_flange + h_neck), (r_neck, 0, 0)  // L字断面
  ]),
  axis_origin = (0,0,0),
  axis_dir    = (0,0,1),
  angle       = 2π
)
ボルト穴 = SubtractNode(フランジ, 円柱 × n_bolts)
```

呼び径 enum を選ぶと `r_neck / r_flange / h_flange / n_bolts` が JIS 規格テーブルから自動設定される。圧力クラスを変えると肉厚・フランジ外径が連動する。受注前に 3D で形状・寸法を確認でき、材質と個数から自動積算した見積額をその場で提示できる。

## 参考画像
- Google画像検索: https://www.google.com/search?q=JIS+pipe+flange+stainless+steel+DN50&tbm=isch
- Kitz製品例: https://www.kitz.co.jp/products/valve/flanges/

## CADモデル（GrabCAD）
- [Flange DN50 PN16](https://grabcad.com/library/flange-dn50-pn16-1)
- [Pipe Flange](https://grabcad.com/library/pipe-flange-6)
- [ANSI B16.5 Flange](https://grabcad.com/library/ansi-b16-5-flange-1)
- STEP/IGES flange models: https://grabcad.com/library/tag/flange
