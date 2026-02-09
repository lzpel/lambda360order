# 質問

OCCTをwasmにしてパラメータを3Dモデルに変換しようという考えなのですね それはできることなの？例えばnextjsでocct/wasmを用いてトーラスのstlを生成するコードを書けますか

# 回答

はい、その理解で合っています。**OCCT（OpenCASCADE）をWASM化して、ブラウザ（Next.js）内で「パラメータ→B-Rep生成→STL書き出し」まで完結**できます。実際それをやるためのバインディングが **OpenCascade.js**（`opencascade.js` npm）です。 ([ocjs.org][1])

以下に「Next.jsでトーラスのSTLを生成してダウンロードする」最小構成の例を書きます。

---

## 1) インストール

```bash
npm i opencascade.js@beta
```

OpenCascade.jsのドキュメントでも `@beta` での導入が案内されています。 ([ocjs.org][2])

---

## 2) Next.js の webpack 設定（.wasm をURLとして扱う）

OpenCascade.js側は「.wasmをimportしてバンドラに処理させる」想定で、webpackでは `.wasm` をURL扱いにする設定が必要になります。 ([ocjs.org][2])

`next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // OpenCascade.js docs: Webpack5(=Next.js) では fallback に fs 等を false
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      perf_hooks: false,
      os: false,
      worker_threads: false,
      crypto: false,
      stream: false,
      path: false,
    };

    // .wasm を URL(=asset) として扱う
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
};

module.exports = nextConfig;
```

※ docs例は `file-loader` を使う案ですが、Next/webpack5なら上の `asset/resource` が手軽です（やってることは「wasmをURLで扱う」点で同じ）。 ([ocjs.org][2])

---

## 3) クライアント側で「トーラス→STL生成→ダウンロード」

`app/torus/page.tsx`（App Router想定、**Client Component**）:

```tsx
"use client";

import React, { useCallback, useState } from "react";
import initOpenCascade from "opencascade.js";

// wasm をURLとしてimport（next.config.jsで asset/resource にしている前提）
import wasmUrl from "opencascade.js/dist/opencascade.full.wasm";

export default function TorusPage() {
  const [busy, setBusy] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true);
    try {
      // OpenCascade.js 初期化
      const oc = await initOpenCascade({
        locateFile: (path: string) => {
          // Emscripten が .wasm を探しに来たときに URL を返す
          if (path.endsWith(".wasm")) return wasmUrl as unknown as string;
          return path;
        },
      });

      // 1) トーラス生成 (major radius, minor radius)
      // OCCTのトーラス生成は BRepPrimAPI_MakeTorus
      const major = 30;
      const minor = 10;
      const mk = new oc.BRepPrimAPI_MakeTorus_1(major, minor);
      const shape = mk.Shape(); // TopoDS_Shape

      // 2) STL書き出し前に三角化（メッシュ化）
      // ここで精度（deflection等）をパラメータ化すると「高品質プレビュー」と整合が取りやすい
      const linearDeflection = 0.2;  // 小さいほど細かい
      const angularDeflection = 0.5; // ラジアン相当（実装/バインディングにより扱いが違う場合あり）
      new oc.BRepMesh_IncrementalMesh_2(shape, linearDeflection, false, angularDeflection, true);

      // 3) STLを書き出す（仮想FSに出力 → 読み出し）
      const outPath = "/torus.stl";
      const writer = new oc.StlAPI_Writer();
      // Write(shape, filename)
      writer.Write(shape, outPath);

      // 4) 仮想FSから読み出してダウンロード
      const data = oc.FS.readFile(outPath); // Uint8Array
      const blob = new Blob([data], { type: "application/sla" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "torus.stl";
      a.click();
      URL.revokeObjectURL(url);

      // 後片付け（WASMメモリ節約）
      writer.delete?.();
      mk.delete?.();
      shape.delete?.();
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Torus STL Generator (OpenCascade.js)</h1>
      <button onClick={generate} disabled={busy}>
        {busy ? "Generating..." : "Generate torus.stl"}
      </button>
    </main>
  );
}
```

### このコードでやっていること（根拠）

* トーラス生成：OCCTには `BRepPrimAPI_MakeTorus` があり、OpenCascade.jsにも同クラスのバインディング（`BRepPrimAPI_MakeTorus_1`等）が公開されています。 ([dev.opencascade.org][3])
* STL書き出し：OCCTには `StlAPI_Writer` / `StlAPI::Write` があり、形状からSTLを書けます。 ([dev.opencascade.org][4])
* wasm取り扱い：OpenCascade.jsは `.wasm` を import してバンドラで配布する前提で、webpack設定が必要です。 ([ocjs.org][2])
* wasmサイズ感：full build の wasm はかなり大きい（初回ロード最適化が重要）。 ([ocjs.org][5])

---

## 実務ポイント（あなたの要件に直結）

* **プレビューはブラウザWASMでB-Rep→三角化→描画**（快適）
* **「ダウンロード/発注」ボタン時はサーバでSTEP生成**（確実・軽い）
* そのとき、**ブラウザとサーバで“同じパラメータ→同じ形状”**を出すために

  * 形状生成ロジック（プリミティブやブーリアン手順）を共通化するのが重要

---

必要なら、次の段階として

1. このトーラス例を **Three.js表示（エッジも綺麗）**まで拡張
2. `params JSON` から形状を組み立てる「ミニDSL」を設計
3. サーバ側（OCCTネイティブ）で **STEP生成API**（ジョブ化＋署名URL＋キャッシュ）
   を、あなたの既存Next.js構成に合わせて具体コードに落とします。

[1]: https://ocjs.org/ "OpenCascade.js | OpenCascade.js"
[2]: https://ocjs.org/docs/getting-started/configure-bundler "Configuring Your Bundler | OpenCascade.js"
[3]: https://dev.opencascade.org/doc/refman/html/class_b_rep_prim_a_p_i___make_torus.html?utm_source=chatgpt.com "BRepPrimAPI_MakeTorus Class Reference"
[4]: https://dev.opencascade.org/doc/refman/html/class_stl_a_p_i___writer.html?utm_source=chatgpt.com "StlAPI_Writer Class Reference"
[5]: https://ocjs.org/docs/getting-started/file-size?utm_source=chatgpt.com "A Note About File Size"
