# 01. 板金加工 — 制御盤ボックス / Sheet Metal Control Panel Box

## 概要
**パラメータ例:** 幅・高さ・奥行き・ノックアウト穴位置・扉の有無・塗色
工場の制御盤筐体は設置スペースごとに寸法が異なる。StretchNode で胴体を伸縮し、SubtractNode で穴を開ける典型構成。

## 参考画像
- Google画像検索: https://www.google.com/search?q=sheet+metal+control+panel+enclosure+box&tbm=isch
- Rittal製品例: https://www.rittal.com/com-en/product/list.action?categoryPath=/PG0001/PG0033ENCLOSURES

## CADモデル（GrabCAD）
- [Sheet Metal Box](https://grabcad.com/library/sheet-metal-box-34) — 既存STEPの元モデル
- [Sheet Metal Control Panel Box](https://grabcad.com/library/sheet-metal-control-panel-box-1)
- [Sheet Metal Electrical Enclosure](https://grabcad.com/library/sheet-metal-electrical-enclosure-4)

## STEPファイル
`vms base v3.STEP` — StretchNode で幅・高さ・奥行きをパラメータ化した板金箱ベース形状
