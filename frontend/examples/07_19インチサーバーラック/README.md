# 06. データセンター・IT インフラ — 19インチフロアスタンディングサーバーラック / 19-Inch Floor-Standing Server Rack

## 概要
**パラメータ例:**

| パラメータ | 型 | 選択肢 / 範囲 |
|---|---|---|
| Uサイズ | enum | 12U / 24U / 42U |
| 奥行き | enum | 600mm / 800mm / 1000mm |
| 筐体色 | color | RAL7035 ライトグレー / RAL9005 ブラック / RAL5015 ブルー |
| 前面扉 | enum | ガラス扉 / メッシュ扉 / なし |
| 脚部 | enum | キャスター（ロック付き） / アジャスターフット |
| 側面パネル | enum | あり / なし |

StretchNode でラック高さを Uサイズに連動して伸縮し、前面扉・側面パネルを SubtractNode / UnionNode で付け外しする。色は `color` パラメータをマテリアルに直結。ITシステム担当者がブラウザ上でラック構成を視覚確認してからサプライヤに発注できる。

## 参考画像
- Google画像検索: https://www.google.com/search?q=19+inch+floor+standing+server+rack+glass+door&tbm=isch
- APC製品例: https://www.apc.com/us/en/product-category/88978-server-and-network-racks/

## CADモデル（GrabCAD）
- [19-inch floor standing rack with castors glass door lock](https://grabcad.com/library/19-inch-floor-standing-rack-with-castors-glass-door-lock-1) — 既存STEPの元モデル
- [Server Rack Cabinet](https://grabcad.com/library/server-rack-cabinet-3)
- [Shelf 1U server rack 19"](https://grabcad.com/library/shelf-1u-server-rack-19-1)

## STEPファイル
`Rack assm.stp` — キャスター・ガラス扉・錠付き 19インチフロアスタンディングラック。StretchNode で Uサイズ（12U/24U/42U）に連動して高さを伸縮する。
