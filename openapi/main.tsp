import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service(#{
  title: "Lambda360 API",
})
@server("/api", "Main server")
namespace Lambda360;

/**
 * このAPIサーバーのバージョンと使用しているS3バケット名を返します。
 */
@route("/version")
@get
op version(): string;

/**
 * STEPファイルのアップロード、BREP形式への変換、およびその進捗管理を担当します。
 */
@route("/step")
namespace Step {
  /**
   * STEPファイルのSHA256ハッシュを content_hash として渡し、アップロード用のURLを取得します。
   * フロントエンドはこのURLに対して実際のファイルをアップロードします。
   */
  @route("/{content_hash}/upload")
  @post
  op upload_url(@path content_hash: string): string;

  /**
   * 指定した content_hash のファイルの変換処理（STEP -> BREP）を開始し、進捗をストリーミングします。
   * フロントエンドは各ファイルにつき1回このAPIを呼び出します。
   *
   * 進捗データは `{0以上の数値} {メッセージ}` の形式で送信されます。
   * - 100: 正常終了
   * - 101以上: 異常終了（STEPファイルとして認識不能、ハッシュ不一致、タイムアウト、ファイル過大など）
   */
  @route("/{content_hash}/execute")
  @post
  op execute(@path content_hash: string): {
    @header contentType: "text/event-stream";
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
