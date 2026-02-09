# 導入UXとアーキテクチャ議論

## 1. ユーザー（メーカー）にとっての導入UX

Google Maps APIのように「スクリプトタグを貼るだけ」で機能する体験を目指します。
メーカーのWebサイト担当者が行う手順は以下の通りです。

### 手順

1.  **管理画面でドメイン登録**: `example-maker.com` を登録し、APIキーを取得。
2.  **スクリプト読み込み**: `<head>` または `<body>` の末尾にSDKを読み込む。
3.  **マークアップ記述**: 商品ページにカスタムタグ（Web Components）を書く。

### コード例

```html
<!-- SDKの読み込み (APIキー付き) -->
<script src="https://cdn.lambda360.com/v1/viewer.js?key=YOUR_API_KEY"></script>

<!-- 商品記述 (宣言的CAD) -->
<oc-scene width="800" height="600">
  <oc-group color="#ff9900">
    <!-- ベース形状 -->
    <oc-box w="100" h="10" d="200"></oc-box>
    
    <!-- 穴あけ加工 (差分演算) -->
    <oc-difference>
      <oc-box w="100" h="10" d="200"></oc-box>
      <oc-cylinder r="5" h="20" x="10" z="10"></oc-cylinder>
      <oc-cylinder r="5" h="20" x="90" z="190"></oc-cylinder>
    </oc-difference>
  </oc-group>
</oc-scene>
```

---

## 2. 配布形式と技術構成

### ビルド済みJS/WASMの提供

*   **SDK (viewer.js)**:
    *   ユーザーが直接読み込むファイル。
    *   役割:
        1.  DOMの `<oc-*>` タグを監視 (MutationObserver)。
        2.  WASMランタイムの遅延ロード。
        3.  OpenCascadeでの形状生成とThree.jsでのレンダリング。
*   **WASM (opencascade.wasm)**:
    *   `viewer.js` が内部的にフェッチする。
    *   ファイルサイズが大きいため（〜30MB）、CDNのエッジキャッシュを活用する。
    *   OpenCascade.js (LGPL) のバイナリそのもの。再頒布可能だが、ソースコードへのリンク等のLGPL条項を満たす必要がある。

### 宣言的XMLとの組み合わせ

*   **Web Components (Custom Elements)** を採用するのが最適です。
    *   `document.registerElement` (modern: `customElements.define`) を使い、`<oc-box>` などのタグをブラウザに認識させます。
    *   HTMLパーサーがそのまま使えるため、XMLパース処理を自前で書く必要がありません。
    *   属性変更 (`attributeChangedCallback`) を検知して、リアルタイムに3Dモデルを再生成できます。

---

## 3. 不正利用防止とマネタイズ（Google Maps方式）

Simply copying the script tag should not work on unauthorized domains.

### 制限の仕組み

1.  **APIキー**:
    ユーザーごとに発行。
2.  **HTTP Referer / Origin チェック**:
    `viewer.js` および `wasm` ファイルへのリクエスト時に、サーバー側（CDN）で `Origin` ヘッダーを検証します。
    *   登録されたドメイン以外からのリクエスト -> **403 Forbidden**
3.  **WASMのロード制御**:
    `viewer.js` 内でWASMをフェッチする際、署名付きURL（Signed URL）を使用する、あるいはトークンを付与することで、JSだけコピーしてもWASMがロードできないようにします。

### 課金ポイント

*   **APIコール数 / 表示回数**: 「3Dモデルが表示された回数」で課金（Google Mapsと同様）。
*   **機能制限**: 無料版はロゴ表示あり、またはテクスチャ解像度制限など。

---

## 4. 既存ライブラリとの比較

| 特徴 | Google Maps API | **Lambda360 (提案)** |
| :--- | :--- | :--- |
| **導入** | `<script>`タグ + `<div id="map">` | `<script>`タグ + `<oc-scene>` |
| **データ定義** | JSコード (`new google.maps.Map`) | HTMLタグ (`<oc-box>`) |
| **認証** | APIキー + ドメイン制限 | APIキー + ドメイン制限 |
| **コア技術** |画像タイル / WebGL | OpenCascade (WASM) / WebGL |

## 結論

*   ユーザーには **「自社サイトにタグを貼るだけ」** という体験を提供します。
*   裏側では **APIキーによる認証とドメイン制限** をかけ、不正利用を防ぎます。
*   宣言的記述には **Web Components** を採用し、HTMLとの親和性を高めます。

## 5. フレームワークとの互換性 (Valid HTML?)

`<oc-scene>` のようなカスタム要素（Custom Elements）は**有効なHTML**であり、モダンブラウザでネイティブに動作します。

### React (TSX/JSX) での警告回避

Reactでは標準HTMLタグ以外を使用すると型エラー（TypeScript）や警告（React）が出ることがあります。
これらは以下の方法で回避可能です。

1.  **React 19以降**: Custom Elementsのサポートが強化されており、そのまま使用可能です。
2.  **React 18以前**: `declare namespace JSX { ... }` を含む型定義ファイル（`d.ts`）をSDKに同梱して配布します。これにより、ユーザーの環境でTypeScriptのエラーが出なくなります。
3.  **ラッパーライブラリ**: `@lambda360/react` のようなReact専用ラッパーを提供し、`<OcScene>` コンポーネントとして提供することも可能です（Google Mapsの `react-google-maps` と同様のアプローチ）。

### 結論
React/Vue/Svelteなど、どのフレームワークでも問題なく動作させることができます。

---

## 6. パラメータとビジネスロジックの記述

形状だけでなく「価格」「制約」「素材」などのビジネスロジックも、宣言的に記述できるようにします。

### 記述例

```html
<oc-scene>
  <!-- パラメータ定義: UI（スライダー等）を自動生成するためのメタデータ -->
  <oc-param name="width" label="幅" min="100" max="1000" default="500"></oc-param>
  <oc-param name="material" label="素材" type="select" options="aluminum,steel,plastic"></oc-param>

  <!-- 価格計算ロジック: 変数を用いた計算式 -->
  <oc-logic>
    <oc-price-rule base="1000">
      <oc-calc formula="base + (width * 0.5)"></oc-calc>
      <oc-calc if="material == 'aluminum'" formula="price * 1.5"></oc-calc>
    </oc-price-rule>
  </oc-logic>

  <!-- 形状定義: パラメータ変数をバインド -->
  <oc-group>
    <oc-box w="{width}" h="10" d="200"></oc-box>
  </oc-group>
</oc-scene>
```

### このアプローチの利点

1.  **一元管理**: 形状・価格・UIの定義が1箇所にまとまるため、整合性が保ちやすい。
2.  **安全性**: 計算式はサンドボックス内（簡易パーサー）で評価されるため、任意のJavaScript実行（XSS）を防げる。
3.  **移植性**: データ構造としてサーバーサイドでも解析可能（例：サーバー側での見積もり検証）。
