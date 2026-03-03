# 課題④ ESMとIIFEの同時NPM公開について

## 目標

`widget/` を npm パッケージ `lambda360form` として公開し、以下を同時に提供する。

| 用途 | ファイル | 利用者 |
|---|---|---|
| CDN配信 | `dist/lambda360form.js`（IIFE） | `<script src>` で読み込むユーザー |
| Reactライブラリ | `dist/esm/index.js`（ESM） | `import` で使う React ユーザー |
| 型定義 | `dist/esm/index.d.ts` | TypeScript ユーザー |

---

## package.json の各フィールドの役割

```json
{
  "name": "lambda360form",
  "version": "0.1.1",
  "type": "module",

  "module": "dist/esm/index.js",       // バンドラー（Vite/webpack）向けのESMエントリ
  "types": "dist/esm/index.d.ts",      // TypeScriptの型定義

  "exports": {                          // Node.js 12+・モダンバンドラー向けの正式なエントリ定義
    ".": {
      "import": "dist/esm/index.js",   // ESM import用
      "types": "dist/esm/index.d.ts"   // 型定義
    }
  },

  "unpkg": "dist/lambda360form.js",    // unpkg CDNのデフォルト配信ファイル
  "jsdelivr": "dist/lambda360form.js", // jsDelivr CDNのデフォルト配信ファイル

  "files": ["dist"],                   // npm publish で含めるファイル（ホワイトリスト）

  "peerDependencies": {
    "react": "^19",                    // バンドルに含めず利用者環境に依存させる
    "react-dom": "^19"
  },
  "dependencies": {
    "lambda360view": "^0.1.11"         // npm install 時に自動インストールされる
  }
}
```

### `files` フィールドの優先順位

npm publish の除外ルールは以下の優先順で適用される：

```
1. package.json の "files"（ホワイトリスト） ← 最優先、.gitignore を上書き
2. .npmignore                               ← 次点
3. .gitignore のフォールバック              ← .npmignore がない場合に適用
```

本プロジェクトではルートの `.gitignore` に `out/` が含まれているため、
`.npmignore` がない状態では `out/` 以下は npm から除外される。
`files: ["dist"]` を明示することで `.gitignore` の影響を受けずに `dist/` のみを公開できる。

### `unpkg` / `jsdelivr` フィールド

これらを設定すると、バージョンを省略したURLで自動的に該当ファイルが配信される。

```
https://unpkg.com/lambda360form           → dist/lambda360form.js にリダイレクト
https://unpkg.com/lambda360form@0.1.1/dist/lambda360form.js  → 直接アクセス
https://cdn.jsdelivr.net/npm/lambda360form@0.1.1/dist/lambda360form.js
```

### CDNファイルの命名

`iife.js` のような**フォーマット名はNG**。`lambda360form.js` のようにパッケージ名を使うのが慣例（Vue: `vue.global.js`、jQuery: `jquery.min.js` 等）。

---

## vite.config.ts の構成

2種類のビルドを1ファイルに同居させるため、`--mode` フラグで切り替える方式を採用した。

```ts
export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    // ESMライブラリビルド（npm import用）
    return { ... };
  }
  // IIFEビルド（CDN用）※ デフォルト
  return { ... };
});
```

`npm run build` は内部で以下を順に実行：

```
vite build            → mode='production'（デフォルト）→ IIFEビルド
vite build --mode lib → mode='lib' → ESMビルド
```

### IIFEビルドとESMビルドの比較

| | IIFEビルド | ESMビルド |
|---|---|---|
| エントリ | `src/widget-entry.tsx` | `src/Lambda360Form.tsx` |
| フォーマット | `iife` | `es` |
| 出力先 | `dist/lambda360form.js` | `dist/esm/index.js` |
| external | なし（全部バンドル） | react, react-dom, react/jsx-runtime |
| dts生成 | なし | `vite-plugin-dts`（rollupTypes: true） |
| `inlineDynamicImports` | true（IIFEに必須） | 不要 |
| `define` | `process.env.NODE_ENV` | 不要 |

#### IIFEで `inlineDynamicImports: true` が必要な理由
IIFE形式は単一の即時実行関数であり、動的 `import()` を複数チャンクに分割できない。
これを指定しないとビルドエラーになる。

#### ESMで `external` が必要な理由
`peerDependencies` に列挙したパッケージは利用者の環境に存在する前提のため、
バンドルに含めてはならない。含めると2つの React インスタンスが存在することになり
`Invalid hook call` 等のエラーが発生する。

### `vite-plugin-dts` の設定

```ts
dts({
  include: ['src'],       // src/ 以下のファイルのみ処理
  outDir: 'dist/esm',    // 型定義の出力先
  rollupTypes: true,      // 全型定義を1ファイルに束ねる
})
```

`rollupTypes: true` が重要。`src/` 内で `@/out/client`（ローカル生成ファイル）を
参照しているため、そのまま d.ts を生成すると利用者環境で解決できないパスが残る。
`rollupTypes: true` を使うと型定義を1ファイルにバンドルしてパスエイリアスを解決してくれる。

---

## ファイルリネーム対応

このセッションで `Lambda360Order` → `Lambda360Form` に改名した。

| ファイル | 変更内容 |
|---|---|
| `widget/src/Lambda360Order.tsx` | `Lambda360Form.tsx` に git mv |
| `widget/src/Lambda360Form.tsx` | `Lambda360OrderProps` → `Lambda360FormProps`、関数名変更 |
| `widget/src/widget-entry.tsx` | import・型・JSX参照を `Lambda360Form` に変更 |
| `frontend/app/order_box/` | `form_box/` に git mv |
| `frontend/app/page.tsx` | リンクを `/order_box` → `/form_box` に変更 |

---

## npm publish 手順

```bash
cd widget
npm run build          # IIFEとESMを両方ビルド
# package.json の version を上げる
npm publish
```

初回のみ `npm login` が必要。公開後は同バージョンの再公開不可。
