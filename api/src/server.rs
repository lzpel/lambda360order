use crate::openapi::*;
use opencascade::primitives::Shape;
use std::path::Path;
use gltf_json as json;
use std::io::Write;
use ngoni

pub struct Server {
	bucket_step: ngoni::s3::S3Storage,
	bucket_memo: ngoni::s3::S3Storage
}

impl Server {
	pub async fn new() -> Result<Self, String> {
		Ok(Self {
			bucket_step: ngoni::s3::S3Storage::new(
				&std::env::var("BUCKET_STEP")
					.unwrap_or("sarodstack-step3a4f7567-qbdbrpfmwtb6".to_string()),
			)
			.await,
			bucket_memo: ngoni::s3::S3Storage::new(
				&std::env::var("BUCKET_MEMO")
					.unwrap_or("sarodstack-memo3a4f7567-qbdbrpfmwtb6".to_string()),
			)
			.await,
		})
	}
}

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
        // Currently ignores the specified sha256 and loads public/PA-001-DF7.brep
        let brep_path = Path::new("../public/PA-001-DF7.brep");
        
        if !brep_path.exists() {
            return ViewerViewResponse::Raw(
                axum::response::Response::builder()
                    .status(axum::http::StatusCode::NOT_FOUND)
                    .body(axum::body::Body::from("BRep file not found"))
                    .unwrap()
            );
        }

        // Read BRep
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

        // Extract mesh
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

        // GLB generation with flat normals and edges
        let glb_bytes = match create_glb(&mesh, &shape) {
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

fn create_glb(mesh: &opencascade::mesh::Mesh, shape: &Shape) -> Result<Vec<u8>, String> {
    use json::validation::Checked::Valid;

    // De-index the mesh and compute per-face (flat) normals
    // This ensures each triangle has its own vertices with a correct face normal,
    // preventing the "same direction faces with different brightness" issue.
    let src_verts: Vec<[f32; 3]> = mesh.vertices.iter().map(|v| [v.x as f32, v.y as f32, v.z as f32]).collect();

    let tri_count = mesh.indices.len() / 3;
    let vert_count = tri_count * 3; // 3 vertices per triangle after de-indexing

    let mut flat_vertices: Vec<[f32; 3]> = Vec::with_capacity(vert_count);
    let mut flat_normals: Vec<[f32; 3]> = Vec::with_capacity(vert_count);

    for tri in 0..tri_count {
        let i0 = mesh.indices[tri * 3] as usize;
        let i1 = mesh.indices[tri * 3 + 1] as usize;
        let i2 = mesh.indices[tri * 3 + 2] as usize;

        let v0 = src_verts[i0];
        let v1 = src_verts[i1];
        let v2 = src_verts[i2];

        // Compute face normal via cross product
        let edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        let edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
        let nx = edge1[1] * edge2[2] - edge1[2] * edge2[1];
        let ny = edge1[2] * edge2[0] - edge1[0] * edge2[2];
        let nz = edge1[0] * edge2[1] - edge1[1] * edge2[0];
        let len = (nx * nx + ny * ny + nz * nz).sqrt();
        let normal = if len > 1e-10 {
            [nx / len, ny / len, nz / len]
        } else {
            [0.0, 1.0, 0.0] // fallback
        };

        flat_vertices.push(v0);
        flat_vertices.push(v1);
        flat_vertices.push(v2);
        flat_normals.push(normal);
        flat_normals.push(normal);
        flat_normals.push(normal);
    }

    // No indices needed - sequential vertex rendering
    let v_bytes = unsafe { std::slice::from_raw_parts(flat_vertices.as_ptr() as *const u8, flat_vertices.len() * 12) };
    let n_bytes = unsafe { std::slice::from_raw_parts(flat_normals.as_ptr() as *const u8, flat_normals.len() * 12) };

    let mut buffer = Vec::new();
    buffer.extend_from_slice(v_bytes);
    let v_offset = 0;
    let v_len = v_bytes.len();

    // 4-byte alignment
    while buffer.len() % 4 != 0 { buffer.push(0); }
    let n_offset = buffer.len();
    buffer.extend_from_slice(n_bytes);
    let n_len = n_bytes.len();

    let buffer_total_len = buffer.len();

    // Extract edges from shape
    let mut edge_data: Vec<f32> = Vec::new();
    for edge in shape.edges() {
        let segments: Vec<_> = edge.approximation_segments().collect();
        if segments.len() < 2 {
            continue;
        }
        for i in 0..segments.len() - 1 {
            let start = segments[i];
            let end = segments[i + 1];
            edge_data.push(start.x as f32);
            edge_data.push(start.y as f32);
            edge_data.push(start.z as f32);
            edge_data.push(end.x as f32);
            edge_data.push(end.y as f32);
            edge_data.push(end.z as f32);
        }
    }

    let mut root = json::Root::default();
    root.buffers.push(json::Buffer {
        byte_length: json::validation::USize64(buffer_total_len as u64),
        name: None,
        uri: None,
        extensions: None,
        extras: Default::default(),
    });

    // BufferView & Accessor: Vertices
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
        count: json::validation::USize64(flat_vertices.len() as u64),
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

    // BufferView & Accessor: Normals
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
        count: json::validation::USize64(flat_normals.len() as u64),
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

    // Mesh & Primitive (no indices - flat/de-indexed mesh)
    let primitive = json::mesh::Primitive {
        attributes: {
            let mut map = std::collections::BTreeMap::new();
            map.insert(Valid(json::mesh::Semantic::Positions), json::Index::new(0));
            map.insert(Valid(json::mesh::Semantic::Normals), json::Index::new(1));
            map
        },
        extensions: None,
        extras: Default::default(),
        indices: None, // No indices - vertices are already de-indexed
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

    // Node with edge data in extras (read by Lambda360View as userData.edges)
    let node_extras: json::extras::Extras = if !edge_data.is_empty() {
        let edges_json = serde_json::json!({ "edges": edge_data });
        let raw = serde_json::value::RawValue::from_string(
            serde_json::to_string(&edges_json).map_err(|e| e.to_string())?
        ).map_err(|e| e.to_string())?;
        Some(raw)
    } else {
        None
    };

    root.nodes.push(json::Node {
        mesh: Some(json::Index::new(0)),
        extras: node_extras,
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
