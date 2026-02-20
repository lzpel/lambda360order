use mandolin;
use std::fs;
use std::io::Write;

fn main() {
	// 1. Load OpenAPI spec
	let spec_json = fs::read_to_string("../public/openapi.json")
		.expect("Failed to read ../public/openapi.json");
	let spec: openapiv3::OpenAPI =
		serde_json::from_str(&spec_json).expect("Failed to parse OpenAPI spec");

	// 2. Build environment
	let env = mandolin::environment(spec).expect("Failed to build mandolin environment");

	// 3. Render RUST_AXUM template
	let tmpl = env
		.get_template("RUST_AXUM")
		.expect("Failed to get RUST_AXUM template");
	let output = tmpl.render(0).expect("Failed to render template");

	// 4. Write to src/openapi.rs
	let mut file = fs::File::create("src/openapi.rs").expect("Failed to create src/openapi.rs");
	file.write_all(output.as_bytes())
		.expect("Failed to write to src/openapi.rs");

	println!("Successfully generated src/openapi.rs from openapi.json");
}
