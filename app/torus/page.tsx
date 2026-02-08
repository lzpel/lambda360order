"use client";

import React, { useCallback, useState } from "react";
import initOpenCascade from "opencascade.js";

export default function TorusPage() {
    const [busy, setBusy] = useState(false);

    const generate = useCallback(async () => {
        setBusy(true);
        try {
            // OpenCascade.js 初期化
            const oc = await initOpenCascade();

            // 1) トーラス生成 (major radius, minor radius)
            // OCCTのトーラス生成は BRepPrimAPI_MakeTorus
            const major = 30;
            const minor = 10;
            const mk = new oc.BRepPrimAPI_MakeTorus_1(major, minor);
            const shape = mk.Shape(); // TopoDS_Shape

            // 2) STL書き出し前に三角化（メッシュ化）
            // ここで精度（deflection等）をパラメータ化すると「高品質プレビュー」と整合が取りやすい
            const linearDeflection = 0.2; // 小さいほど細かい
            const angularDeflection = 0.5; // ラジアン相当
            new oc.BRepMesh_IncrementalMesh_2(
                shape,
                linearDeflection,
                false,
                angularDeflection,
                true
            );

            // 3) STLを書き出す（仮想FSに出力 → 読み出し）
            const outPath = "/torus.stl";
            // StlAPI.Write静的メソッドを使用（shape, filename, isAscii）
            oc.StlAPI.Write(shape, outPath, true);

            // 4) 仮想FSから読み出してダウンロード
            const data = oc.FS.readFile(outPath); // Uint8Array
            const blob = new Blob([new Uint8Array(data)], {
                type: "application/sla",
            });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "torus.stl";
            a.click();
            URL.revokeObjectURL(url);

            // 後片付け（WASMメモリ節約）
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
