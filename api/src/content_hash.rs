use sha2::{Digest, Sha256};

pub fn content_hash(data: &[u8]) -> String {
	format!("{:x}", Sha256::digest(data))
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn hash_pa001() {
		let data = std::fs::read("../public/PA-001-DF7.STEP")
			.expect("STEPファイルが見つかりません: ../public/PA-001-DF7.STEP");
		println!("PA-001-DF7.STEP: {}", content_hash(&data));
	}
}
