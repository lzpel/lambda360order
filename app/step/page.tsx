"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import initOpenCascade from "opencascade.js";
import { Lambda360View, ModelData } from "lambda360view";

function Lambda360stepview(props: { model_url: string }) {
    const [modelData, setModelData] = useState<ModelData | null>(null);
    const [status, setStatus] = useState("OpenCascade 初期化中...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ocRef = useRef<any>(null);
    const [ocReady, setOcReady] = useState(false);

    // Initialize OpenCascade (once)
    useEffect(() => {
        if (ocRef.current) { setOcReady(true); return; }
        initOpenCascade().then((oc: any) => {
            ocRef.current = oc;
            setOcReady(true);
        });
    }, []);

    // Load STEP when model_url or OC readiness changes
    useEffect(() => {
        const oc = ocRef.current;
        if (!oc || !ocReady || !props.model_url) return;

        let cancelled = false;
        setModelData(null);

        const loadStep = async () => {
            try {
                const t0 = performance.now();
                const elapsed = () => ((performance.now() - t0) / 1000).toFixed(3);

                setStatus("STEP ファイルをダウンロード中...");
                console.log(`[${elapsed()}s] ダウンロード開始`);
                const response = await fetch(props.model_url);
                if (!response.ok) {
                    setStatus("STEP ファイルの取得に失敗しました");
                    return;
                }
                const buffer = await response.arrayBuffer();
                const stepData = new Uint8Array(buffer);
                console.log(`[${elapsed()}s] ダウンロード完了 (${stepData.length} bytes)`);
                if (cancelled) return;

                setStatus("B-Rep 形状を取得中...");
                const filename = "/input.step";
                try { oc.FS.unlink(filename); } catch { /* ignore */ }
                oc.FS.createDataFile("/", "input.step", stepData, true, true, true);

                const reader = new oc.STEPControl_Reader_1();
                const readStatus = reader.ReadFile(filename);
                if (readStatus !== 1 && readStatus !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
                    setStatus("STEP ファイルの読み込みに失敗しました");
                    reader.delete?.();
                    return;
                }

                const progress = new oc.Message_ProgressRange_1();
                reader.TransferRoots(progress);
                progress.delete?.();
                const shape = reader.OneShape();
                console.log(`[${elapsed()}s] B-Rep形状取得完了`);
                if (cancelled) return;

                setStatus("メッシュ生成中...");
                new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, true);
                console.log(`[${elapsed()}s] メッシュ生成完了`);

                const vertices: number[] = [];
                const normals: number[] = [];
                const triangles: number[] = [];
                const edges: number[] = [];

                let minX = Infinity, minY = Infinity, minZ = Infinity;
                let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

                setStatus("三角形抽出中...");
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

                        for (let i = 1; i <= nbNodes; i++) {
                            const pnt = tri.Node(i).Transformed(trsf);
                            const x = pnt.X(), y = pnt.Y(), z = pnt.Z();
                            vertices.push(x, y, z);

                            if (x < minX) minX = x; if (x > maxX) maxX = x;
                            if (y < minY) minY = y; if (y > maxY) maxY = y;
                            if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;

                            if (tri.HasUVNodes()) {
                                const surface = oc.BRep_Tool.Surface_2(face);
                                const uv = tri.UVNode(i);
                                const faceProps = new oc.BRepGProp_Face_2(face, false);
                                const gpPnt = new oc.gp_Pnt_1();
                                const gpVec = new oc.gp_Vec_1();
                                faceProps.Normal(uv.X(), uv.Y(), gpPnt, gpVec);
                                normals.push(gpVec.X(), gpVec.Y(), gpVec.Z());
                                gpPnt.delete?.(); gpVec.delete?.();
                                faceProps.delete?.(); surface.delete?.();
                            } else {
                                normals.push(0, 0, 1);
                            }
                            pnt.delete?.();
                        }

                        for (let i = 1; i <= nbTriangles; i++) {
                            const triangle = tri.Triangle(i);
                            let n1 = triangle.Value(1) - 1 + baseIndex;
                            let n2 = triangle.Value(2) - 1 + baseIndex;
                            let n3 = triangle.Value(3) - 1 + baseIndex;
                            if (face.Orientation_1() === oc.TopAbs_Orientation.TopAbs_REVERSED) {
                                [n2, n3] = [n3, n2];
                            }
                            triangles.push(n1, n2, n3);
                            triangle.delete?.();
                        }
                    }
                    loc.delete?.(); triangulation.delete?.(); face.delete?.();
                    explorer.Next();
                }
                explorer.delete?.();
                console.log(`[${elapsed()}s] 三角形抽出完了 (${vertices.length / 3} vertices, ${triangles.length / 3} triangles)`);
                if (cancelled) return;

                setStatus("エッジ離散化中...");
                const edgeExplorer = new oc.TopExp_Explorer_2(
                    shape,
                    oc.TopAbs_ShapeEnum.TopAbs_EDGE,
                    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
                );

                while (edgeExplorer.More()) {
                    const edge = oc.TopoDS.Edge_1(edgeExplorer.Current());
                    try {
                        const adaptor = new oc.BRepAdaptor_Curve_2(edge);
                        const tangDef = new oc.GCPnts_TangentialDeflection_2(
                            adaptor, 0.1, 0.1, 2, 1.0e-7, 1.0e-2
                        );
                        const nbPoints = tangDef.NbPoints();
                        for (let i = 1; i < nbPoints; i++) {
                            const p1 = tangDef.Value(i);
                            const p2 = tangDef.Value(i + 1);
                            edges.push(p1.X(), p1.Y(), p1.Z(), p2.X(), p2.Y(), p2.Z());
                            p1.delete?.(); p2.delete?.();
                        }
                        tangDef.delete?.(); adaptor.delete?.();
                    } catch { /* skip degenerate edges */ }
                    edge.delete?.();
                    edgeExplorer.Next();
                }
                edgeExplorer.delete?.();
                console.log(`[${elapsed()}s] エッジ離散化完了 (${edges.length / 6} segments)`);

                reader.delete?.(); shape.delete?.();

                if (minX === Infinity) {
                    minX = -100; maxX = 100;
                    minY = -100; maxY = 100;
                    minZ = -100; maxZ = 100;
                }

                const newModelData: ModelData = {
                    version: 3,
                    name: "step-model",
                    id: "/step-model",
                    parts: [{
                        id: "/step-model/body",
                        name: "body",
                        type: "shapes",
                        shape: {
                            vertices: new Float32Array(vertices),
                            normals: new Float32Array(normals),
                            triangles: new Uint32Array(triangles),
                            edges: new Float32Array(edges),
                        },
                        color: "#999999",
                        loc: [[0, 0, 0], [0, 0, 0, 1]],
                    }],
                    bb: { xmin: minX, xmax: maxX, ymin: minY, ymax: maxY, zmin: minZ, zmax: maxZ },
                };

                console.log(`[${elapsed()}s] モデルデータ構築完了`);
                if (!cancelled) setModelData(newModelData);

            } catch (e) {
                console.error("Error loading STEP:", e);
                if (!cancelled) setStatus("STEP ファイルの処理中にエラーが発生しました");
            }
        };

        loadStep();
        return () => { cancelled = true; };
    }, [props.model_url, ocReady]);

    if (!modelData) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%", flexDirection: "column" }}>
                <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{status}</p>
            </div>
        );
    }

    return (
        <Lambda360View
            model={modelData}
            backgroundColor="#f5f5f5"
            edgeColor="#333333"
            showEdges={true}
            width="100%"
            height="100%"
        />
    );
}

export default function StepPage() {
    const [modelUrl, setModelUrl] = useState("/daen.step");
    const [fileName, setFileName] = useState("daen.step");
    const blobUrlRef = useRef<string | null>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // 前の blob URL を解放
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const url = URL.createObjectURL(file);
        blobUrlRef.current = url;
        setModelUrl(url);
        setFileName(file.name);
    }, []);

    return (
        <main style={{ width: "100%", height: "100vh", padding: 0, margin: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "8px 16px", borderBottom: "1px solid #ccc", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <label style={{ cursor: "pointer", padding: "4px 12px", border: "1px solid #888", borderRadius: 4, fontSize: 14 }}>
                    STEP ファイルを選択
                    <input type="file" accept=".step,.stp,.STEP,.STP" onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                <span style={{ fontSize: 14, color: "#666" }}>{fileName}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
                <Lambda360stepview model_url={modelUrl} />
            </div>
        </main>
    );
}
