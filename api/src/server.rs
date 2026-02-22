use crate::openapi::*;
use crate::shape::{cached_shape, collect_breps};
use ngoni;

pub struct Server {
	bucket_step: ngoni::s3::S3Storage,
	bucket_memo: ngoni::s3::S3Storage,
}

impl Server {
	pub async fn new() -> Result<Self, String> {
		Ok(Self {
			bucket_step: ngoni::s3::S3Storage::new(
				&std::env::var("BUCKET_STEP")
					.unwrap_or("lambda360order-stepadb8bd0b-xbdpochgzrd7".to_string()),
			)
			.await,
			bucket_memo: ngoni::s3::S3Storage::new(
				&std::env::var("BUCKET_MEMO")
					.unwrap_or("lambda360order-memo633eea8b-pmmqqwonfeqnl".to_string()),
			)
			.await,
		})
	}
}

impl ApiInterface for Server {
	async fn shape_compute(&self, req: ShapeComputeRequest) -> ShapeComputeResponse {
		let node = req.body;

		// StepNode.pathはフロントエンドがsha256に置換済み。
		// そのsha256をキーにbucket_memoからbrepを収集する。
		let breps = match collect_breps(&node, &self.bucket_memo).await {
			Ok(b) => b,
			Err(e) => {
				return ShapeComputeResponse::Raw(
					axum::response::Response::builder()
						.status(axum::http::StatusCode::UNPROCESSABLE_ENTITY)
						.body(axum::body::Body::from(e))
						.unwrap(),
				);
			}
		};

		// ShapeNodeのJSONをsha256にしてキャッシュ確認 → なければshape()で計算して保存
		match cached_shape(&node, &breps, &self.bucket_memo).await {
			Ok(glb) => ShapeComputeResponse::Status200(glb),
			Err(e) => ShapeComputeResponse::Raw(
				axum::response::Response::builder()
					.status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
					.body(axum::body::Body::from(e))
					.unwrap(),
			),
		}
	}
}
