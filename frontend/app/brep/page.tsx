'use client';

import { useState, useEffect } from 'react';
import { Lambda360View } from 'lambda360view';
import { ModelData } from 'lambda360view';

// Ensure type compatibility if direct import has issues with 'as unknown' or defining the type locally
// The imported JSON might be inferred as a generic object, so we might need casting.

export default function Page() {
    const [model, setModel] = useState<ModelData | null>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_PREFIX}/PA-001-DF7.json`)
            .then(res => res.json())
            .then(data => {
                const modelData = data as ModelData;
                if (modelData.parts) {
                    modelData.parts.forEach((part) => {
                        if (part.shape) {
                            part.shape.vertices = new Float32Array(part.shape.vertices as unknown as number[]);
                            part.shape.normals = new Float32Array(part.shape.normals as unknown as number[]);
                            part.shape.triangles = new Uint32Array(part.shape.triangles as unknown as number[]);
                            part.shape.edges = new Float32Array(part.shape.edges as unknown as number[]);
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
                width="100%"
                height="100%"
            />
        </div>
    );
}
