use crate::openapi::*;
use crate::shape::{cached_shape, collect_breps};
use crate::step_to_brep::step_to_brep;
use ngoni;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

pub struct Server {
	bucket_temp: ngoni::s3::S3Storage,
	bucket_main: ngoni::s3::S3Storage,
}

impl Server {
	pub async fn new() -> Result<Self, String> {
		Ok(Self {
			bucket_temp: ngoni::s3::S3Storage::new(
				&std::env::var("BUCKET_TEMP")
					.unwrap_or("lambda360order-temp3a4f7567-izxs72uj1dce".to_string()),
			)
			.await,
			bucket_main: ngoni::s3::S3Storage::new(
				&std::env::var("BUCKET_MAIN")
					.unwrap_or("lambda360order-main7ad10839-jsmrkv5hcdcu".to_string()),
			)
			.await,
		})
	}
}

impl ApiInterface for Server {
	async fn version(&self, _req: VersionRequest) -> VersionResponse {
		VersionResponse::Status200(format!(
			"version: {}\nbucket_main: {}\nbucket_temp: {}\n",
			env!("CARGO_PKG_VERSION"),
			self.bucket_main.bucket,
			self.bucket_temp.bucket,
		))
	}

	async fn step_execute(&self, req: StepExecuteRequest) -> StepExecuteResponse {
		let h = &req.content_hash;
		match step_execute_inner(
			(format!("{h}.step"), self.bucket_temp.clone()),
			(format!("{h}.brep"), self.bucket_main.clone()),
			(format!("{h}.log"), self.bucket_temp.clone()),
		)
		.await
		{
			Ok(()) => StepExecuteResponse::Status204,
			Err(msg) => StepExecuteResponse::Status500(msg),
		}
	}

	async fn step_status(&self, req: StepStatusRequest) -> StepStatusResponse {
		let key_log = format!("{}.log", req.content_hash);
		let Ok((_, data)) = self.bucket_temp.read(&key_log).await else {
			return StepStatusResponse::Status404;
		};
		match serde_json::from_slice::<StepStatusBody>(&data) {
			Ok(body) => StepStatusResponse::Status200(body),
			Err(_) => StepStatusResponse::Status404,
		}
	}

	async fn step_upload_url(&self, req: StepUploadUrlRequest) -> StepUploadUrlResponse {
		let key = format!("{}.step", req.content_hash);
		match self
			.bucket_temp
			.presign_write_url(&key, std::time::Duration::from_secs(3600))
			.await
		{
			Ok(url) => StepUploadUrlResponse::Status200(url),
			Err(e) => StepUploadUrlResponse::Raw(
				axum::response::Response::builder()
					.status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
					.body(axum::body::Body::from(format!("{e:?}")))
					.unwrap(),
			),
		}
	}

	async fn shape_compute(&self, req: ShapeComputeRequest) -> ShapeComputeResponse {
		let node = req.body;

		// StepNode.pathはフロントエンドがsha256に置換済み。
		// そのsha256をキーにbucket_mainからbrepを収集する。
		let breps = match collect_breps(&node, &self.bucket_main).await {
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
		match cached_shape(&node, &breps, &self.bucket_main).await {
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

type FileInBucket = (String, ngoni::s3::S3Storage);

async fn step_execute_inner(
	key_step: FileInBucket,
	key_brep: FileInBucket,
	key_log: FileInBucket,
) -> Result<(), String> {
	let (step_key, bucket_src) = key_step;
	let (brep_key, bucket_dst) = key_brep;
	let (log_key, bucket_log) = key_log;
	let content_hash = step_key
		.strip_suffix(".step")
		.unwrap_or(&step_key)
		.to_string();
	let progress=async move |p: u32, msg: String| {
		if let Ok(json) = serde_json::to_string(&StepStatusBody {
			timestamp: std::time::SystemTime::now()
				.duration_since(std::time::UNIX_EPOCH)
				.unwrap_or_default()
				.as_secs() as i64,
			progress: p as i32,
			message: msg,
		}){
			let bucket = bucket_log.clone();
			let key = log_key.clone();
			let _ = bucket.write_bytes(&key, json.into_bytes()).await;
		}
	};
	progress(1, "ダウンロード中".to_string()).await;
	let (_, step_data) = bucket_src
		.read(&step_key)
		.await
		.map_err(|e| format!("ダウンロード失敗: {e:?}"))?;
	progress(10, "STEP変換中".to_string()).await;
	let progress_arc: Arc<
		dyn Fn(u32, String) -> Pin<Box<dyn Future<Output = ()> + Send>> + Send + Sync,
	> = {
		let progress_cloned=progress.clone();
		Arc::new(move |p: u32, msg: String| {
			let progress_cloned2=progress_cloned.clone();
			Box::pin(async move { progress_cloned2(p, msg).await })
		})
	};
	let brep_data = {
		step_to_brep(step_data.clone(), content_hash, move |p, msg| {
			progress_arc(p, msg)
		})
		.await
		.map_err(|e| format!("STEP変換失敗: {e:?}"))?
	};
	progress(90, "アップロード中".to_string()).await;
	let (r_step, r_brep) = tokio::join!(
		bucket_dst.write(
			&step_key,
			step_data,
			Some("application/step".to_string()),
			None,
			None
		),
		bucket_dst.write(
			&brep_key,
			brep_data,
			Some("application/octet-stream".to_string()),
			None,
			None
		),
	);
	r_step.map_err(|e| format!("STEPアップロード失敗: {e:?}"))?;
	r_brep.map_err(|e| format!("BRepアップロード失敗: {e:?}"))?;
	progress(100, "完了".to_string()).await;
	Ok(())
}
