













































// このファイルはmandolin https://github.com/lzpel/mandolin によりOpenAPI仕様から自動生成されました

/* このサーバをビルドするためのCargo.toml

[dependencies]
serde= { version="*", features = ["derive"] }
serde_json= "*"
axum = { version = "*", features = ["multipart"] }
tokio = { version = "*", features = ["rt", "rt-multi-thread", "macros", "signal"] }
# optional
uuid = { version = "*", features = ["serde"] }
chrono = { version = "*", features = ["serde"] }
*/

use std::collections::HashMap;
use serde;
use std::future::Future;

/// APIインターフェーストレイト
/// 各オペレーションに対応するメソッドを実装することでサーバロジックを定義する
pub trait ApiInterface{
	/// 認証処理: リクエストからAuthContextを生成する
	fn authorize(&self, _req: axum::http::Request<axum::body::Body>) -> impl Future<Output = Result<AuthContext, String>> + Send{async { Ok(Default::default()) } }
	// GET /hello
	fn hello_say_hello(&self, _req: HelloSayHelloRequest) -> impl Future<Output = HelloSayHelloResponse> + Send{async{Default::default()}}
	// GET /step/{sha256}
	fn step_exists(&self, _req: StepExistsRequest) -> impl Future<Output = StepExistsResponse> + Send{async{Default::default()}}
	// GET /view
	fn viewer_view(&self, _req: ViewerViewRequest) -> impl Future<Output = ViewerViewResponse> + Send{async{Default::default()}}
}


/// 認証コンテキスト: 認証情報を保持する構造体
#[derive(Default,Clone,Debug,serde::Serialize,serde::Deserialize)]
pub struct AuthContext{
    pub subject: String,   // ユーザー識別子 (例: "auth0|123", "google-oauth2|456")
    pub subject_id: u128,  // UUID互換の数値ID
    pub scopes: Vec<String>, // スコープ (例: "read:foo", "write:bar")
}


// hello_say_helloのリクエスト型
#[derive(Debug)]
pub struct HelloSayHelloRequest{
	pub request: axum::http::Request<axum::body::Body>,
}
impl AsRef<axum::http::Request<axum::body::Body>> for HelloSayHelloRequest{
	fn as_ref(&self) -> &axum::http::Request<axum::body::Body>{&self.request}
}
// hello_say_helloのレスポンス型
#[derive(Debug)]
pub enum HelloSayHelloResponse{
	Status200(String),
	Raw(axum::response::Response),// カスタムレスポンス用バリアント
}
impl Default for HelloSayHelloResponse{
	fn default() -> Self{
		Self::Status200(Default::default())
	}
}
// step_existsのリクエスト型
#[derive(Debug)]
pub struct StepExistsRequest{
	pub sha256:String,
	pub request: axum::http::Request<axum::body::Body>,
}
impl AsRef<axum::http::Request<axum::body::Body>> for StepExistsRequest{
	fn as_ref(&self) -> &axum::http::Request<axum::body::Body>{&self.request}
}
// step_existsのレスポンス型
#[derive(Debug)]
pub enum StepExistsResponse{
	Status200(PathsStepSha256GetResponses200ContentApplicationJsonSchema),
	Raw(axum::response::Response),// カスタムレスポンス用バリアント
}
impl Default for StepExistsResponse{
	fn default() -> Self{
		Self::Status200(Default::default())
	}
}
// viewer_viewのリクエスト型
#[derive(Debug)]
pub struct ViewerViewRequest{
	pub sha256:String,
	pub request: axum::http::Request<axum::body::Body>,
}
impl AsRef<axum::http::Request<axum::body::Body>> for ViewerViewRequest{
	fn as_ref(&self) -> &axum::http::Request<axum::body::Body>{&self.request}
}
// viewer_viewのレスポンス型
#[derive(Debug)]
pub enum ViewerViewResponse{
	Status200(Vec<u8>),
	Raw(axum::response::Response),// カスタムレスポンス用バリアント
}
impl Default for ViewerViewResponse{
	fn default() -> Self{
		Self::Status200(Default::default())
	}
}



#[derive(Default,Clone,Debug,serde::Serialize,serde::Deserialize)]
pub struct PathsStepSha256GetResponses200ContentApplicationJsonSchema{
	pub r#exists:bool,
	pub r#expiresAt:Option<chrono::DateTime<chrono::Utc>>,
	pub r#uploadUrl:Option<String>,
}

use axum;
use axum::extract::FromRequest;

/// テキストレスポンスを生成するヘルパー関数
fn text_response(code: axum::http::StatusCode, body: String)->axum::response::Response{
	axum::response::Response::builder()
		.status(code)
		.header(axum::http::header::CONTENT_TYPE, "text/plain")
		.body(axum::body::Body::from(body))
		.unwrap()
}

/// 全オペレーションのルートハンドラを登録したaxum::Routerを返す
pub fn axum_router_operations<S: ApiInterface + Sync + Send + 'static>(instance :std::sync::Arc<S>)->axum::Router{
	let router = axum::Router::new();
	let i = instance.clone();
	let router = router.route("/hello", axum::routing::get(|
			path: axum::extract::Path<HashMap<String,String>>,
			query: axum::extract::Query<HashMap<String,String>>,
			header: axum::http::HeaderMap,
			request: axum::http::Request<axum::body::Body>,
		| async move{
			let (parts, body) = request.into_parts();
			let ret=S::hello_say_hello(i.as_ref(), HelloSayHelloRequest{
				request: axum::http::Request::from_parts(parts.clone(), Default::default()),
			}).await;
			match ret{
				HelloSayHelloResponse::Status200(v)=> axum::response::Response::builder().status(axum::http::StatusCode::from_u16(200).unwrap()).header(axum::http::header::CONTENT_TYPE, "text/plain").body(axum::body::Body::from(v)).unwrap(),
				HelloSayHelloResponse::Raw(v)=>v,
			}
		}));
	let i = instance.clone();
	let router = router.route("/step/{sha256}", axum::routing::get(|
			path: axum::extract::Path<HashMap<String,String>>,
			query: axum::extract::Query<HashMap<String,String>>,
			header: axum::http::HeaderMap,
			request: axum::http::Request<axum::body::Body>,
		| async move{
			let (parts, body) = request.into_parts();
			let ret=S::step_exists(i.as_ref(), StepExistsRequest{
				r#sha256:{let v=path.get("sha256").and_then(|v| v.parse().ok());match v {Some(v)=>v, None=>return text_response(axum::http::StatusCode::from_u16(400).unwrap(), format!("parse error: sha256 in path={:?}", path))}},
				request: axum::http::Request::from_parts(parts.clone(), Default::default()),
			}).await;
			match ret{
				StepExistsResponse::Status200(v)=> axum::response::Response::builder().status(axum::http::StatusCode::from_u16(200).unwrap()).header(axum::http::header::CONTENT_TYPE, "application/json").body(axum::body::Body::from(serde_json::to_vec_pretty(&v).expect("error serialize response json"))).unwrap(),
				StepExistsResponse::Raw(v)=>v,
			}
		}));
	let i = instance.clone();
	let router = router.route("/view", axum::routing::get(|
			path: axum::extract::Path<HashMap<String,String>>,
			query: axum::extract::Query<HashMap<String,String>>,
			header: axum::http::HeaderMap,
			request: axum::http::Request<axum::body::Body>,
		| async move{
			let (parts, body) = request.into_parts();
			let ret=S::viewer_view(i.as_ref(), ViewerViewRequest{
				r#sha256:{let v=query.get("sha256").and_then(|v| v.parse().ok());match v {Some(v)=>v, None=>return text_response(axum::http::StatusCode::from_u16(400).unwrap(), format!("parse error: sha256 in query={:?}", query))}},
				request: axum::http::Request::from_parts(parts.clone(), Default::default()),
			}).await;
			match ret{
				ViewerViewResponse::Status200(v)=> axum::response::Response::builder().status(axum::http::StatusCode::from_u16(200).unwrap()).header(axum::http::header::CONTENT_TYPE, "model/gltf-binary").body(axum::body::Body::from(v)).unwrap(),
				ViewerViewResponse::Raw(v)=>v,
			}
		}));
	let router = router.route("/openapi.json", axum::routing::get(|| async move{
			r###"{"components":{"schemas":{"FileExists":{"properties":{"exists":{"type":"boolean"},"expiresAt":{"format":"date-time","type":"string"},"uploadUrl":{"type":"string"}},"required":["exists"],"type":"object"}}},"info":{"title":"Lambda360 API","version":"0.0.0"},"openapi":"3.0.0","paths":{"/hello":{"get":{"operationId":"Hello_sayHello","responses":{"200":{"content":{"text/plain":{"schema":{"type":"string"}}},"description":"The request has succeeded."}}}},"/step/{sha256}":{"get":{"operationId":"Step_exists","parameters":[{"in":"path","name":"sha256","required":true,"schema":{"type":"string"},"style":"simple"}],"responses":{"200":{"content":{"application/json":{"schema":{"properties":{"exists":{"type":"boolean"},"expiresAt":{"format":"date-time","type":"string"},"uploadUrl":{"type":"string"}},"required":["exists"],"type":"object"}}},"description":"The request has succeeded."}}}},"/view":{"get":{"operationId":"Viewer_view","parameters":[{"explode":false,"in":"query","name":"sha256","required":true,"schema":{"type":"string"},"style":"form"}],"responses":{"200":{"content":{"model/gltf-binary":{"schema":{"format":"binary","type":"string"}}},"description":"The request has succeeded."}}}}},"servers":[{"description":"Main server","url":"/api","variables":{}}]}"###
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

/// サーバのURLプレフィックスにnest_serviceでルーターをマウントする
pub fn axum_router<S: ApiInterface + Sync + Send + 'static>(instance: S)->axum::Router{
	let instance_arc=std::sync::Arc::new(instance);
	let mut router = axum::Router::new();
	router = router.nest_service("/api", axum_router_operations(instance_arc.clone()));
	router
}

/// サーバのURL一覧を標準出力に表示する
pub fn print_axum_router(port:u16){
	println!("http://localhost:{}/api/ui", port);
}

/// テスト用のサーバ実装（全メソッドがデフォルト値を返す）
pub struct TestServer{}
impl ApiInterface for TestServer{
	// 必要なメソッドをここに実装する
	// GET /hello
	// async fn hello_say_hello(&self, _req: HelloSayHelloRequest) -> HelloSayHelloResponse{Default::default()}
	// GET /step/{sha256}
	// async fn step_exists(&self, _req: StepExistsRequest) -> StepExistsResponse{Default::default()}
	// GET /view
	// async fn viewer_view(&self, _req: ViewerViewRequest) -> ViewerViewResponse{Default::default()}
}

/// HTTPリクエストからオリジンURL(scheme://host)を推定する
/// Forwarded > X-Forwarded-* > Host の優先順位で判定する
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

	// 0) URIのauthority部分を確認（絶対URIが渡された場合）
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

	// 3) Hostヘッダにフォールバック
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
	let port:u16 = std::env::var("PORT").unwrap_or("8080".to_string()).parse().expect("PORT should be integer");
	print_axum_router(port);
	let api = TestServer{};
	let app = axum_router(api).layer(axum::extract::DefaultBodyLimit::disable());
	let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await.unwrap();
	axum::serve(listener, app)
		.with_graceful_shutdown(async { tokio::signal::ctrl_c().await.unwrap() })
		.await
		.unwrap();
}