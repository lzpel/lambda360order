import React, { useState, useEffect } from 'react';
import { Lambda360View, ModelData } from 'lambda360view';

export default function Page() {
    const [model, setModel] = useState<ModelData | null>(null);

    useEffect(() => {
        const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
        fetch(`${baseUrl}PA-001-DF7.json`)
            .then(res => res.json())
            .then(data => {
                const modelData = data as ModelData;
                if (modelData.parts) {
                    modelData.parts.forEach((part: any) => {
                        if (part.shape) {
                            part.shape.vertices = new Float32Array(part.shape.vertices);
                            part.shape.normals = new Float32Array(part.shape.normals);
                            part.shape.triangles = new Uint32Array(part.shape.triangles);
                            part.shape.edges = new Float32Array(part.shape.edges);
                        }
                    });
                }
                setModel(modelData);
            });
    }, []);

    if (!model) return <div>Loading...</div>;

    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
            <Lambda360View
                model={model}
                backgroundColor="#f0f0f0"
                edgeColor="#000000"
                showEdges={true}
                showViewMenu={true}
                orthographic={true}
                width="100%"
                height="100%"
            />
        </div>
    );
}
