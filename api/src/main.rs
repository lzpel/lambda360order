mod content_hash;
#[allow(dead_code)]
#[allow(unused_variables)]
#[allow(unused_imports)]
#[allow(unused_variables)]
#[allow(non_snake_case)]
mod openapi;
mod server;
mod shape;
mod shape_stretch;
mod shape_to_glb;
mod step_to_brep;
use crate::openapi::{axum_router, print_axum_router};
use crate::server::Server;

#[tokio::main]
async fn main() {
	let port: u16 = std::env::var("PORT")
		.unwrap_or_else(|_| "8080".to_string())
		.parse()
		.expect("PORT should be integer");

	print_axum_router(port);

	let api = Server::new().await.unwrap();
	let app = axum_router(api)
		.layer(axum::extract::DefaultBodyLimit::disable())
		.fallback(frontend);
	let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
		.await
		.unwrap();

	println!("Listening on http://0.0.0.0:{}", port);

	axum::serve(listener, app)
		.with_graceful_shutdown(async {
			tokio::signal::ctrl_c().await.unwrap();
		})
		.await
		.unwrap();
}

#[cfg(not(feature = "frontend"))]
async fn frontend(_uri: axum::http::Uri) -> axum::response::Response<axum::body::Body> {
	return axum::response::Response::builder()
		.status(axum::http::status::StatusCode::NOT_FOUND)
		.body(axum::body::Body::from("not found"))
		.unwrap();
}
#[cfg(feature = "frontend")]
async fn frontend(uri: axum::http::Uri) -> axum::response::Response<axum::body::Body> {
	#[derive(rust_embed::Embed)]
	#[folder = "out"] // ← このフォルダ配下をバイナリに埋め込む
	struct Assets;
	// /foo/bar → "foo/bar"
	let mut path = std::path::PathBuf::from(uri.path().trim_start_matches("/"));
	// ディレクトリっぽいアクセスは index.html
	if path.file_name().is_none() {
		path.push("index.html");
	} else if path.extension().is_none() {
		path.set_extension("html");
	}
	// MIME type 推論
	let mime = mime_guess::from_path(&path)
		.first()
		.map(|m| m.essence_str().to_string())
		.unwrap_or_else(|| "application/octet-stream".into());
	// 埋め込み検索
	match Assets::get(&path.to_string_lossy().to_string()) {
		Some(file) => axum::response::Response::builder()
			.status(axum::http::StatusCode::OK)
			.header(axum::http::header::CONTENT_TYPE, mime)
			.body(axum::body::Body::from(file.data))
			.unwrap(),
		None => axum::response::Response::builder()
			.status(axum::http::status::StatusCode::NOT_FOUND)
			.body(axum::body::Body::from("not found in frontend"))
			.unwrap(),
	}
}
