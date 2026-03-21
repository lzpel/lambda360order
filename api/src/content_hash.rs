use sha2::{Digest, Sha256};

pub fn content_hash(data: &[u8]) -> String {
	format!("{:x}", Sha256::digest(data))
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn hash_colored_box() {
		let data = std::fs::read("examples/colored_box.step")
			.expect("STEPファイルが見つかりません: examples/colored_box.step");
		println!("colored_box.step: {}", content_hash(&data));
	}
}
