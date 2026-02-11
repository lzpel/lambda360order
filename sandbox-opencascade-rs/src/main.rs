use clap::Parser;
use opencascade::primitives::Shape;
use serde::Serialize;
use std::fs::File;
use std::io::Write;
use std::path::Path;

/// Simple program to convert STEP/BRep files to STL/JSON
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Input file path
    #[arg(help = "Input file path (.step, .stp, .brep)")]
    input: String,

    /// Output file path
    #[arg(help = "Output file path (.stl, .json, .brep)")]
    output: String,
}

#[derive(Serialize)]
struct ModelData {
    version: u32,
    name: String,
    id: String,
    parts: Vec<Part>,
    bb: BoundingBox,
}

#[derive(Serialize)]
struct Part {
    id: String,
    name: String,
    #[serde(rename = "type")]
    part_type: String, // "shapes"
    shape: ShapeData,
    color: String,
    loc: Vec<Vec<f64>>, // [[pos], [quat]]
}

#[derive(Serialize)]
struct ShapeData {
    vertices: Vec<f32>,
    normals: Vec<f32>,
    triangles: Vec<u32>,
    edges: Vec<f32>,
}

#[derive(Serialize)]
struct BoundingBox {
    xmin: f64,
    xmax: f64,
    ymin: f64,
    ymax: f64,
    zmin: f64,
    zmax: f64,
}

fn main() {
    let args = Args::parse();
    let input_path = Path::new(&args.input);
    let output_path = Path::new(&args.output);

    // Ensure output directory exists
    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).expect("Failed to create output directory");
    }

    // Read Input
    let shape = if let Some(ext) = input_path.extension() {
        let ext_str = ext.to_str().unwrap().to_lowercase();
        match ext_str.as_str() {
            "step" | "stp" => {
                println!("Reading STEP: {}", input_path.display());
                Shape::read_step(input_path).expect("Failed to read STEP file")
            }
            "brep" => {
                println!("Reading BRep: {}", input_path.display());
                Shape::read_brep(input_path).or_else(|e| {
                    println!("  -> Text read failed ({:?}), trying binary...", e);
                    Shape::read_brep_bin(input_path)
                }).expect("Failed to read BRep file (tried both text and binary)")
            }
            _ => panic!("Unsupported input extension: .{}", ext_str),
        }
    } else {
        panic!("Input file has no extension");
    };

    // Write Output
    if let Some(ext) = output_path.extension() {
        let ext_str = ext.to_str().unwrap().to_lowercase();
        match ext_str.as_str() {
            "stl" => {
                println!("Writing STL: {}", output_path.display());
                shape
                    .write_stl_with_tolerance(output_path, 0.1)
                    .expect("Failed to write STL file");
            }
            "json" => {
                println!("Writing JSON: {}", output_path.display());
                write_json(&shape, output_path);
            }
            "brep" => {
                println!("Writing BRep: {}", output_path.display());
                shape.write_brep(output_path).expect("Failed to write BRep file");
            }
            _ => panic!("Unsupported output extension: .{}", ext_str),
        }
    } else {
        panic!("Output file has no extension");
    }
}

fn write_json(shape: &Shape, output_path: &Path) {
    let mesh = shape.mesh_with_tolerance(0.1).expect("Failed to mesh shape");

    let mut vertices: Vec<f32> = Vec::with_capacity(mesh.vertices.len() * 3);
    for v in &mesh.vertices {
        vertices.push(v.x as f32);
        vertices.push(v.y as f32);
        vertices.push(v.z as f32);
    }

    let mut normals: Vec<f32> = Vec::with_capacity(mesh.normals.len() * 3);
    for n in &mesh.normals {
        normals.push(n.x as f32);
        normals.push(n.y as f32);
        normals.push(n.z as f32);
    }

    let triangles: Vec<u32> = mesh.indices.iter().map(|&i| i as u32).collect();

    let mut edges: Vec<f32> = Vec::new();
    for edge in shape.edges() {
        let segments: Vec<_> = edge.approximation_segments().collect();
        if segments.len() < 2 {
            continue;
        }
        for i in 0..segments.len() - 1 {
            let start = segments[i];
            let end = segments[i+1];
            edges.push(start.x as f32);
            edges.push(start.y as f32);
            edges.push(start.z as f32);
            edges.push(end.x as f32);
            edges.push(end.y as f32);
            edges.push(end.z as f32);
        }
    }

    let shape_data = ShapeData {
        vertices,
        normals,
        triangles,
        edges,
    };

    let part = Part {
        id: "/model/part1".to_string(),
        name: "Part1".to_string(),
        part_type: "shapes".to_string(),
        shape: shape_data,
        color: "#808080".to_string(),
        loc: vec![vec![0.0, 0.0, 0.0], vec![0.0, 0.0, 0.0, 1.0]],
    };

    // Calculate Bounding Box
    let mut xmin = f64::INFINITY;
    let mut xmax = f64::NEG_INFINITY;
    let mut ymin = f64::INFINITY;
    let mut ymax = f64::NEG_INFINITY;
    let mut zmin = f64::INFINITY;
    let mut zmax = f64::NEG_INFINITY;

    for v in &mesh.vertices {
        if v.x < xmin { xmin = v.x; }
        if v.x > xmax { xmax = v.x; }
        if v.y < ymin { ymin = v.y; }
        if v.y > ymax { ymax = v.y; }
        if v.z < zmin { zmin = v.z; }
        if v.z > zmax { zmax = v.z; }
    }

    // Handle case where mesh is empty
    if xmin == f64::INFINITY {
        xmin = 0.0; xmax = 0.0;
        ymin = 0.0; ymax = 0.0;
        zmin = 0.0; zmax = 0.0;
    }

    let bb = BoundingBox {
        xmin, xmax, ymin, ymax, zmin, zmax,
    };

    let model_data = ModelData {
        version: 3,
        name: "ConvertedModel".to_string(),
        id: "/model".to_string(),
        parts: vec![part],
        bb,
    };

    let json = serde_json::to_string(&model_data).expect("Failed to serialize model data");
    
    let mut file = File::create(output_path).expect("Failed to create output file");
    file.write_all(json.as_bytes()).expect("Failed to write to output file");

    println!("Successfully wrote model data to: {}", output_path.display());
}
