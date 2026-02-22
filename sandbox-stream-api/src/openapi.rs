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
    // GET /time
    fn get_time(&self, _req: GetTimeRequest) -> impl Future<Output = GetTimeResponse> + Send {
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

// Request type for get_time
#[derive(Debug)]
pub struct GetTimeRequest {
    pub request: axum::http::Request<axum::body::Body>,
}
impl AsRef<axum::http::Request<axum::body::Body>> for GetTimeRequest {
    fn as_ref(&self) -> &axum::http::Request<axum::body::Body> {
        &self.request
    }
}
// Response type for get_time
#[derive(Debug)]
pub enum GetTimeResponse {
    Status200(String),
    Raw(axum::response::Response), // Variant for custom responses
}
impl Default for GetTimeResponse {
    fn default() -> Self {
        Self::Status200(Default::default())
    }
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
        "/time",
        axum::routing::get(
            |path: axum::extract::Path<HashMap<String, String>>,
             query: axum::extract::Query<HashMap<String, String>>,
             header: axum::http::HeaderMap,
             request: axum::http::Request<axum::body::Body>| async move {
                let (parts, body) = request.into_parts();
                let ret = S::get_time(
                    i.as_ref(),
                    GetTimeRequest {
                        request: axum::http::Request::from_parts(parts.clone(), Default::default()),
                    },
                )
                .await;
                match ret {
                    GetTimeResponse::Status200(v) => axum::response::Response::builder()
                        .status(axum::http::StatusCode::from_u16(200).unwrap())
                        .header(axum::http::header::CONTENT_TYPE, "text/event-stream")
                        .body(axum::body::Body::from(v))
                        .unwrap(),
                    GetTimeResponse::Raw(v) => v,
                }
            },
        ),
    );
    let router = router.route("/openapi.json", axum::routing::get(|| async move{
			r###"{"info":{"title":"Sandbox Stream API","version":"0.1.0"},"openapi":"3.0.0","paths":{"/time":{"get":{"operationId":"getTime","responses":{"200":{"content":{"text/event-stream":{"schema":{"type":"string"}}},"description":"SSE stream of current UTC time"}},"summary":"Stream current time via SSE (one event per second)"}}},"servers":[{"url":"/sandbox-stream-api"}]}"###
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
    router = router.nest_service(
        "/sandbox-stream-api",
        axum_router_operations(instance_arc.clone()),
    );
    router
}

/// Display the server URL list to standard output
pub fn print_axum_router(port: u16) {
    println!("http://localhost:{}/sandbox-stream-api/ui", port);
}

/// Test server implementation (all methods return default values)
pub struct TestServer {}
impl ApiInterface for TestServer {
    // Implement required methods here
    // GET /time
    // async fn get_time(&self, _req: GetTimeRequest) -> GetTimeResponse{Default::default()}
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
