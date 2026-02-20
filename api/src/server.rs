use crate::openapi::*;
use crate::shape::{cached_shape, collect_breps, create_glb};
use ngoni;
use opencascade::primitives::Shape;
use std::path::Path;

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
	async fn step_exists(&self, _req: StepExistsRequest) -> StepExistsResponse {
		StepExistsResponse::Status200(FileExists {
			exists: true,
			uploadUrl: None,
			expiresAt: None,
		})
	}

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

	async fn viewer_view(&self, _req: ViewerViewRequest) -> ViewerViewResponse {
		// Currently ignores the specified sha256 and loads public/PA-001-DF7.brep
		let brep_path = Path::new("../public/PA-001-DF7.brep");

		if !brep_path.exists() {
			return ViewerViewResponse::Raw(
				axum::response::Response::builder()
					.status(axum::http::StatusCode::NOT_FOUND)
					.body(axum::body::Body::from("BRep file not found"))
					.unwrap(),
			);
		}

		let shape = match Shape::read_brep(brep_path) {
			Ok(s) => s,
			Err(_) => match Shape::read_brep_bin(brep_path) {
				Ok(s) => s,
				Err(e) => {
					return ViewerViewResponse::Raw(
						axum::response::Response::builder()
							.status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
							.body(axum::body::Body::from(format!(
								"Failed to read BRep: {:?}",
								e
							)))
							.unwrap(),
					);
				}
			},
		};

		let mesh = match shape.mesh_with_tolerance(0.1) {
			Ok(m) => m,
			Err(e) => {
				return ViewerViewResponse::Raw(
					axum::response::Response::builder()
						.status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
						.body(axum::body::Body::from(format!(
							"Failed to mesh shape: {:?}",
							e
						)))
						.unwrap(),
				);
			}
		};

		let glb_bytes = match create_glb(&mesh, &shape) {
			Ok(bytes) => bytes,
			Err(e) => {
				return ViewerViewResponse::Raw(
					axum::response::Response::builder()
						.status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
						.body(axum::body::Body::from(format!(
							"Failed to create GLB: {}",
							e
						)))
						.unwrap(),
				);
			}
		};

		ViewerViewResponse::Status200(glb_bytes)
	}
}
