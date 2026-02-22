# フロントエンド統合戦略 (FRONTEND.md)

現在、本プロジェクトには `frontend` (Next.js) と `embedded` (Vite) の2つのフロントエンド環境が存在していますが、メンテナンス性とパスの一貫性を向上させるため、以下の統合案を検討しています。

## 現状の課題
- **メンテナンスコスト**: React プロジェクトが2つあり、パッケージ管理や設定（tsconfig等）が二重化している。
- **デモの分散**: `make run` や GitHub Pages での確認先が分散しており、利用者がどこを見るべきか迷う。
- **パスの複雑化**: `frontend` から `embedded` のソースを直接参照するためにエイリアスや `externalDir` 設定など、トリッキーな構成が必要になっている。

## 統合案：`frontend/` の廃止と `embedded/` への集約

`frontend` (Next.js) プロジェクトを削除し、すべての閲覧・デモ機能を `embedded/` 内に統合します。

### 具体的な構成案
- **`/embedded/src/OrderWidget.tsx`**: コアとなる React コンポーネント（ライブラリ本体）。
- **`/embedded/src/pages/`**: 各種デモ・閲覧用アプリケーション（ファイルベースルーティング対象）。
  - `index.tsx`: ポータル画面 (`/`)
  - `torus.tsx`: トーラス生成デモ (`/torus`)
  - `step.tsx`: STEPビューワー (`/step`)
- **`/embedded/src/main.tsx`**: アプリケーション全体のエントリーポイント。

### ファイルベースルーティングの実現
Vite環境でも `vite-plugin-pages` を導入することで、Next.jsと同様のファイルシステムベースのルーティングが可能です。

```typescript
// vite.config.ts イメージ
import Pages from 'vite-plugin-pages'

export default {
  plugins: [
    react(),
    Pages({
      dirs: 'src/pages',
    }),
  ],
}
```

これにより、`src/pages/` 下にファイルを追加するだけで自動的にルートが生成され、Next.js での直感的な開発体験を維持できます。

### 統合によるメリット
1. **ディレクトリの飛び地解消**: `../embedded/src/*` のような相対パス参照が不要になり、すべてのフロントエンドコードが1つの tsconfig 下で管理される。
2. **単一のビルドプロセス**: Vite 1つでライブラリ（`widget.js`）の書き出しと、デモページ（GitHub Pages向け）の両方を効率的にビルドできる。
3. **開発体験の向上**: `make run` で起動するサーバーが1つになり、開発時の混乱がなくなる。

## 実装ステップ（検討中）
1. `frontend/app/` 内のロジック（Torus, STEP, BREP viewer等）を `embedded/src/pages/` 等に移植。
2. `embedded/vite.config.ts` で、複数エントリーポイント（ライブラリ用 `widget.js` と デモ用 `index.html`）をクリーンに書き出す設定を追加。
3. `frontend/` ディレクトリを削除。
4. `makefile` の `run` コマンドを `embedded` の Vite サーバーに向け直す。

---
この構成により、**「ライブラリ開発」と「その使用例（デモ）」が同じプロジェクト内で完結**し、メンテナンス性が劇的に向上します。
