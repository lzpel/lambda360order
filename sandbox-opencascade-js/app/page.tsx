"use client";

import React, { useState, useEffect, useRef } from "react";
// @ts-ignore
import initOpenCascade from "opencascade.js";
import { Lambda360View, ModelData } from "lambda360view";

export default function Page() {
    const [modelData, setModelData] = useState<ModelData | null>(null);
    const [status, setStatus] = useState("OpenCascade 初期化中...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ocRef = useRef<any>(null);
    const [ocReady, setOcReady] = useState(false);

    useEffect(() => {
        if (ocRef.current) return;
        initOpenCascade().then((oc: any) => {
            ocRef.current = oc;
            setOcReady(true);
        });
    }, []);

    useEffect(() => {
        if (!ocReady || !ocRef.current) return;
        const oc = ocRef.current;
        setStatus("BREP ファイルをダウンロード中...");

        const loadBrep = async () => {
            try {
                const response = await fetch("/PA-001-DF7.brep");
                if (!response.ok) throw new Error("Failed to fetch BREP file");
                const buffer = await response.arrayBuffer();
                const data = new Uint8Array(buffer);

                const filename = "/input.brep";
                try { oc.FS.unlink(filename); } catch { /* ignore */ }
                oc.FS.createDataFile("/", "input.brep", data, true, true, true);

                setStatus("BREP 読み込み中...");
                const shape = new oc.TopoDS_Shape();
                const builder = new oc.BRep_Builder();

                // Try to read BREP with flexible function name resolution
                let result = false;
                const progress = new oc.Message_ProgressRange_1();

                // BindingError suggests incorrect arguments. 
                // Newer OCCT versions require Message_ProgressRange as the 4th argument.
                // We specifically target Read_2 which was found in the list.
                try {
                    // Try with 4 arguments: (Shape, File, Builder, Progress)
                    console.log("Attempting Read_2 with 4 arguments...");
                    const res = oc.BRepTools.Read_2(shape, filename, builder, progress);
                    if (res) {
                        result = true;
                        console.log("Successfully read BREP using Read_2 (4 args)");
                    }
                } catch (e) {
                    console.warn("Read_2 with 4 args failed:", e);
                    try {
                        // Fallback to 3 arguments
                        console.log("Attempting Read_2 with 3 arguments...");
                        const res = oc.BRepTools.Read_2(shape, filename, builder);
                        if (res) {
                            result = true;
                            console.log("Successfully read BREP using Read_2 (3 args)");
                        }
                    } catch (e2) {
                        console.warn("Read_2 with 3 args failed:", e2);
                    }
                }
                progress.delete();

                if (!result) {
                    console.error("All BRepTools.Read attempts failed");
                    // Debug: list available methods to help diagnosis
                    try {
                        console.log("Available BRepTools methods:", Object.keys(oc.BRepTools));
                    } catch (e) {
                        console.error("Failed to list BRepTools methods", e);
                    }
                }
                if (!result) {
                    setStatus("BREP 読み込み失敗");
                    return;
                }

                setStatus("メッシュ生成中...");
                new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, true);

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
                    } catch { /* skip */ }
                    edge.delete?.();
                    edgeExplorer.Next();
                }
                edgeExplorer.delete?.();

                shape.delete?.();

                if (minX === Infinity) {
                    minX = -100; maxX = 100;
                    minY = -100; maxY = 100;
                    minZ = -100; maxZ = 100;
                }

                const newModelData: ModelData = {
                    version: 3,
                    name: "brep-model",
                    id: "/brep-model",
                    parts: [{
                        id: "/brep-model/body",
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

                setModelData(newModelData);

            } catch (e) {
                console.error("Error loading BREP:", e);
                setStatus("エラーが発生しました: " + e);
            }
        };
        loadBrep();
    }, [ocReady]);

    if (!modelData) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100vh" }}>
                <p>{status}</p>
            </div>
        );
    }

    return (
        <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            <Lambda360View
                model={modelData}
                backgroundColor="#f5f5f5"
                edgeColor="#333333"
                showEdges={true}
                width="100%"
                height="100%"
            />
        </div>
    );
}
