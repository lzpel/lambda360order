mod openapi;
mod server;

use std::sync::Arc;
use crate::openapi::{axum_router, print_axum_router};
use crate::server::Server;

#[tokio::main]
async fn main() {
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT should be integer");

    print_axum_router(port);

    let api = Server {};
    let app = axum_router(api).layer(axum::extract::DefaultBodyLimit::disable());

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
