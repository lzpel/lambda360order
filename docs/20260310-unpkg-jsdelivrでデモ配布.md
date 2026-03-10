# unpkg/jsDelivr でデモ配布ロードマップ

## 目標

`https://unpkg.com/lambda360form@latest/dist/index.html` で全デモを一覧表示し、
各デモを `https://unpkg.com/lambda360form@latest/dist/demos/01_板金制御盤ボックス/index.html` のようにバージョン固定でアクセスできるようにする。

## 現状

```
demos/                        ← Rust プロジェクト（独立）
  Cargo.toml                  ← minijinja 依存
  main.rs                     ← template.html × script.js → index.html を生成
  template.html               ← HTML テンプレート
  01_板金制御盤ボックス/
    script.js                 ← params + lambda 定義
    README.md
  02_セミオーダーカラー/
    script.js
  ...（20 デモ）

widget/                       ← npm パッケージ lambda360form
  package.json
  src/
  dist/                       ← npm publish 対象（"files": ["dist"]）
    lambda360form.js          ← IIFE バンドル（unpkg/jsdelivr のデフォルト）
    esm/index.js              ← ESM
```

## 課題

- デモ生成に Rust ツールチェーン（`cargo run`）が必要で、JS エコシステムから独立している
- `demos/` が `widget/` と別ディレクトリのため npm publish フローに組み込めない
- デモ HTML が `dist/` に含まれないので unpkg から配信できない

## ロードマップ

### Step 1: `demos/` を `widget/demos/` に移動

```
widget/
  demos/
    template.html             ← Rust 版から流用（Jinja2 構文 → JS テンプレートに書き換え）
    generateDemo.ts           ← 新規：TypeScript 生成スクリプト
    01_板金制御盤ボックス/
      script.js
      README.md
    ...（20 デモ）
```

- `demos/Cargo.toml`, `demos/main.rs`, `demos/makefile` は削除
- `demos/Cargo.lock` は削除

### Step 2: Rust → TypeScript 化（`widget/demos/generateDemo.ts`）

`main.rs` の処理をそのまま TypeScript に移植する。`tsx` で実行するため追加設定不要。

```ts
// widget/demos/generateDemo.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(path.join(__dirname, "template.html"), "utf-8");

function render(template: string, vars: { title: string; version: string; script: string }): string {
  // minijinja の {{ var }} と {{ script | indent(8) | safe }} を再現
  return template
    .replace(/\{\{\s*title\s*\}\}/g, vars.title)
    .replace(/\{\{\s*version\s*\}\}/g, vars.version)
    .replace(/\{\{\s*script\s*\|.*?\}\}/g, vars.script.replace(/^/gm, "        ").trimStart());
}

const version = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")).version;
const demosDir = __dirname;
const outDir = path.join(__dirname, "../dist/demos");
fs.mkdirSync(outDir, { recursive: true });

const entries = fs.readdirSync(demosDir)
  .filter(name => fs.statSync(path.join(demosDir, name)).isDirectory())
  .sort();

const demoList: { name: string; description: string }[] = [];

for (const name of entries) {
  const scriptPath = path.join(demosDir, name, "script.js");
  if (!fs.existsSync(scriptPath)) continue;

  const script = fs.readFileSync(scriptPath, "utf-8");
  const html = render(template, { title: name, version, script });

  const demoOutDir = path.join(outDir, name);
  fs.mkdirSync(demoOutDir, { recursive: true });
  fs.writeFileSync(path.join(demoOutDir, "index.html"), html);
  console.log(`Generated: dist/demos/${name}/index.html`);

  const readme = path.join(demosDir, name, "README.md");
  const description = fs.existsSync(readme)
    ? fs.readFileSync(readme, "utf-8").split("\n")[0].replace(/^#+\s*/, "")
    : "";
  demoList.push({ name, description });
}

// dist/index.html：デモ一覧ページ
const indexHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>lambda360form デモ一覧 v${version}</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 16px; }
    ul { list-style: none; padding: 0; }
    li { margin: 12px 0; }
    a { font-size: 1.1em; }
    small { color: #666; display: block; }
  </style>
</head>
<body>
  <h1>lambda360form デモ一覧</h1>
  <p>バージョン: <code>${version}</code></p>
  <ul>
${demoList.map(d => `    <li><a href="demos/${d.name}/index.html">${d.name}</a><small>${d.description}</small></li>`).join("\n")}
  </ul>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "../dist/index.html"), indexHtml);
console.log("Generated: dist/index.html");
console.log(`${demoList.length} demo(s) generated.`);
```

### Step 3: `widget/package.json` にビルドスクリプト追加

```json
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build && vite build --mode lib && npx tsx demos/generateDemo.ts",
    "demos": "npx tsx demos/generateDemo.ts"
  },
  "files": [
    "dist"
  ],
  "devDependencies": {
    "tsx": "^4"
  }
}
```

`build` 時に自動でデモ HTML も生成され `dist/` に含まれる。`tsx` は TypeScript ファイルをそのまま実行できるため、`ts-node` のような追加設定不要。

### Step 4: テンプレート書き換え（`widget/demos/template.html`）

Rust の `template.html` の Jinja2 構文はそのまま使えるが、
`generateDemo.ts` 側の `render()` 関数でパース済みのため変更不要。

### Step 5: `widget/Makefile` 更新

```makefile
deploy:
    npm run build

demos:
    npx tsx demos/generateDemo.ts
```

## 配布後のURL構成

| URL | 内容 |
|-----|------|
| `https://unpkg.com/lambda360form@latest/dist/index.html` | デモ一覧ページ |
| `https://unpkg.com/lambda360form@0.1.6/dist/index.html` | v0.1.6 のデモ一覧（固定） |
| `https://unpkg.com/lambda360form@latest/dist/demos/01_板金制御盤ボックス/index.html` | 各デモ |
| `https://unpkg.com/lambda360form@latest/dist/lambda360form.js` | IIFE バンドル（従来通り） |

## 削除対象

- `demos/Cargo.toml`
- `demos/Cargo.lock`
- `demos/main.rs`
- `demos/makefile`

（`template.html` と各デモの `script.js`, `README.md` は `widget/demos/` へ移動）

## 効果

- Rust ツールチェーン不要でデモ生成可能
- `npm run build` 一発で JS バンドル + デモ HTML が `dist/` に揃う
- `npm publish` するだけでバージョン固定のデモが unpkg/jsDelivr から永続アクセス可能
- 過去バージョンのデモは URL のバージョン番号を変えるだけで参照できる
