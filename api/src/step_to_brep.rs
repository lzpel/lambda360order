use crate::content_hash::content_hash as compute_hash;
use crate::openapi::StepStatusBody;
use chijin::Shape;
use ngoni::s3::S3Storage;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

/// STEPファイルを変換してBRepをbucket_mainに保存するパイプライン
///
/// 1. bucket_temp から `{uuid}.step` を読み込む
/// 2. content_hash を計算して STEP -> BRep 変換（progress 1〜89）
/// 3. bucket_main に `{content_hash}.step` / `{content_hash}.brep` をアップロード
/// 4. Ok(content_hash) を返す
pub async fn step_pipeline(
	uuid: &str,
	bucket_temp: S3Storage,
	bucket_main: S3Storage,
) -> Result<String, String> {
	let step_key = format!("_/{uuid}.step");
	let log_key = format!("_/{uuid}.log");

	let progress: Arc<
		dyn Fn(u32, String) -> Pin<Box<dyn Future<Output = ()> + Send>> + Send + Sync,
	> = Arc::new({
		let bucket_log = bucket_temp.clone();
		move |p: u32, msg: String| {
			let Ok(json) = serde_json::to_string(&StepStatusBody {
				timestamp: std::time::SystemTime::now()
					.duration_since(std::time::UNIX_EPOCH)
					.unwrap_or_default()
					.as_secs() as i64,
				progress: p as i32,
				message: msg,
			}) else {
				return Box::pin(async {});
			};
			let bucket = bucket_log.clone();
			let key = log_key.clone();
			Box::pin(async move {
				let _ = bucket.write_bytes(&key, json.into_bytes()).await;
			})
		}
	});

	// ダウンロード
	progress(1, "ダウンロード中".to_string()).await;
	let (_, step_data) = {
		let r = bucket_temp
			.read(&step_key)
			.await
			.map_err(|e| format!("ダウンロード失敗: {e:?}"));
		if let Err(ref e) = r {
			progress(101, e.clone()).await;
		}
		r?
	};

	let content_hash = compute_hash(&step_data);

	progress(20, "STEPファイル読み込み中 (0秒)".to_string()).await;

	// Shape::read_step 実行中、5秒ごとに進捗を更新するタスク
	let task_heartbeat = tokio::spawn({
		let progress = progress.clone();
		async move {
			let start = tokio::time::Instant::now();
			let mut tick = 0u32;
			let mut iv = tokio::time::interval_at(
				tokio::time::Instant::now() + std::time::Duration::from_secs(5),
				std::time::Duration::from_secs(5),
			);
			loop {
				iv.tick().await;
				tick += 1;
				let elapsed = start.elapsed().as_secs();
				let p = (20 + tick * 1).min(69);
				progress(p, format!("STEPファイル読み込み中 ({elapsed}秒)")).await;
			}
		}
	});

	// Shape::read_step はブロッキングなので spawn_blocking へ
	// chijin API: read_step(&mut impl Read) — Cursor でインメモリストリームを橋渡し
	let step_data_clone = step_data.clone();
	let task_read_step = tokio::task::spawn_blocking(move || {
		Shape::read_step(&mut std::io::Cursor::new(step_data_clone))
	});
	let shape_result = task_read_step
		.await
		.map_err(|e| format!("spawn_blocking失敗: {e:?}"))
		.and_then(|r| r.map_err(|e| format!("STEP読み込み失敗: {e:?}")));
	task_heartbeat.abort();
	let shape = {
		if let Err(ref e) = shape_result {
			progress(101, e.clone()).await;
		}
		shape_result?
	};

	progress(70, "BRepバイナリ書き込み中".to_string()).await;

	// chijin API: write_brep_bin(&mut impl Write) — Vec<u8> バッファに直接書き込み
	let mut brep_data: Vec<u8> = Vec::new();
	let r = shape
		.write_brep_bin(&mut brep_data)
		.map_err(|e| format!("BRep書き込み失敗: {e:?}"));
	if let Err(ref e) = r {
		progress(101, e.clone()).await;
	}
	r?;

	// アップロード
	progress(90, "アップロード中".to_string()).await;
	let step_dst_key = format!("{content_hash}.step");
	let brep_key = format!("{content_hash}");
	let (r_step, r_brep) = tokio::join!(
		bucket_main.write(
			&step_dst_key,
			step_data,
			Some("application/step".to_string()),
			None,
			None,
		),
		bucket_main.write(
			&brep_key,
			brep_data,
			Some("application/octet-stream".to_string()),
			None,
			None,
		),
	);
	let r_step = r_step.map_err(|e| format!("STEPアップロード失敗: {e:?}"));
	if let Err(ref e) = r_step {
		progress(101, e.clone()).await;
	}
	r_step?;
	let r_brep = r_brep.map_err(|e| format!("BRepアップロード失敗: {e:?}"));
	if let Err(ref e) = r_brep {
		progress(101, e.clone()).await;
	}
	r_brep?;

	progress(100, "完了".to_string()).await;
	Ok(content_hash)
}
