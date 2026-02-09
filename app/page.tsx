"use client";

import React, { useCallback, useState, useEffect, useRef, useMemo } from "react";
import initOpenCascade from "opencascade.js";
import { Lambda360View, ModelData } from "lambda360view";

export default function HomePage() {
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [majorRadius, setMajorRadius] = useState(30);
  const [minorRadius, setMinorRadius] = useState(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ocRef = useRef<any>(null);

  // ページ読み込み時にOpenCascadeを初期化
  useEffect(() => {
    initOpenCascade().then((oc) => {
      ocRef.current = oc;
      setLoading(false);
    });
  }, []);

  // OpenCascadeのトーラス形状からModelData形式に変換
  const modelData = useMemo<ModelData | null>(() => {
    const oc = ocRef.current;
    if (!oc || loading) return null;

    // トーラス形状を生成
    const mk = new oc.BRepPrimAPI_MakeTorus_1(majorRadius, minorRadius);
    const shape = mk.Shape();

    // 三角化
    new oc.BRepMesh_IncrementalMesh_2(shape, 0.5, false, 0.5, true);

    // 頂点・法線・三角形インデックスを抽出
    const vertices: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];
    const edges: number[] = [];

    // 面を走査
    const explorer = new oc.TopExp_Explorer_2(
      shape,
      oc.TopAbs_ShapeEnum.TopAbs_FACE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );

    while (explorer.More()) {
      const face = oc.TopoDS.Face_1(explorer.Current());
      const loc = new oc.TopLoc_Location_1();
      const triangulation = oc.BRep_Tool.Triangulation(face, loc, 0);

      if (!triangulation.IsNull()) {
        const tri = triangulation.get();
        const nbNodes = tri.NbNodes();
        const nbTriangles = tri.NbTriangles();
        const trsf = loc.Transformation();
        const baseIndex = vertices.length / 3;

        // 頂点を追加
        for (let i = 1; i <= nbNodes; i++) {
          const pnt = tri.Node(i).Transformed(trsf);
          vertices.push(pnt.X(), pnt.Y(), pnt.Z());

          // 法線も計算
          if (tri.HasUVNodes()) {
            const surface = oc.BRep_Tool.Surface_2(face);
            const uv = tri.UVNode(i);
            const props = new oc.BRepGProp_Face_2(face, false);
            const gpPnt = new oc.gp_Pnt_1();
            const gpVec = new oc.gp_Vec_1();
            props.Normal(uv.X(), uv.Y(), gpPnt, gpVec);
            normals.push(gpVec.X(), gpVec.Y(), gpVec.Z());
            gpPnt.delete?.();
            gpVec.delete?.();
            props.delete?.();
            surface.delete?.();
          } else {
            normals.push(0, 0, 1);
          }
          pnt.delete?.();
        }

        // 三角形インデックスを追加
        for (let i = 1; i <= nbTriangles; i++) {
          const triangle = tri.Triangle(i);
          let n1 = triangle.Value(1) - 1 + baseIndex;
          let n2 = triangle.Value(2) - 1 + baseIndex;
          let n3 = triangle.Value(3) - 1 + baseIndex;

          // Faceのorientationを考慮
          if (face.Orientation_1() === oc.TopAbs_Orientation.TopAbs_REVERSED) {
            [n2, n3] = [n3, n2];
          }
          triangles.push(n1, n2, n3);
          triangle.delete?.();
        }

      }

      loc.delete?.();
      triangulation.delete?.();
      face.delete?.();
      explorer.Next();
    }

    explorer.delete?.();

    // エッジを抽出
    const edgeExplorer = new oc.TopExp_Explorer_2(
      shape,
      oc.TopAbs_ShapeEnum.TopAbs_EDGE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );

    while (edgeExplorer.More()) {
      const edge = oc.TopoDS.Edge_1(edgeExplorer.Current());
      const loc = new oc.TopLoc_Location_1();
      const poly = oc.BRep_Tool.Polygon3D(edge, loc);

      if (!poly.IsNull()) {
        const polyData = poly.get();
        const nbNodes = polyData.NbNodes();
        const trsf = loc.Transformation();

        for (let i = 1; i < nbNodes; i++) {
          const p1 = polyData.Nodes().Value(i).Transformed(trsf);
          const p2 = polyData.Nodes().Value(i + 1).Transformed(trsf);
          edges.push(p1.X(), p1.Y(), p1.Z(), p2.X(), p2.Y(), p2.Z());
          p1.delete?.();
          p2.delete?.();
        }

        polyData.delete?.();
      }

      loc.delete?.();
      poly.delete?.();
      edge.delete?.();
      edgeExplorer.Next();
    }

    edgeExplorer.delete?.();
    mk.delete?.();
    shape.delete?.();

    // バウンディングボックスを計算
    const r = majorRadius + minorRadius;
    const bb = {
      xmin: -r, xmax: r,
      ymin: -r, ymax: r,
      zmin: -minorRadius, zmax: minorRadius,
    };

    return {
      version: 3,
      name: "torus",
      id: "/torus",
      parts: [
        {
          id: "/torus/body",
          name: "body",
          type: "shapes",
          shape: {
            vertices: new Float32Array(vertices),
            normals: new Float32Array(normals),
            triangles: new Uint32Array(triangles),
            edges: new Float32Array(edges),
          },
          color: "#4A90D9",
          loc: [[0, 0, 0], [0, 0, 0, 1]],
        },
      ],
      bb,
    };
  }, [loading, majorRadius, minorRadius]);

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
        <div style={{ display: "flex", gap: 24 }}>
          {/* 左側: パラメーター & ボタン */}
          <div style={{ flex: "0 0 300px" }}>
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

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={generateSTL} disabled={busy}>
                {busy ? "Generating..." : "Generate torus.stl"}
              </button>
              <button onClick={generateSTEP} disabled={busy}>
                {busy ? "Generating..." : "Generate torus.step"}
              </button>
            </div>
          </div>

          {/* 右側: 3Dプレビュー */}
          <div style={{ flex: 1, minHeight: 400, border: "1px solid #ccc", borderRadius: 8 }}>
            {modelData && (
              <Lambda360View
                model={modelData}
                backgroundColor="#1a1a2e"
                edgeColor="#ffffff"
                showEdges={true}
                width="100%"
                height="400px"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
