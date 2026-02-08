"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import initOpenCascade, { OpenCascadeInstance } from "opencascade.js";

export default function HomePage() {
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [majorRadius, setMajorRadius] = useState(30);
  const [minorRadius, setMinorRadius] = useState(10);
  const ocRef = useRef<OpenCascadeInstance | null>(null);

  // ページ読み込み時にOpenCascadeを初期化
  useEffect(() => {
    initOpenCascade().then((oc) => {
      ocRef.current = oc;
      setLoading(false);
    });
  }, []);

  const generate = useCallback(async () => {
    const oc = ocRef.current;
    if (!oc) return;

    setBusy(true);
    try {
      // トーラス生成 (major radius, minor radius)
      const mk = new oc.BRepPrimAPI_MakeTorus_1(majorRadius, minorRadius);
      const shape = mk.Shape();

      // STL書き出し前に三角化
      const linearDeflection = 0.2;
      const angularDeflection = 0.5;
      new oc.BRepMesh_IncrementalMesh_2(
        shape,
        linearDeflection,
        false,
        angularDeflection,
        true
      );

      // STLを書き出す
      const outPath = "/torus.stl";
      oc.StlAPI.Write(shape, outPath, true);

      // ダウンロード
      const data = oc.FS.readFile(outPath);
      const blob = new Blob([new Uint8Array(data)], {
        type: "application/sla",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `torus_${majorRadius}_${minorRadius}.stl`;
      a.click();
      URL.revokeObjectURL(url);

      mk.delete?.();
      shape.delete?.();
    } finally {
      setBusy(false);
    }
  }, [majorRadius, minorRadius]);

  const ratio = majorRadius > 0 ? (minorRadius / majorRadius).toFixed(2) : "0";

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Torus STL Generator (OpenCascade.js)</h1>

      {loading ? (
        <p>Loading OpenCascade.js...</p>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label>
              Major Radius (外側):
              <input
                type="number"
                value={majorRadius}
                onChange={(e) => setMajorRadius(Number(e.target.value))}
                min={1}
                style={{ marginLeft: 8, width: 80 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>
              Minor Radius (内側):
              <input
                type="number"
                value={minorRadius}
                onChange={(e) => setMinorRadius(Number(e.target.value))}
                min={1}
                max={majorRadius}
                style={{ marginLeft: 8, width: 80 }}
              />
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <strong>Ratio (minor/major):</strong> {ratio}
          </div>

          <button onClick={generate} disabled={busy}>
            {busy ? "Generating..." : "Generate torus.stl"}
          </button>
        </div>
      )}
    </main>
  );
}
