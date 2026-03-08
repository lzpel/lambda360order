use minijinja::{context, Environment};
use std::fs;

fn main() {
    let mut env = Environment::new();
    env.set_loader(|name: &str| {
        let path = std::path::Path::new(name);
        match fs::read_to_string(path) {
            Ok(s) => Ok(Some(s)),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(minijinja::Error::new(
                minijinja::ErrorKind::InvalidOperation,
                e.to_string(),
            )),
        }
    });
    let tmpl = env.get_template("template.html").unwrap();

    let mut entries: Vec<_> = fs::read_dir(".")
        .expect("failed to read current directory")
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir())
        .filter(|e| e.file_name() != "target")
        .collect();
    entries.sort_by_key(|e| e.file_name());

    let mut count = 0;
    for entry in entries {
        let dir = entry.path();
        let script_path = dir.join("script.js");
        if !script_path.exists() {
            continue;
        }
        let title = entry.file_name().to_string_lossy().to_string();
        let script = fs::read_to_string(&script_path).expect("failed to read script.js");
        let rendered = tmpl
            .render(context! { title, version => "latest", script })
            .expect("render failed");
        let out = dir.join("index.html");
        fs::write(&out, rendered).expect("failed to write index.html");
        println!("Generated: {}", out.display());
        count += 1;
    }
    println!("{} file(s) generated.", count);
}
