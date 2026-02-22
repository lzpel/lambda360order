import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

@service(#{
  title: "Lambda360 API",
})
@server("/api", "Main server")
namespace Lambda360;


// ---------------------------------------------------------------------------
// レスポンステンプレート
// ---------------------------------------------------------------------------

model Response<code extends numeric> {
	@statusCode statusCode: code;
}
model ResponseWithBody<code extends numeric, Body> extends Response<code> {
	@body body: Body;
}
model TextResponse is ResponseWithBody<200, string>;
model NoContentResponse is Response<204>;
model BadRequestResponse is ResponseWithBody<400, string>;
model ForbiddenResponse is Response<403>;
model NotFoundResponse is Response<404>;
model ErrorResponse is ResponseWithBody<500, string>;

// ---------------------------------------------------------------------------
// Step API で使うボディ型
// ---------------------------------------------------------------------------

model StepStatusBody {
  timestamp: int64;
  progress: int32;
  message: string;
}

/**
 * このAPIサーバーのバージョンと使用しているS3バケット名を返します。
 */
@route("/version")
@get
op version(): TextResponse;

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
  op upload_url(@path content_hash: string): TextResponse;

  /**
   * 指定した content_hash のファイルの変換処理（STEP -> BREP）を実行します。
   * ダウンロード・変換・アップロードがすべて完了したときに 200 を返します。
   * 失敗した場合は 500 とエラーメッセージを返します。
   * 進捗は処理中も /step/{content_hash}/status で確認できます。
   */
  @route("/{content_hash}/execute")
  @post
  op execute(@path content_hash: string): NoContentResponse | ErrorResponse;

  /**
   * 変換処理の最新進捗を返します。
   * - progress 100: 正常終了
   * - progress 101以上: 異常終了
   * 変換がまだ開始されていない場合は 404 を返します。
   */
  @route("/{content_hash}/status")
  @get
  op status(@path content_hash: string): StepStatusBody | NotFoundResponse;
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
