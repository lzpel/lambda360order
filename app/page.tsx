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

  const createTorusShape = useCallback(() => {
    const oc = ocRef.current;
    if (!oc) return null;

    const mk = new oc.BRepPrimAPI_MakeTorus_1(majorRadius, minorRadius);
    return { oc, mk, shape: mk.Shape() };
  }, [majorRadius, minorRadius]);

  const generateSTL = useCallback(async () => {
    const result = createTorusShape();
    if (!result) return;
    const { oc, mk, shape } = result;

    setBusy(true);
    try {
      // 三角化
      new oc.BRepMesh_IncrementalMesh_2(shape, 0.2, false, 0.5, true);

      // STL書き出し
      const outPath = "/torus.stl";
      oc.StlAPI.Write(shape, outPath, true);

      // ダウンロード
      const data = oc.FS.readFile(outPath);
      const blob = new Blob([new Uint8Array(data)], { type: "application/sla" });
      downloadBlob(blob, `torus_${majorRadius}_${minorRadius}.stl`);

      mk.delete?.();
      shape.delete?.();
    } finally {
      setBusy(false);
    }
  }, [createTorusShape, majorRadius, minorRadius]);

  const generateSTEP = useCallback(async () => {
    const result = createTorusShape();
    if (!result) return;
    const { oc, mk, shape } = result;

    setBusy(true);
    try {
      // STEPControl_Writer を使用
      const writer = new oc.STEPControl_Writer_1();
      const progress = new oc.Message_ProgressRange_1();

      // Transfer: shape を STEP モデルに変換
      // STEPControl_AsIs = 0
      writer.Transfer(shape, oc.STEPControl_StepModelType.STEPControl_AsIs, true, progress);

      // STEP ファイルに書き出し
      const outPath = "/torus.step";
      writer.Write(outPath);

      // ダウンロード
      const data = oc.FS.readFile(outPath);
      const blob = new Blob([new Uint8Array(data)], { type: "application/step" });
      downloadBlob(blob, `torus_${majorRadius}_${minorRadius}.step`);

      writer.delete?.();
      progress.delete?.();
      mk.delete?.();
      shape.delete?.();
    } finally {
      setBusy(false);
    }
  }, [createTorusShape, majorRadius, minorRadius]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

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

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={generateSTL} disabled={busy}>
              {busy ? "Generating..." : "Generate torus.stl"}
            </button>
            <button onClick={generateSTEP} disabled={busy}>
              {busy ? "Generating..." : "Generate torus.step"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
