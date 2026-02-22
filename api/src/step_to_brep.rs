use crate::content_hash::content_hash as compute_hash;
use opencascade::primitives::Shape;
use std::future::Future;
use std::sync::Arc;
use tokio::time::Duration;

/// STEPバイト列をBRepバイナリに変換する（非同期）
///
/// 進捗コールバック `on_progress(progress, message)`:
/// - progress は 1〜99 の範囲で呼ばれる（100/101以上はserver.rs側が送出）
pub async fn step_to_brep<F, Fut>(
	step_data: Vec<u8>,
	content_hash: String,
	on_progress: F,
) -> Result<Vec<u8>, String>
where
	F: Fn(u32, String) -> Fut + Send + Sync + 'static,
	Fut: Future<Output = ()> + Send + 'static,
{
	// step_data が content_hash と一致するか検証
	let actual_hash = compute_hash(&step_data);
	if actual_hash != content_hash {
		return Err(format!(
			"ハッシュ不一致: expected={content_hash} actual={actual_hash}"
		));
	}

	// Arc で包んでハートビートタスクと共有
	let on_progress = Arc::new(on_progress);

	on_progress(10, "ハッシュ一致を確認しました".to_string()).await;

	let tmp_dir = std::env::temp_dir();
	let step_path = tmp_dir.join(format!("{content_hash}.step"));
	let brep_path = tmp_dir.join(format!("{content_hash}.brep"));

	std::fs::write(&step_path, &step_data).map_err(|e| format!("一時ファイル書き込み失敗: {e}"))?;

	on_progress(20, "STEPファイル読み込み中 (0秒)".to_string()).await;

	// Shape::read_step 実行中、5秒ごとに進捗を更新するタスク
	let task_heartbeat = tokio::spawn({
		let on_progress = on_progress.clone();
		async move {
			let start = tokio::time::Instant::now();
			let mut tick = 0u32;
			// 最初のtickが即時発火しないよう interval_at で5秒後から開始
			let mut iv = tokio::time::interval_at(
				tokio::time::Instant::now() + Duration::from_secs(5),
				Duration::from_secs(5),
			);
			loop {
				iv.tick().await;
				tick += 1;
				let elapsed = start.elapsed().as_secs();
				let progress = (20 + tick * 2).min(69);
				on_progress(progress, format!("STEPファイル読み込み中 ({elapsed}秒)")).await;
			}
		}
	});

	// Shape::read_step はブロッキングなので spawn_blocking へ
	let step_path2 = step_path.clone();
	let task_read_step = tokio::task::spawn_blocking(move || Shape::read_step(&step_path2));
	let shape_result = task_read_step
		.await
		.map_err(|e| format!("spawn_blocking失敗: {e:?}"))
		.and_then(|r| r.map_err(|e| format!("STEP読み込み失敗: {e:?}")));
	task_heartbeat.abort();
	let shape = shape_result?;
	let _ = std::fs::remove_file(&step_path);

	on_progress(70, "BRepバイナリ書き込み中".to_string()).await;

	shape
		.write_brep_bin(&brep_path)
		.map_err(|e| format!("BRep書き込み失敗: {e:?}"))?;

	let brep_data =
		std::fs::read(&brep_path).map_err(|e| format!("BRepファイル読み込み失敗: {e}"))?;
	let _ = std::fs::remove_file(&brep_path);

	Ok(brep_data)
}

#[cfg(test)]
mod tests {
	use super::*;

	/// cargo test -p api -- step_to_brep --include-ignored で実行
	#[tokio::test]
	#[ignore]
	async fn convert_pa001() {
		let step_data = std::fs::read("../public/PA-001-DF7.STEP")
			.expect("STEPファイルが見つかりません: ../public/PA-001-DF7.STEP");

		let hash = crate::content_hash::content_hash(&step_data);
		println!("content_hash: {hash}");

		let brep = step_to_brep(step_data, hash, |p, msg| async move {
			println!("{p} {msg}");
		})
		.await
		.expect("変換失敗");

		std::fs::create_dir_all("../out").unwrap();
		std::fs::write("../out/out.brep", &brep).expect("出力失敗");
		println!("出力完了: ../out/out.brep ({} bytes)", brep.len());
	}

	#[tokio::test]
	async fn hash_mismatch_returns_err() {
		let result =
			step_to_brep(b"dummy".to_vec(), "wronghash".to_string(), |_, _| async {}).await;
		assert!(result.is_err());
		assert!(result.unwrap_err().contains("ハッシュ不一致"));
	}
}
