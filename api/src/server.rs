use crate::openapi::*;
use crate::shape::{cached_shape, collect_shape};
use crate::step_to_brep::step_pipeline;
use ngoni;

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

	async fn step_upload_url(&self, _req: StepUploadUrlRequest) -> StepUploadUrlResponse {
		let id = uuid::Uuid::now_v7();
		let key = format!("_/{id}.step");
		match self
			.bucket_temp
			.presign_write_url(&key, std::time::Duration::from_secs(3600))
			.await
		{
			Ok(url) => StepUploadUrlResponse::Status200(UploadUrlBody { id, url }),
			Err(e) => StepUploadUrlResponse::Raw(
				axum::response::Response::builder()
					.status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
					.body(axum::body::Body::from(format!("{e:?}")))
					.unwrap(),
			),
		}
	}

	async fn step_test(&self, req: StepTestRequest) -> StepTestResponse {
		macro_rules! err {
			($msg:expr) => {
				return StepTestResponse::Status500($msg.to_string())
			};
		}

		// 1. upload_url
		let StepUploadUrlResponse::Status200(UploadUrlBody { id, url }) = self
			.step_upload_url(StepUploadUrlRequest {
				request: axum::http::Request::new(axum::body::Body::empty()),
			})
			.await
		else {
			err!("upload_url 失敗");
		};

		// 2. presigned URL へ PUT
		if let Err(e) = reqwest::Client::new().put(&url).body(req.body).send().await {
			err!(format!("S3アップロード失敗: {e:?}"));
		}

		// 3. execute
		let StepExecuteResponse::Status200(content_hash) = self
			.step_execute(StepExecuteRequest {
				id,
				request: axum::http::Request::new(axum::body::Body::empty()),
			})
			.await
		else {
			err!("execute 失敗");
		};

		// 4. status 確認
		let StepStatusResponse::Status200(status) = self
			.step_status(StepStatusRequest {
				id,
				request: axum::http::Request::new(axum::body::Body::empty()),
			})
			.await
		else {
			err!("status 取得失敗");
		};

		if status.progress != 100 {
			err!(format!("異常終了: progress={}", status.progress));
		}

		StepTestResponse::Status200(content_hash)
	}

	async fn step_execute(&self, req: StepExecuteRequest) -> StepExecuteResponse {
		match step_pipeline(
			&req.id.to_string(),
			self.bucket_temp.clone(),
			self.bucket_main.clone(),
		)
		.await
		{
			Ok(content_hash) => StepExecuteResponse::Status200(content_hash),
			Err(msg) => StepExecuteResponse::Status500(msg),
		}
	}

	async fn step_status(&self, req: StepStatusRequest) -> StepStatusResponse {
		let key_log = format!("_/{}.log", req.id);
		let Ok((_, data)) = self.bucket_temp.read(&key_log).await else {
			return StepStatusResponse::Status404;
		};
		match serde_json::from_slice::<StepStatusBody>(&data) {
			Ok(body) => StepStatusResponse::Status200(body),
			Err(_) => StepStatusResponse::Status404,
		}
	}

	async fn shape_compute(&self, req: ShapeComputeRequest) -> ShapeComputeResponse {
		let node = req.body;

		// StepNode.pathはフロントエンドがsha256に置換済み。
		// そのsha256をキーにbucket_mainからbrepを収集してShapeに変換する。
		let shapes = match collect_shape(&node, &self.bucket_main).await {
			Ok(s) => s,
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
		match cached_shape(&node, shapes, &self.bucket_temp, &self.bucket_main).await {
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

#[cfg(test)]
mod tests {

	fn online_url() -> String {
		std::env::var("ONLINE_URL").unwrap_or("https://dfrujiq0byx89.cloudfront.net".to_string())
	}

	/// make test-online で実行: cargo test -p api -- test_online_step_pipeline --include-ignored
	#[tokio::test]
	#[ignore]
	async fn test_online_step_pipeline() {
		let client = reqwest::Client::new();
		let base = online_url();

		// 1. アップロード URL 取得
		let resp: serde_json::Value = client
			.post(format!("{base}/api/step/upload"))
			.send()
			.await
			.expect("upload URL 取得失敗")
			.json()
			.await
			.expect("upload URL レスポンス JSON パース失敗");
		let id = resp["id"].as_str().expect("id が文字列でない").to_string();
		let url = resp["url"]
			.as_str()
			.expect("url が文字列でない")
			.to_string();
		println!("id: {id}");

		// 2. STEPファイルをアップロード
		let step_data =
			std::fs::read("../public/PA-001-DF7.STEP").expect("STEPファイルが見つかりません");
		client
			.put(&url)
			.body(step_data)
			.send()
			.await
			.expect("STEPファイルアップロード失敗");

		// 3. execute と status ポーリングを並走
		let exec_client = client.clone();
		let exec_url = format!("{base}/api/step/{id}/execute");
		let exec_task = tokio::spawn(async move {
			println!("[execute] 開始");
			let result = exec_client.post(&exec_url).send().await;
			match result {
				Ok(resp) => {
					let status = resp.status();
					let body = resp.text().await.unwrap_or_default();
					println!("[execute] {} body={:?}", status, body);
				}
				Err(e) => println!("[execute] エラー: {e:?}"),
			}
		});

		// 4. status ポーリング
		println!("[status] ポーリング開始");
		loop {
			tokio::time::sleep(std::time::Duration::from_secs(2)).await;
			let resp = client
				.get(format!("{base}/api/step/{id}/status"))
				.send()
				.await
				.expect("status リクエスト失敗");
			let http_status = resp.status();
			let body = resp.text().await.unwrap_or_default();
			println!("[status] {} body={}", http_status, body);
			if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
				let progress = json["progress"].as_i64().unwrap_or(0);
				if progress >= 100 {
					assert_eq!(progress, 100, "変換失敗: progress={progress}");
					break;
				}
			}
		}

		exec_task.await.unwrap();
	}
}
