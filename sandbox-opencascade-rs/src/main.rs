use opencascade::primitives::Shape;
use std::fs;
use std::path::Path;
use std::time::Instant;

fn main() {
    let step_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .join("public/PA-001-DF7.STEP");

    let out_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("out");
    fs::create_dir_all(&out_dir).expect("Failed to create out/ directory");

    let stl_step_path = out_dir.join("output_step.stl");
    let stl_brep_path = out_dir.join("output_brep.stl");
    let brep_path = out_dir.join("cache.brep");

    println!("Target: {}", step_path.display());

    // 1. STEP -> STL (現状)
    println!("\n=== 1. STEP -> STL (Standard) ===");
    let start = Instant::now();
    println!("Reading STEP...");
    let shape = Shape::read_step(&step_path).expect("Failed to read STEP file");
    let step_read_duration = start.elapsed();
    println!("  -> Read STEP: {:.2?}", step_read_duration);

    let start_write = Instant::now();
    println!("Writing STL to: {}", stl_step_path.display());
    shape
        .write_stl_with_tolerance(&stl_step_path, 0.1)
        .expect("Failed to write STL file");
    let stl_write_duration = start_write.elapsed();
    println!("  -> Write STL: {:.2?}", stl_write_duration);
    
    println!("Total (STEP -> STL): {:.2?}", step_read_duration + stl_write_duration);


    // 2. STEP -> BRep (Cache Creation)
    println!("\n=== 2. STEP -> BRep (Cache Creation) ===");
    let start_brep_write = Instant::now();
    println!("Writing BRep to: {}", brep_path.display());
    shape.write_brep(&brep_path).expect("Failed to write BRep file");
    let brep_write_duration = start_brep_write.elapsed();
    println!("  -> Write BRep: {:.2?}", brep_write_duration);


    // 3. BRep -> STL (Cache Usage)
    println!("\n=== 3. BRep -> STL (Cache Usage) ===");
    let start_brep_read = Instant::now();
    println!("Reading BRep...");
    let shape_cached = Shape::read_brep(&brep_path).expect("Failed to read BRep file");
    let brep_read_duration = start_brep_read.elapsed();
    println!("  -> Read BRep: {:.2?}", brep_read_duration);

    let start_write_2 = Instant::now();
    println!("Writing STL to: {}", stl_brep_path.display());
    shape_cached
        .write_stl_with_tolerance(&stl_brep_path, 0.1)
        .expect("Failed to write STL file");
    let stl_write_from_brep_duration = start_write_2.elapsed();
    println!("  -> Write STL: {:.2?}", stl_write_from_brep_duration);
    
    println!("Total (BRep -> STL): {:.2?}", brep_read_duration + stl_write_from_brep_duration);

    // 4. BRep Binary -> STL (Cache Usage)
    let brep_bin_path = out_dir.join("cache_bin.brep");
    let stl_brep_bin_path = out_dir.join("output_brep_bin.stl");

    println!("\n=== 4. BRep Binary -> STL (Cache Usage) ===");
    let start_brep_bin_write = Instant::now();
    println!("Writing BRep Binary to: {}", brep_bin_path.display());
    shape.write_brep_bin(&brep_bin_path).expect("Failed to write BRep Binary file");
    let brep_bin_write_duration = start_brep_bin_write.elapsed();
    println!("  -> Write BRep Binary: {:.2?}", brep_bin_write_duration);

    let start_brep_bin_read = Instant::now();
    println!("Reading BRep Binary...");
    let shape_cached_bin = Shape::read_brep_bin(&brep_bin_path).expect("Failed to read BRep Binary file");
    let brep_bin_read_duration = start_brep_bin_read.elapsed();
    println!("  -> Read BRep Binary: {:.2?}", brep_bin_read_duration);

    let start_write_3 = Instant::now();
    println!("Writing STL to: {}", stl_brep_bin_path.display());
    shape_cached_bin
        .write_stl_with_tolerance(&stl_brep_bin_path, 0.1)
        .expect("Failed to write STL file");
    let stl_write_from_brep_bin_duration = start_write_3.elapsed();
    println!("  -> Write STL: {:.2?}", stl_write_from_brep_bin_duration);
    
    println!("Total (BRep Binary -> STL): {:.2?}", brep_bin_read_duration + stl_write_from_brep_bin_duration);


    println!("\n=== Comparison ===");
    println!("STEP Read time: {:.2?}", step_read_duration);
    println!("BRep Read time: {:.2?}", brep_read_duration);
    println!("BRep Bin Read time: {:.2?}", brep_bin_read_duration);
    if brep_read_duration.as_millis() > 0 {
        let speedup = step_read_duration.as_secs_f64() / brep_read_duration.as_secs_f64();
        println!("Speedup (vs Text): {:.2}x", speedup);
    }
    if brep_bin_read_duration.as_millis() > 0 {
        let speedup_bin = step_read_duration.as_secs_f64() / brep_bin_read_duration.as_secs_f64();
        println!("Speedup (vs Binary): {:.2}x", speedup_bin);
    }

    // Validation
    println!("\n=== Validation ===");
    let size_step = std::fs::metadata(&stl_step_path).map(|m| m.len()).unwrap_or(0);
    let size_brep = std::fs::metadata(&stl_brep_path).map(|m| m.len()).unwrap_or(0);
    let size_brep_bin = std::fs::metadata(&stl_brep_bin_path).map(|m| m.len()).unwrap_or(0);

    println!("STEP -> STL Size: {} bytes", size_step);
    println!("BRep Text -> STL Size: {} bytes", size_brep);
    println!("BRep Bin -> STL Size: {} bytes", size_brep_bin);

    if size_step == 0 { eprintln!("Error: STEP output is empty!"); }
    if size_brep == 0 { eprintln!("Error: BRep output is empty!"); }
    if size_brep_bin == 0 { eprintln!("Error: BRep Binary output is empty!"); }
    
    if size_step > 0 && size_brep > 0 && size_brep_bin > 0 {
         let diff_text = (size_step as i64 - size_brep as i64).abs();
         let diff_bin = (size_step as i64 - size_brep_bin as i64).abs();
         
         if diff_text == 0 && diff_bin == 0 {
             println!("Success: All file sizes are identical.");
         } else {
             println!("Notice: File sizes differ. Text diff: {}, Bin diff: {}", diff_text, diff_bin);
         }
    }
}
