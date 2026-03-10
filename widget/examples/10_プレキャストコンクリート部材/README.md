# 09. 建設・土木 — プレキャストコンクリート部材（積算付き） / Precast Concrete Beam with Cost Estimation

## 概要
**パラメータ例:** 部材長・断面幅・断面高・鉄筋径・かぶり厚・コンクリート強度（fc18/fc24/fc30）
StretchNode で部材長を伸縮すると体積・型枠面積・鉄筋本数が連動して変化し、各パラメータに単価を掛けた積算額（コンクリート費・型枠費・鉄筋費・合計）をフォーム右側にリアルタイム表示する。発注前に形状と金額を同一画面で確認でき、現場担当者が承認してそのまま製作依頼まで完結できる。

**積算ロジック例:**
```
コンクリート体積 = 断面幅 × 断面高 × 部材長  [m³]
型枠面積         = (断面幅 + 断面高) × 2 × 部材長  [m²]
鉄筋量           = 鉄筋径に応じた単位重量 × 本数 × 部材長  [kg]
合計金額         = Σ(各数量 × 単価)
```

## 参考画像
- Google画像検索: https://www.google.com/search?q=precast+concrete+beam+reinforced+construction&tbm=isch
- PCI（米プレキャスト協会）製品例: https://www.precast.org/products/structural-precast/

## CADモデル（GrabCAD）
- [Prestressed Concrete "I" Type Beam](https://grabcad.com/library/prestressed-concrete-i-type-beam-1)
- [Concrete Beam AASHTO TYPE III](https://grabcad.com/library/concrete-beam-aashto-type-iii-1)
- STEP/IGES beam models: https://grabcad.com/library/software/step-slash-iges/tag/beam

## 積算単価（参考）
| 項目 | 単位 | 単価（参考） |
|---|---|---|
| コンクリート体積 | m³ | ¥30,000〜50,000/m³ |
| 型枠面積 | m² | ¥3,000〜6,000/m² |
| 鉄筋量 | kg | ¥150〜200/kg |
