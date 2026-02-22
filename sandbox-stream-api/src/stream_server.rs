use std::convert::Infallible;
use std::time::Duration;

use axum::response::sse::Event;
use axum::response::{IntoResponse, Sse};
use tokio_stream::StreamExt;
use tokio_stream::wrappers::IntervalStream;

use crate::openapi::{ApiInterface, GetTimeRequest, GetTimeResponse};

pub struct Server;

impl Server {
    pub fn new() -> Self {
        Server
    }
}

impl ApiInterface for Server {
    async fn get_time(&self, _req: GetTimeRequest) -> GetTimeResponse {
        let stream = IntervalStream::new(tokio::time::interval(Duration::from_secs(1))).map(|_| {
            let now = chrono::Utc::now().to_rfc3339();
            Ok::<Event, Infallible>(Event::default().data(now))
        });

        GetTimeResponse::Raw(
            Sse::new(stream)
                .keep_alive(axum::response::sse::KeepAlive::default())
                .into_response(),
        )
    }
}
