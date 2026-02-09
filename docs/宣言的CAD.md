# 宣言的CADシステム提案 (The "Super Masao" Approach)

## コンセプト

「スーパー正男」がHTMLタグ（paramタグなど）でゲームステージを定義していたように、**HTML/XMLタグだけで3D形状を定義できる仕組み**を構築します。
これにより、メーカーやユーザーはJavaScriptを書くことなく、静的なマークアップ言語（またはそれに近い直感的な記述）だけでパラメトリックCADデータを構築できます。

## なぜこれが有効か？

1.  **プログラミング不要**: タグを並べるだけなら、HTMLが書けるレベルの非エンジニア（WebデザイナーやCADオペレーター）でも扱える。
2.  **データとしてのポータビリティ**: 形状定義がテキスト（XML/HTML）になるため、保存・共有・生成が容易。
3.  **既存システムとの親和性**: CMSやECシステムのデータベースに「商品説明」としてこのタグを保存するだけで、動的な3Dプレビューが可能になる。

## アーキテクチャ案 (Declarative CAD with OpenCascade)

React（JSX）の仮想DOM構造を、そのままOpenCascadeのCSG（Constructive Solid Geometry）演算にマッピングします。

### 記述イメージ

```jsx
<CadComponent>
  {/* ベースとなる直方体 */}
  <Box name="base_plate" width={100} height={10} depth={200} />

  {/* 穴あけ（差分演算） */}
  <Difference>
    <Box width={100} height={10} depth={200} />
    {/* 複数の穴を配置 */}
    <Translate x={10} y={0} z={10}>
      <Cylinder radius={5} height={20} />
    </Translate>
    <Translate x={90} y={0} z={190}>
      <Cylinder radius={5} height={20} />
    </Translate>
  </Difference>
</CadComponent>
```

または、よりHTMLライクなカスタム要素として定義し、ブラウザのDOMパーサーをそのまま利用することも可能です。

```html
<oc-scene>
  <oc-difference>
    <oc-box w="100" h="10" d="200"></oc-box>
    <oc-cylinder r="5" h="20" x="10" z="10"></oc-cylinder>
  </oc-difference>
</oc-scene>
```

## 実装ステップ

1.  **プリミティブコンポーネントの実装**: `<Box>`, `<Cylinder>`, `<Sphere>` など、プロパティを受け取って `TopoDS_Shape` を返す関数/コンポーネントを作成。
2.  **演算コンポーネントの実装**: `<Union>`, `<Difference>`, `<Intersection>` など、子要素を受け取ってブーリアン演算を行うコンテナを作成。
3.  **トランスフォームの実装**: `<Translate>`, `<Rotate>` など、座標変換を行うラッパーを作成。
4.  **レンダラー連携**: 最終的に生成された `TopoDS_Shape` をメッシュ化し、Three.js (React Three Fiber) で表示するブリッジを作成。

## 今後の展望

この「マークアップとしてのCAD」が確立すれば、メーカー用の入稿ツールは「テキストエディタ（補完付き）」や「ビジュアルブロックエディタ（Scratchのようなもの）」で済むようになります。
これは `DISCUSS.md` で提案した「No-Code/Low-Code CAD Builder」の基盤技術として非常に強力です。
