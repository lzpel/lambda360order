# STEP ファイルの Mesh 化とエッジ抽出

OpenCascade.js を使って STEP ファイルを読み込み、三角形メッシュ（面）とエッジ（輪郭線）を抽出して Lambda360View で表示するまでの処理を解説する。

## 全体の流れ

```
STEP読込 → B-Rep形状取得 → メッシュ生成 → 面の三角形抽出 → エッジのカーブ離散化 → ModelData構築
```

---

## 1. STEP ファイルの読み込み

STEP ファイルは ISO 10303 で定義された CAD データ交換フォーマット。OpenCascade の `STEPControl_Reader` で読み込み、B-Rep（境界表現）の `TopoDS_Shape` に変換する。

```typescript
const reader = new oc.STEPControl_Reader_1();
const status = reader.ReadFile(filename);

// IFSelect_RetDone (=1) が成功
if (status !== 1 && status !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
    console.error("Failed to read STEP file, status:", status);
    reader.delete?.();
    return;
}

const progress = new oc.Message_ProgressRange_1();
reader.TransferRoots(progress);
progress.delete?.();
const shape = reader.OneShape();
```

- `ReadFile` で STEP テキストをパースし内部モデルに格納
- `TransferRoots` で内部モデルから B-Rep 形状へ変換（v2 beta では `Message_ProgressRange` 引数が必須）
- `OneShape` で全ルート形状を1つの `TopoDS_Shape` として取得

---

## 2. メッシュ生成（三角化）

B-Rep 形状はパラメトリック曲面（NURBS 等）で構成されており、そのままでは WebGL で描画できない。`BRepMesh_IncrementalMesh` で三角形メッシュに変換する。

```typescript
new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, true);
```

| 引数 | 意味 |
|------|------|
| `shape` | メッシュ化対象の B-Rep 形状 |
| `0.1` | **線形偏差 (deflection)** — 元の曲面からの最大許容誤差。小さいほど高精度 |
| `false` | 相対偏差を使うか（false = 絶対値） |
| `0.5` | **角度偏差** — 曲率が高い部分での分割精度 |
| `true` | 並列処理の有効化 |

この呼び出しにより、shape 内の全 Face に `Poly_Triangulation` が付与される。

---

## 3. 面（Face）からの三角形抽出

`TopExp_Explorer` で shape 内の全 Face を巡回し、各 Face に付与された三角化データを読み出す。

```typescript
const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_FACE,   // Face を探索
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE   // 制限なし
);
```

### 3.1 頂点と法線の取得

```typescript
while (explorer.More()) {
    const face = oc.TopoDS.Face_1(explorer.Current());
    const loc = new oc.TopLoc_Location_1();
    const triangulation = oc.BRep_Tool.Triangulation(face, loc, 0);
```

- `BRep_Tool.Triangulation` で Face に紐づく三角化データ (`Poly_Triangulation`) を取得
- `loc` には Face のローカル座標変換が入る

```typescript
    const tri = triangulation.get();
    const trsf = loc.Transformation();
    const baseIndex = vertices.length / 3;

    for (let i = 1; i <= tri.NbNodes(); i++) {
        const pnt = tri.Node(i).Transformed(trsf);
        vertices.push(pnt.X(), pnt.Y(), pnt.Z());
```

- `Node(i)` でローカル座標の頂点を取得し、`Transformed(trsf)` でワールド座標に変換
- OpenCascade のインデックスは **1始まり**

#### 法線の計算

```typescript
        if (tri.HasUVNodes()) {
            const props = new oc.BRepGProp_Face_2(face, false);
            const uv = tri.UVNode(i);
            const gpPnt = new oc.gp_Pnt_1();
            const gpVec = new oc.gp_Vec_1();
            props.Normal(uv.X(), uv.Y(), gpPnt, gpVec);
            normals.push(gpVec.X(), gpVec.Y(), gpVec.Z());
```

- 三角化データが UV ノードを持っている場合、元のパラメトリック曲面上の UV 座標から正確な法線を計算
- `BRepGProp_Face.Normal(u, v)` が曲面の偏微分から法線ベクトルを算出
- UV が無い場合はフォールバックとして `(0, 0, 1)` を使用

### 3.2 三角形インデックスの取得

```typescript
    for (let i = 1; i <= tri.NbTriangles(); i++) {
        const triangle = tri.Triangle(i);
        let n1 = triangle.Value(1) - 1 + baseIndex;
        let n2 = triangle.Value(2) - 1 + baseIndex;
        let n3 = triangle.Value(3) - 1 + baseIndex;

        // Face の向きが反転している場合、巻き方向を逆にする
        if (face.Orientation_1() === oc.TopAbs_Orientation.TopAbs_REVERSED) {
            [n2, n3] = [n3, n2];
        }
        triangles.push(n1, n2, n3);
    }
```

- `Triangle(i).Value(1..3)` で三角形の3頂点インデックスを取得（1始まり）
- `-1` で 0始まりに変換し、`baseIndex` でグローバルオフセットを加算
- **Face の Orientation が REVERSED の場合**、法線が裏返るため頂点の巻き順を入れ替えて表裏を正す

---

## 4. エッジの抽出

### なぜ `BRep_Tool.Polygon3D` では駄目なのか

トーラス等の OCC 内部で生成した形状では `BRep_Tool.Polygon3D` でエッジのポリライン表現を取得できる。しかし **STEP ファイルから読み込んだ形状では Polygon3D が空になる**ことが多い。STEP はパラメトリックカーブの定義のみを持ち、離散化済みポリラインを保持しないためである。

### 解決策：BRepAdaptor_Curve + GCPnts_TangentialDeflection

エッジの幾何カーブを直接離散化する。

```typescript
const edgeExplorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_EDGE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
);

while (edgeExplorer.More()) {
    const edge = oc.TopoDS.Edge_1(edgeExplorer.Current());
    try {
        const adaptor = new oc.BRepAdaptor_Curve_2(edge);
```

- `BRepAdaptor_Curve` はエッジの 3D カーブをアダプタパターンでラップし、統一的なカーブインターフェースを提供

```typescript
        const tangDef = new oc.GCPnts_TangentialDeflection_2(
            adaptor, 0.1, 0.1, 2, 1.0e-7, 1.0e-2
        );
```

| 引数 | 意味 |
|------|------|
| `adaptor` | 離散化対象のカーブ |
| `0.1` (1つ目) | **角度偏差** — 隣接セグメント間の最大角度変化（ラジアン） |
| `0.1` (2つ目) | **曲率偏差** — 元のカーブからの最大許容距離 |
| `2` | **最小点数** |
| `1.0e-7` | パラメータ空間での最小分解能 |
| `1.0e-2` | パラメータ空間での最小ステップ |

`GCPnts_TangentialDeflection` は曲率に応じて適応的にサンプル点を配置する。直線部分は少ない点で、曲線部分は多くの点で離散化される。

```typescript
        const nbPoints = tangDef.NbPoints();
        for (let i = 1; i < nbPoints; i++) {
            const p1 = tangDef.Value(i);
            const p2 = tangDef.Value(i + 1);
            edges.push(p1.X(), p1.Y(), p1.Z(), p2.X(), p2.Y(), p2.Z());
            p1.delete?.();
            p2.delete?.();
        }
```

- 隣接する2点をペアにして線分セグメントとして `edges` 配列に格納
- Lambda360View の edges フォーマットは `[x1,y1,z1, x2,y2,z2, ...]` の線分列

---

## 5. ModelData の構築

抽出したデータを Lambda360View の `ModelData` 形式にまとめる。

```typescript
const newModelData: ModelData = {
    version: 3,
    name: "step-model",
    id: "/step-model",
    parts: [
        {
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
            loc: [[0, 0, 0], [0, 0, 0, 1]],  // 位置, 四元数
        },
    ],
    bb: {
        xmin: minX, xmax: maxX,
        ymin: minY, ymax: maxY,
        zmin: minZ, zmax: maxZ,
    },
};
```

| フィールド | 内容 |
|-----------|------|
| `vertices` | 頂点座標 (Float32Array, xyz が連続) |
| `normals` | 法線ベクトル (Float32Array, 頂点と1:1対応) |
| `triangles` | 三角形インデックス (Uint32Array, 3つ1組) |
| `edges` | エッジ線分 (Float32Array, 6つ1組 = 始点xyz + 終点xyz) |
| `bb` | バウンディングボックス（カメラ初期位置の計算に使用） |

---

## メモリ管理について

OpenCascade.js は Emscripten 経由の C++ バインディングであり、JavaScript の GC では C++ 側のメモリが解放されない。使い終わったオブジェクトは必ず `.delete()` を呼ぶ必要がある。

```typescript
pnt.delete?.();       // gp_Pnt
gpVec.delete?.();     // gp_Vec
explorer.delete?.();  // TopExp_Explorer
reader.delete?.();    // STEPControl_Reader
shape.delete?.();     // TopoDS_Shape
```

`?.` を使うのは、一部のラッパーオブジェクトでは `delete` が存在しない場合があるため。
