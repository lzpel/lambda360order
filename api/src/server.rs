use crate::openapi::*;
use opencascade::primitives::Shape;
use std::path::Path;
use gltf_json as json;
use std::mem;
use std::io::Write;

pub struct Server {}

impl ApiInterface for Server {
    async fn step_exists(&self, _req: StepExistsRequest) -> StepExistsResponse {
        StepExistsResponse::Status200(PathsStepSha256GetResponses200ContentApplicationJsonSchema {
            exists: true,
            uploadUrl: None,
            expiresAt: None,
        })
    }

    async fn hello_say_hello(&self, _req: HelloSayHelloRequest) -> HelloSayHelloResponse {
        HelloSayHelloResponse::Status200("Hello from Mandolin API".to_string())
    }

    async fn viewer_view(&self, _req: ViewerViewRequest) -> ViewerViewResponse {
        // 指定された sha256 は現在無視して public/PA-001-DF7.brep をロードする
        let brep_path = Path::new("../public/PA-001-DF7.brep");
        
        if !brep_path.exists() {
            return ViewerViewResponse::Raw(
                axum::response::Response::builder()
                    .status(axum::http::StatusCode::NOT_FOUND)
                    .body(axum::body::Body::from("BRep file not found"))
                    .unwrap()
            );
        }

        // BRep 読み込み
        let shape = match Shape::read_brep(brep_path) {
            Ok(s) => s,
            Err(_) => match Shape::read_brep_bin(brep_path) {
                Ok(s) => s,
                Err(e) => {
                    return ViewerViewResponse::Raw(
                        axum::response::Response::builder()
                            .status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
                            .body(axum::body::Body::from(format!("Failed to read BRep: {:?}", e)))
                            .unwrap()
                    );
                }
            }
        };

        // メッシュ抽出
        let mesh = match shape.mesh_with_tolerance(0.1) {
            Ok(m) => m,
            Err(e) => {
                return ViewerViewResponse::Raw(
                    axum::response::Response::builder()
                        .status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
                        .body(axum::body::Body::from(format!("Failed to mesh shape: {:?}", e)))
                        .unwrap()
                );
            }
        };

        // GLB 手書き実装
        let glb_bytes = match create_glb(&mesh) {
            Ok(bytes) => bytes,
            Err(e) => {
                return ViewerViewResponse::Raw(
                    axum::response::Response::builder()
                        .status(axum::http::StatusCode::INTERNAL_SERVER_ERROR)
                        .body(axum::body::Body::from(format!("Failed to create GLB: {}", e)))
                        .unwrap()
                );
            }
        };

        ViewerViewResponse::Status200(glb_bytes)
    }
}

fn create_glb(mesh: &opencascade::mesh::Mesh) -> Result<Vec<u8>, String> {
    use json::validation::Checked::Valid;

    // データの変換 (f64 -> f32, usize -> u32)
    let v_data: Vec<[f32; 3]> = mesh.vertices.iter().map(|v| [v.x as f32, v.y as f32, v.z as f32]).collect();
    let n_data: Vec<[f32; 3]> = mesh.normals.iter().map(|n| [n.x as f32, n.y as f32, n.z as f32]).collect();
    let i_data: Vec<u32> = mesh.indices.iter().map(|&i| i as u32).collect();

    let v_bytes = unsafe { std::slice::from_raw_parts(v_data.as_ptr() as *const u8, v_data.len() * 12) };
    let n_bytes = unsafe { std::slice::from_raw_parts(n_data.as_ptr() as *const u8, n_data.len() * 12) };
    let i_bytes = unsafe { std::slice::from_raw_parts(i_data.as_ptr() as *const u8, i_data.len() * 4) };

    let mut buffer = Vec::new();
    buffer.extend_from_slice(v_bytes);
    let v_offset = 0;
    let v_len = v_bytes.len();

    // 4バイトアライメント
    while buffer.len() % 4 != 0 { buffer.push(0); }
    let n_offset = buffer.len();
    buffer.extend_from_slice(n_bytes);
    let n_len = n_bytes.len();

    while buffer.len() % 4 != 0 { buffer.push(0); }
    let i_offset = buffer.len();
    buffer.extend_from_slice(i_bytes);
    let i_len = i_bytes.len();

    let buffer_total_len = buffer.len();

    let mut root = json::Root::default();
    root.buffers.push(json::Buffer {
        byte_length: json::validation::USize64(buffer_total_len as u64),
        name: None,
        uri: None,
        extensions: None,
        extras: Default::default(),
    });

    // Accessors & BufferViews
    // Vertices
    root.buffer_views.push(json::buffer::View {
        buffer: json::Index::new(0),
        byte_length: json::validation::USize64(v_len as u64),
        byte_offset: Some(json::validation::USize64(v_offset as u64)),
        byte_stride: None,
        name: None,
        target: Some(Valid(json::buffer::Target::ArrayBuffer)),
        extensions: None,
        extras: Default::default(),
    });
    root.accessors.push(json::Accessor {
        buffer_view: Some(json::Index::new(0)),
        byte_offset: Some(json::validation::USize64(0)),
        count: json::validation::USize64(v_data.len() as u64),
        component_type: Valid(json::accessor::GenericComponentType(json::accessor::ComponentType::F32)),
        extensions: None,
        extras: Default::default(),
        type_: Valid(json::accessor::Type::Vec3),
        min: None,
        max: None,
        name: None,
        normalized: false,
        sparse: None,
    });

    // Normals
    root.buffer_views.push(json::buffer::View {
        buffer: json::Index::new(0),
        byte_length: json::validation::USize64(n_len as u64),
        byte_offset: Some(json::validation::USize64(n_offset as u64)),
        byte_stride: None,
        name: None,
        target: Some(Valid(json::buffer::Target::ArrayBuffer)),
        extensions: None,
        extras: Default::default(),
    });
    root.accessors.push(json::Accessor {
        buffer_view: Some(json::Index::new(1)),
        byte_offset: Some(json::validation::USize64(0)),
        count: json::validation::USize64(n_data.len() as u64),
        component_type: Valid(json::accessor::GenericComponentType(json::accessor::ComponentType::F32)),
        extensions: None,
        extras: Default::default(),
        type_: Valid(json::accessor::Type::Vec3),
        min: None,
        max: None,
        name: None,
        normalized: false,
        sparse: None,
    });

    // Indices
    root.buffer_views.push(json::buffer::View {
        buffer: json::Index::new(0),
        byte_length: json::validation::USize64(i_len as u64),
        byte_offset: Some(json::validation::USize64(i_offset as u64)),
        byte_stride: None,
        name: None,
        target: Some(Valid(json::buffer::Target::ElementArrayBuffer)),
        extensions: None,
        extras: Default::default(),
    });
    root.accessors.push(json::Accessor {
        buffer_view: Some(json::Index::new(2)),
        byte_offset: Some(json::validation::USize64(0)),
        count: json::validation::USize64(i_data.len() as u64),
        component_type: Valid(json::accessor::GenericComponentType(json::accessor::ComponentType::U32)),
        extensions: None,
        extras: Default::default(),
        type_: Valid(json::accessor::Type::Scalar),
        min: None,
        max: None,
        name: None,
        normalized: false,
        sparse: None,
    });

    // Mesh & Primitive
    let primitive = json::mesh::Primitive {
        attributes: {
            let mut map = std::collections::BTreeMap::new();
            map.insert(Valid(json::mesh::Semantic::Positions), json::Index::new(0));
            map.insert(Valid(json::mesh::Semantic::Normals), json::Index::new(1));
            map
        },
        extensions: None,
        extras: Default::default(),
        indices: Some(json::Index::new(2)),
        material: None,
        mode: Valid(json::mesh::Mode::Triangles),
        targets: None,
    };

    root.meshes.push(json::Mesh {
        extensions: None,
        extras: Default::default(),
        name: None,
        primitives: vec![primitive],
        weights: None,
    });

    // Node & Scene
    root.nodes.push(json::Node {
        mesh: Some(json::Index::new(0)),
        ..Default::default()
    });

    let scene = json::Scene {
        extensions: None,
        extras: Default::default(),
        name: None,
        nodes: vec![json::Index::new(0)],
    };
    root.scenes.push(scene);
    root.scene = Some(json::Index::new(0));

    // Serialize JSON
    let json_string = json::serialize::to_string(&root).map_err(|e| e.to_string())?;
    let mut json_bytes = json_string.into_bytes();
    while json_bytes.len() % 4 != 0 { json_bytes.push(b' '); }

    // GLB Header
    let mut glb = Vec::new();
    glb.write_all(b"glTF").unwrap();
    glb.write_all(&2u32.to_le_bytes()).unwrap(); // Version 2
    
    let total_size = 12 + 8 + json_bytes.len() + 8 + buffer.len();
    glb.write_all(&(total_size as u32).to_le_bytes()).unwrap();

    // JSON Chunk
    glb.write_all(&(json_bytes.len() as u32).to_le_bytes()).unwrap();
    glb.write_all(b"JSON").unwrap();
    glb.write_all(&json_bytes).unwrap();

    // BIN Chunk
    glb.write_all(&(buffer.len() as u32).to_le_bytes()).unwrap();
    glb.write_all(b"BIN\0").unwrap();
    glb.write_all(&buffer).unwrap();

    Ok(glb)
}
