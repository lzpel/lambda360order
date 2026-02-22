// This file was automatically generated from OpenAPI specification by mandolin https://github.com/lzpel/mandolin

/* Cargo.toml to build this server

[dependencies]
serde= { version="*", features = ["derive"] }
serde_json= "*"
axum = { version = "*", features = ["multipart"] }
tokio = { version = "*", features = ["rt", "rt-multi-thread", "macros", "signal"] }
# optional
uuid = { version = "*", features = ["serde"] }
chrono = { version = "*", features = ["serde"] }
*/

use serde;
use std::collections::HashMap;
use std::future::Future;

/// API Interface Trait
/// Define server logic by implementing methods corresponding to each operation
pub trait ApiInterface {
	/// Authentication process: Generate AuthContext from request
	fn authorize(
		&self,
		_req: axum::http::Request<axum::body::Body>,
	) -> impl Future<Output = Result<AuthContext, String>> + Send {
		async { Ok(Default::default()) }
	}
	// GET /version
	fn version(
		&self,
		_req: VersionRequest,
	) -> impl Future<Output = VersionResponse> + Send {
		async { Default::default() }
	}
	// POST /shape
	fn shape_compute(
		&self,
		_req: ShapeComputeRequest,
	) -> impl Future<Output = ShapeComputeResponse> + Send {
		async { Default::default() }
	}
	// POST /step/{content_hash}/execute
	fn step_execute(
		&self,
		_req: StepExecuteRequest,
	) -> impl Future<Output = StepExecuteResponse> + Send {
		async { Default::default() }
	}
	// POST /step/{content_hash}/upload
	fn step_upload_url(
		&self,
		_req: StepUploadUrlRequest,
	) -> impl Future<Output = StepUploadUrlResponse> + Send {
		async { Default::default() }
	}
}

/// Auth Context: Struct to hold authentication information
#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct AuthContext {
	pub subject: String,  // User identifier (e.g., "auth0|123", "google-oauth2|456")
	pub subject_id: u128, // UUID compatible numeric ID
	pub scopes: Vec<String>, // Scopes (e.g., "read:foo", "write:bar")
}

// Request type for version
#[derive(Debug)]
pub struct VersionRequest {
	pub request: axum::http::Request<axum::body::Body>,
}
// Response type for version
#[derive(Debug)]
pub enum VersionResponse {
	Status200(String),
	Raw(axum::response::Response),
}
impl Default for VersionResponse {
	fn default() -> Self {
		Self::Status200(Default::default())
	}
}

// Request type for shape_compute
#[derive(Debug)]
pub struct ShapeComputeRequest {
	pub body: Box<ShapeNode>,
	pub request: axum::http::Request<axum::body::Body>,
}
impl AsRef<axum::http::Request<axum::body::Body>> for ShapeComputeRequest {
	fn as_ref(&self) -> &axum::http::Request<axum::body::Body> {
		&self.request
	}
}
// Response type for shape_compute
#[derive(Debug)]
pub enum ShapeComputeResponse {
	Status200(Vec<u8>),
	Raw(axum::response::Response), // Variant for custom responses
}
impl Default for ShapeComputeResponse {
	fn default() -> Self {
		Self::Status200(Default::default())
	}
}
// Request type for step_execute
#[derive(Debug)]
pub struct StepExecuteRequest {
	pub content_hash: String,
	pub request: axum::http::Request<axum::body::Body>,
}
impl AsRef<axum::http::Request<axum::body::Body>> for StepExecuteRequest {
	fn as_ref(&self) -> &axum::http::Request<axum::body::Body> {
		&self.request
	}
}
// Response type for step_execute
#[derive(Debug)]
pub enum StepExecuteResponse {
	Status200(Vec<u8>),
	Raw(axum::response::Response), // Variant for custom responses
}
impl Default for StepExecuteResponse {
	fn default() -> Self {
		Self::Status200(Default::default())
	}
}
// Request type for step_upload_url
#[derive(Debug)]
pub struct StepUploadUrlRequest {
	pub content_hash: String,
	pub request: axum::http::Request<axum::body::Body>,
}
impl AsRef<axum::http::Request<axum::body::Body>> for StepUploadUrlRequest {
	fn as_ref(&self) -> &axum::http::Request<axum::body::Body> {
		&self.request
	}
}
// Response type for step_upload_url
#[derive(Debug)]
pub enum StepUploadUrlResponse {
	Status200(String),
	Raw(axum::response::Response), // Variant for custom responses
}
impl Default for StepUploadUrlResponse {
	fn default() -> Self {
		Self::Status200(Default::default())
	}
}

#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct IntersectNode {
	pub r#a: Box<ShapeNode>,
	pub r#b: Box<ShapeNode>,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
#[serde(untagged)]
pub enum NumberOrExpr {
	Variant0(f64),
	Variant1(String),
}
impl Default for NumberOrExpr {
	fn default() -> Self {
		Self::Variant0(Default::default())
	}
}

#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct RotateNode {
	pub r#axis: Vec<NumberOrExpr>,
	pub r#deg: NumberOrExpr,
	pub r#shape: Box<ShapeNode>,
}

#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct ScaleNode {
	pub r#factor: NumberOrExpr,
	pub r#shape: Box<ShapeNode>,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
#[serde(tag = "op")]
pub enum ShapeNode {
	#[serde(rename = "step")]
	Step(StepNode),
	#[serde(rename = "union")]
	Union(UnionShapeNode),
	#[serde(rename = "intersect")]
	Intersect(IntersectNode),
	#[serde(rename = "subtract")]
	Subtract(SubtractNode),
	#[serde(rename = "scale")]
	Scale(ScaleNode),
	#[serde(rename = "translate")]
	Translate(TranslateNode),
	#[serde(rename = "rotate")]
	Rotate(RotateNode),
	#[serde(rename = "stretch")]
	Stretch(StretchNode),
}
impl Default for ShapeNode {
	fn default() -> Self {
		Self::Step(Default::default())
	}
}

#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct ShapeNodeBase {
	pub r#op: String,
}

#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct StepNode {
	pub r#content_hash: Option<String>,
	pub r#path: String,
}

#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct StretchNode {
	pub r#cut: Vec<NumberOrExpr>,
	pub r#delta: Vec<NumberOrExpr>,
	pub r#shape: Box<ShapeNode>,
}

#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct SubtractNode {
	pub r#a: Box<ShapeNode>,
	pub r#b: Box<ShapeNode>,
}

#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct TranslateNode {
	pub r#shape: Box<ShapeNode>,
	pub r#xyz: Vec<NumberOrExpr>,
}

#[derive(Default, Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct UnionShapeNode {
	pub r#a: Box<ShapeNode>,
	pub r#b: Box<ShapeNode>,
}

use axum;
use axum::extract::FromRequest;

/// Helper function to generate text responses
fn text_response(code: axum::http::StatusCode, body: String) -> axum::response::Response {
	axum::response::Response::builder()
		.status(code)
		.header(axum::http::header::CONTENT_TYPE, "text/plain")
		.body(axum::body::Body::from(body))
		.unwrap()
}

/// Returns axum::Router with root handlers for all operations registered
pub fn axum_router_operations<S: ApiInterface + Sync + Send + 'static>(
	instance: std::sync::Arc<S>,
) -> axum::Router {
	let router = axum::Router::new();
	let i = instance.clone();
	let router = router.route(
		"/version",
		axum::routing::get(
			|request: axum::http::Request<axum::body::Body>| async move {
				let ret = S::version(
					i.as_ref(),
					VersionRequest {
						request: axum::http::Request::from_parts(
							request.into_parts().0,
							Default::default(),
						),
					},
				)
				.await;
				match ret {
					VersionResponse::Status200(v) => axum::response::Response::builder()
						.status(axum::http::StatusCode::from_u16(200).unwrap())
						.header(axum::http::header::CONTENT_TYPE, "text/plain")
						.body(axum::body::Body::from(v))
						.unwrap(),
					VersionResponse::Raw(v) => v,
				}
			},
		),
	);
	let i = instance.clone();
	let router = router.route(
		"/shape",
		axum::routing::post(
			|path: axum::extract::Path<HashMap<String, String>>,
			 query: axum::extract::Query<HashMap<String, String>>,
			 header: axum::http::HeaderMap,
			 request: axum::http::Request<axum::body::Body>| async move {
				let (parts, body) = request.into_parts();
				let ret = S::shape_compute(
					i.as_ref(),
					ShapeComputeRequest {
						body: match axum::body::to_bytes(body, usize::MAX)
							.await
							.map_err(|v| format!("{v:?}"))
							.and_then(|v| serde_json::from_slice(&v).map_err(|v| v.to_string()))
						{
							Ok(v) => v,
							Err(v) => return text_response(axum::http::StatusCode::BAD_REQUEST, v),
						},
						request: axum::http::Request::from_parts(parts.clone(), Default::default()),
					},
				)
				.await;
				match ret {
					ShapeComputeResponse::Status200(v) => axum::response::Response::builder()
						.status(axum::http::StatusCode::from_u16(200).unwrap())
						.header(axum::http::header::CONTENT_TYPE, "model/gltf-binary")
						.body(axum::body::Body::from(v))
						.unwrap(),
					ShapeComputeResponse::Raw(v) => v,
				}
			},
		),
	);
	let i = instance.clone();
	let router = router.route(
		"/step/{content_hash}/execute",
		axum::routing::post(
			|path: axum::extract::Path<HashMap<String, String>>,
			 query: axum::extract::Query<HashMap<String, String>>,
			 header: axum::http::HeaderMap,
			 request: axum::http::Request<axum::body::Body>| async move {
				let (parts, body) = request.into_parts();
				let ret = S::step_execute(
					i.as_ref(),
					StepExecuteRequest {
						r#content_hash: {
							let v = path.get("content_hash").and_then(|v| v.parse().ok());
							match v {
								Some(v) => v,
								None => {
									return text_response(
										axum::http::StatusCode::from_u16(400).unwrap(),
										format!("parse error: content_hash in path={:?}", path),
									);
								}
							}
						},
						request: axum::http::Request::from_parts(parts.clone(), Default::default()),
					},
				)
				.await;
				match ret {
					StepExecuteResponse::Status200(v) => axum::response::Response::builder()
						.status(axum::http::StatusCode::from_u16(200).unwrap())
						.header(axum::http::header::CONTENT_TYPE, "text/event-stream")
						.body(axum::body::Body::from(v))
						.unwrap(),
					StepExecuteResponse::Raw(v) => v,
				}
			},
		),
	);
	let i = instance.clone();
	let router = router.route(
		"/step/{content_hash}/upload",
		axum::routing::post(
			|path: axum::extract::Path<HashMap<String, String>>,
			 query: axum::extract::Query<HashMap<String, String>>,
			 header: axum::http::HeaderMap,
			 request: axum::http::Request<axum::body::Body>| async move {
				let (parts, body) = request.into_parts();
				let ret = S::step_upload_url(
					i.as_ref(),
					StepUploadUrlRequest {
						r#content_hash: {
							let v = path.get("content_hash").and_then(|v| v.parse().ok());
							match v {
								Some(v) => v,
								None => {
									return text_response(
										axum::http::StatusCode::from_u16(400).unwrap(),
										format!("parse error: content_hash in path={:?}", path),
									);
								}
							}
						},
						request: axum::http::Request::from_parts(parts.clone(), Default::default()),
					},
				)
				.await;
				match ret {
					StepUploadUrlResponse::Status200(v) => axum::response::Response::builder()
						.status(axum::http::StatusCode::from_u16(200).unwrap())
						.header(axum::http::header::CONTENT_TYPE, "text/plain")
						.body(axum::body::Body::from(v))
						.unwrap(),
					StepUploadUrlResponse::Raw(v) => v,
				}
			},
		),
	);
	let router = router.route("/openapi.json", axum::routing::get(|| async move{
			r###"{"components":{"schemas":{"IntersectNode":{"allOf":[{"$ref":"#/components/schemas/ShapeNodeBase"}],"description":"ブーリアン共通部分 (BRepAlgoAPI_Common)","properties":{"a":{"$ref":"#/components/schemas/ShapeNode"},"b":{"$ref":"#/components/schemas/ShapeNode"},"op":{"enum":["intersect"],"type":"string"}},"required":["op","a","b"],"type":"object"},"NumberOrExpr":{"anyOf":[{"format":"double","type":"number"},{"type":"string"}],"description":"数値定数または $式 (例: 100.0, \"$width\", \"$width * 0.5 + 50\")"},"RotateNode":{"allOf":[{"$ref":"#/components/schemas/ShapeNodeBase"}],"description":"回転","properties":{"axis":{"description":"回転軸ベクトル [ax, ay, az]","items":{"$ref":"#/components/schemas/NumberOrExpr"},"type":"array"},"deg":{"allOf":[{"$ref":"#/components/schemas/NumberOrExpr"}],"description":"回転角度 (度)"},"op":{"enum":["rotate"],"type":"string"},"shape":{"$ref":"#/components/schemas/ShapeNode"}},"required":["op","shape","axis","deg"],"type":"object"},"ScaleNode":{"allOf":[{"$ref":"#/components/schemas/ShapeNodeBase"}],"description":"一様拡大縮小","properties":{"factor":{"$ref":"#/components/schemas/NumberOrExpr"},"op":{"enum":["scale"],"type":"string"},"shape":{"$ref":"#/components/schemas/ShapeNode"}},"required":["op","shape","factor"],"type":"object"},"ShapeNode":{"anyOf":[{"$ref":"#/components/schemas/StepNode"},{"$ref":"#/components/schemas/UnionShapeNode"},{"$ref":"#/components/schemas/IntersectNode"},{"$ref":"#/components/schemas/SubtractNode"},{"$ref":"#/components/schemas/ScaleNode"},{"$ref":"#/components/schemas/TranslateNode"},{"$ref":"#/components/schemas/RotateNode"},{"$ref":"#/components/schemas/StretchNode"}],"description":"★ここが主役：discriminated union を “ShapeNode” として定義\nこれが OpenAPI で oneOf + discriminator になりやすい"},"ShapeNodeBase":{"description":"形状演算ノードの共通フィールド（任意）\n※これは OpenAPI の oneOf 生成のために必須ではないが、共通項を置きたい場合に便利","properties":{"op":{"type":"string"}},"required":["op"],"type":"object"},"StepNode":{"allOf":[{"$ref":"#/components/schemas/ShapeNodeBase"}],"description":"STEPファイルの読み込み","properties":{"content_hash":{"description":"キャッシュ無効化用コンテンツハッシュ \"sha256:\u003chex64\u003e\"","type":"string"},"op":{"enum":["step"],"type":"string"},"path":{"description":"STEPファイルのパス (S3キー等)","type":"string"}},"required":["op","path"],"type":"object"},"StretchNode":{"allOf":[{"$ref":"#/components/schemas/ShapeNodeBase"}],"description":"伸縮: 切断面で形状を分割して指定方向に伸ばす","properties":{"cut":{"description":"切断面の座標 [cx, cy, cz] (mm)","items":{"$ref":"#/components/schemas/NumberOrExpr"},"type":"array"},"delta":{"description":"各軸方向の伸縮量 [dx, dy, dz] (mm)","items":{"$ref":"#/components/schemas/NumberOrExpr"},"type":"array"},"op":{"enum":["stretch"],"type":"string"},"shape":{"$ref":"#/components/schemas/ShapeNode"}},"required":["op","shape","cut","delta"],"type":"object"},"SubtractNode":{"allOf":[{"$ref":"#/components/schemas/ShapeNodeBase"}],"description":"ブーリアン差演算: a から b をくり抜く (BRepAlgoAPI_Cut)","properties":{"a":{"$ref":"#/components/schemas/ShapeNode"},"b":{"$ref":"#/components/schemas/ShapeNode"},"op":{"enum":["subtract"],"type":"string"}},"required":["op","a","b"],"type":"object"},"TranslateNode":{"allOf":[{"$ref":"#/components/schemas/ShapeNodeBase"}],"description":"平行移動","properties":{"op":{"enum":["translate"],"type":"string"},"shape":{"$ref":"#/components/schemas/ShapeNode"},"xyz":{"description":"移動量 [x, y, z] (mm)","items":{"$ref":"#/components/schemas/NumberOrExpr"},"type":"array"}},"required":["op","shape","xyz"],"type":"object"},"UnionShapeNode":{"allOf":[{"$ref":"#/components/schemas/ShapeNodeBase"}],"description":"ブーリアン合体 (BRepAlgoAPI_Fuse)","properties":{"a":{"$ref":"#/components/schemas/ShapeNode"},"b":{"$ref":"#/components/schemas/ShapeNode"},"op":{"enum":["union"],"type":"string"}},"required":["op","a","b"],"type":"object"}}},"info":{"title":"Lambda360 API","version":"0.0.0"},"openapi":"3.0.0","paths":{"/shape":{"post":{"description":"ShapeNode を受け取り、演算結果を GLB (GLTF Binary) として返す","operationId":"Shape_compute","requestBody":{"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ShapeNode"}}},"required":true},"responses":{"200":{"content":{"model/gltf-binary":{"schema":{"format":"binary","type":"string"}}},"description":"The request has succeeded."}}}},"/step/{content_hash}/execute":{"post":{"description":"指定した content_hash のファイルの変換処理（STEP -\u003e BREP）を開始し、進捗をストリーミングします。\nフロントエンドは各ファイルにつき1回このAPIを呼び出します。\n\n進捗データは `{0以上の数値} {メッセージ}` の形式で送信されます。\n- 100: 正常終了\n- 101以上: 異常終了（STEPファイルとして認識不能、ハッシュ不一致、タイムアウト、ファイル過大など）","operationId":"Step_execute","parameters":[{"in":"path","name":"content_hash","required":true,"schema":{"type":"string"},"style":"simple"}],"responses":{"200":{"content":{"text/event-stream":{"schema":{"format":"binary","type":"string"}}},"description":"The request has succeeded."}}}},"/step/{content_hash}/upload":{"post":{"description":"STEPファイルのSHA256ハッシュを content_hash として渡し、アップロード用のURLを取得します。\nフロントエンドはこのURLに対して実際のファイルをアップロードします。","operationId":"Step_upload_url","parameters":[{"in":"path","name":"content_hash","required":true,"schema":{"type":"string"},"style":"simple"}],"responses":{"200":{"content":{"text/plain":{"schema":{"type":"string"}}},"description":"The request has succeeded."}}}}},"servers":[{"description":"Main server","url":"/api","variables":{}}]}"###
		}))
		.route("/ui", axum::routing::get(|| async move{
			axum::response::Html(r###"
			<html lang="en">
			<head>
			  <meta charset="utf-8" />
			  <meta name="viewport" content="width=device-width, initial-scale=1" />
			  <meta name="description" content="SwaggerUI" />
			  <title>SwaggerUI</title>
			  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
			</head>
			<body>
			<div id="swagger-ui"></div>
			<script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
			<script>
			  window.onload = () => {
				window.ui = SwaggerUIBundle({
				  url: location.href.replace("/ui","/openapi.json"),
				  dom_id: '#swagger-ui',
				});
			  };
			</script>
			</body>
			</html>
			"###)
		}));
	return router;
}

/// Mount the router to the server's URL prefix with nest_service
pub fn axum_router<S: ApiInterface + Sync + Send + 'static>(instance: S) -> axum::Router {
	let instance_arc = std::sync::Arc::new(instance);
	let mut router = axum::Router::new();
	router = router.nest_service("/api", axum_router_operations(instance_arc.clone()));
	router
}

/// Display the server URL list to standard output
pub fn print_axum_router(port: u16) {
	println!("http://localhost:{}/api/ui", port);
}

/// Test server implementation (all methods return default values)
pub struct TestServer {}
impl ApiInterface for TestServer {
	// Implement required methods here
	// POST /shape
	// async fn shape_compute(&self, _req: ShapeComputeRequest) -> ShapeComputeResponse{Default::default()}
	// POST /step/{content_hash}/execute
	// async fn step_execute(&self, _req: StepExecuteRequest) -> StepExecuteResponse{Default::default()}
	// POST /step/{content_hash}/upload
	// async fn step_upload_url(&self, _req: StepUploadUrlRequest) -> StepUploadUrlResponse{Default::default()}
}

/// Estimates the origin URL (scheme://host) from an HTTP request
/// Priority: Forwarded > X-Forwarded-* > Host
pub fn origin_from_request<B>(req: &axum::http::Request<B>) -> Option<String> {
	fn first_csv(s: &str) -> &str {
		s.split(',').next().unwrap_or(s).trim()
	}
	fn unquote(s: &str) -> &str {
		let s = s.trim();
		if s.starts_with('"') && s.ends_with('"') && s.len() >= 2 {
			&s[1..s.len() - 1]
		} else {
			s
		}
	}
	fn guess_scheme(host: &str) -> &'static str {
		let hostname = host
			.trim_start_matches('[')
			.split(']')
			.next()
			.unwrap_or(host)
			.split(':')
			.next()
			.unwrap_or(host);
		match hostname {
			"localhost" | "127.0.0.1" | "::1" => "http",
			_ => "https",
		}
	}
	fn mk_origin(proto: Option<String>, host: String) -> String {
		let proto = proto.unwrap_or_else(|| guess_scheme(&host).to_string());
		format!("{proto}://{host}")
	}

	let headers = req.headers();

	// 0) Check URI authority (for absolute URIs)
	if let Some(auth) = req.uri().authority() {
		let host = auth.as_str().to_string();
		return Some(mk_origin(None, host));
	}

	// 1) Forwarded (RFC 7239)
	if let Some(raw) = headers
		.get(axum::http::header::FORWARDED)
		.and_then(|v| v.to_str().ok())
	{
		let first = first_csv(raw);
		let mut proto: Option<String> = None;
		let mut host: Option<String> = None;

		for part in first.split(';') {
			let mut it = part.trim().splitn(2, '=');
			let k = it.next().unwrap_or("").trim().to_ascii_lowercase();
			let v = unquote(it.next().unwrap_or(""));

			match k.as_str() {
				"proto" if !v.is_empty() => proto = Some(v.to_ascii_lowercase()),
				"host" if !v.is_empty() => host = Some(v.to_string()),
				_ => {}
			}
		}

		if let Some(host) = host {
			return Some(mk_origin(proto, host));
		}
	}

	// 2) X-Forwarded-*
	if let Some(mut host) = headers
		.get("x-forwarded-host")
		.and_then(|v| v.to_str().ok())
		.map(first_csv)
		.filter(|s| !s.is_empty())
		.map(str::to_string)
	{
		if !host.contains(':') {
			if let Some(port) = headers
				.get("x-forwarded-port")
				.and_then(|v| v.to_str().ok())
				.map(str::trim)
				.filter(|s| !s.is_empty())
			{
				host = format!("{host}:{port}");
			}
		}

		let proto = headers
			.get("x-forwarded-proto")
			.and_then(|v| v.to_str().ok())
			.map(first_csv)
			.map(|s| s.to_ascii_lowercase())
			.filter(|s| !s.is_empty());

		return Some(mk_origin(proto, host));
	}

	// 3) Fallback to Host header
	let host = headers
		.get(axum::http::header::HOST)
		.and_then(|h| h.to_str().ok())
		.map(str::trim)
		.filter(|s| !s.is_empty())?
		.to_string();

	Some(format!("{}://{}", guess_scheme(&host), host))
}

#[tokio::main]
async fn main() {
	let port: u16 = std::env::var("PORT")
		.unwrap_or("8080".to_string())
		.parse()
		.expect("PORT should be integer");
	print_axum_router(port);
	let api = TestServer {};
	let app = axum_router(api).layer(axum::extract::DefaultBodyLimit::disable());
	let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}"))
		.await
		.unwrap();
	axum::serve(listener, app)
		.with_graceful_shutdown(async { tokio::signal::ctrl_c().await.unwrap() })
		.await
		.unwrap();
}
