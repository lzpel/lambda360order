use crate::openapi::*;
use crate::shape::{cached_shape, collect_breps};
use crate::step_to_brep::step_to_brep;
use ngoni;

pub struct Server {
	bucket_temp: ngoni::s3::S3Storage,
	bucket_main: ngoni::s3::S3Storage,
}

fn clone_s3(s: &ngoni::s3::S3Storage) -> ngoni::s3::S3Storage {
	ngoni::s3::S3Storage {
		bucket: s.bucket.clone(),
		client: s.client.clone(),
	}
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
		let content_hash = req.content_hash;
		let key_step = format!("{}.step", content_hash);
		let key_brep = format!("{}.brep", content_hash);
		let bucket_temp = clone_s3(&self.bucket_temp);
		let bucket_main = clone_s3(&self.bucket_main);

		let (tx, rx) = tokio::sync::mpsc::channel::<Vec<u8>>(32);

		tokio::spawn(async move {
			macro_rules! send {
				($code:expr, $msg:expr) => {{
					let _ = tx.send(format!("{} {}\n", $code, $msg).into_bytes()).await;
				}};
			}

			// bucket_temp から STEP をダウンロード
			send!(1, "ダウンロード中");
			let step_data = match bucket_temp.read(&key_step).await {
				Ok((_, data)) => data,
				Err(e) => {
					send!(101, format!("ダウンロード失敗: {e:?}"));
					return;
				}
			};

			// STEP → BRep 変換（spawn_blocking は step_to_brep 内部で行う）
			let tx2 = tx.clone();
			let brep_data =
				match step_to_brep(step_data.clone(), content_hash.clone(), move |p, msg| {
					let _ = tx2.try_send(format!("{p} {msg}\n").into_bytes());
				})
				.await
				{
					Ok(data) => data,
					Err(e) => {
						send!(101, format!("変換失敗: {e}"));
						return;
					}
				};

			// bucket_main へ .step と .brep を並列アップロード
			send!(90, "アップロード中");
			let (r_step, r_brep) = tokio::join!(
				bucket_main.write(
					&key_step,
					step_data,
					Some("application/step".to_string()),
					None,
					None,
				),
				bucket_main.write(
					&key_brep,
					brep_data,
					Some("application/octet-stream".to_string()),
					None,
					None,
				),
			);
			if let Err(e) = r_step {
				send!(101, format!("STEPアップロード失敗: {e:?}"));
				return;
			}
			if let Err(e) = r_brep {
				send!(101, format!("BRepアップロード失敗: {e:?}"));
				return;
			}

			send!(100, "完了");
		});

		// mpsc Receiver を Stream に変換してストリーミングレスポンスで返す
		let stream = futures_util::stream::unfold(rx, |mut rx| async move {
			rx.recv().await.map(|chunk| {
				(
					Ok::<_, std::convert::Infallible>(axum::body::Bytes::from(chunk)),
					rx,
				)
			})
		});
		StepExecuteResponse::Raw(
			axum::response::Response::builder()
				.status(200)
				.header("content-type", "text/event-stream")
				.body(axum::body::Body::from_stream(stream))
				.unwrap(),
		)
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
