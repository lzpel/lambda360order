import "@typespec/http";
import "@typespec/openapi3";
import "./lib.js";

using TypeSpec.Http;

@service(#{
  title: "Lambda360 API",
})
@server("/api", "Main server")
namespace Lambda360;

@route("/hello")
namespace Hello {
  @get
  op sayHello(): string;
}

model FileExists {
  exists: boolean;
  uploadUrl?: string;
  expiresAt?: utcDateTime;
}

@route("/step")
namespace Step {
  @route("/{sha256}")
  @get
  op exists(@path sha256: string): FileExists;
}

namespace Viewer {
  @route("/view")
  @get
  op view(@query sha256: string): {
    @header contentType: "model/gltf-binary";
    @body body: bytes;
  };
}

// ---------------------------------------------------------------------------
// Shape schema
// ---------------------------------------------------------------------------

/** 数値定数または $式 (例: 100.0, "$width", "$width * 0.5 + 50") */
union NumberOrExpr {
  num: float64,
  expr: string,
}

/**
 * 形状演算ノードの共通フィールド（任意）
 * ※これは OpenAPI の oneOf 生成のために必須ではないが、共通項を置きたい場合に便利
 */
model ShapeNodeBase {
  `op`: string;
}

/** STEPファイルの読み込み */
model StepNode extends ShapeNodeBase {
  `op`: "step";
  /** STEPファイルのパス (S3キー等) */
  path: string;
  /** キャッシュ無効化用コンテンツハッシュ "sha256:<hex64>" */
  content_hash?: string;
}

/** ブーリアン合体 (BRepAlgoAPI_Fuse) */
model UnionShapeNode extends ShapeNodeBase {
  `op`: "union";
  a: ShapeNode;
  b: ShapeNode;
}

/** ブーリアン共通部分 (BRepAlgoAPI_Common) */
model IntersectNode extends ShapeNodeBase {
  `op`: "intersect";
  a: ShapeNode;
  b: ShapeNode;
}

/** ブーリアン差演算: a から b をくり抜く (BRepAlgoAPI_Cut) */
model SubtractNode extends ShapeNodeBase {
  `op`: "subtract";
  a: ShapeNode;
  b: ShapeNode;
}

/** 一様拡大縮小 */
model ScaleNode extends ShapeNodeBase {
  `op`: "scale";
  shape: ShapeNode;
  factor: NumberOrExpr;
}

/** 平行移動 */
model TranslateNode extends ShapeNodeBase {
  `op`: "translate";
  shape: ShapeNode;
  /** 移動量 [x, y, z] (mm) */
  xyz: NumberOrExpr[];
}

/** 回転 */
model RotateNode extends ShapeNodeBase {
  `op`: "rotate";
  shape: ShapeNode;
  /** 回転軸ベクトル [ax, ay, az] */
  axis: NumberOrExpr[];
  /** 回転角度 (度) */
  deg: NumberOrExpr;
}

/** 伸縮: 切断面で形状を分割して指定方向に伸ばす */
model StretchNode extends ShapeNodeBase {
  `op`: "stretch";
  shape: ShapeNode;
  /** 切断面の座標 [cx, cy, cz] (mm) */
  cut: NumberOrExpr[];
  /** 各軸方向の伸縮量 [dx, dy, dz] (mm) */
  delta: NumberOrExpr[];
}

/**
 * ★ここが主役：discriminated union を “ShapeNode” として定義
 * これが OpenAPI で oneOf + discriminator になりやすい
 */
union ShapeNode {
  step: StepNode,
  `union`: UnionShapeNode,
  intersect: IntersectNode,
  subtract: SubtractNode,
  scale: ScaleNode,
  translate: TranslateNode,
  rotate: RotateNode,
  stretch: StretchNode,
}

// ---------------------------------------------------------------------------
// /shape API
// ---------------------------------------------------------------------------

@route("/shape")
namespace Shape {
  /** ShapeNode を受け取り、演算結果を GLB (GLTF Binary) として返す */
  @post
  op compute(@body shape: ShapeNode): {
    @header contentType: "model/gltf-binary";
    @body body: bytes;
  };
}
