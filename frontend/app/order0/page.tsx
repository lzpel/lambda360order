'use client';

import { useState, useEffect } from 'react';
import { Lambda360View, ModelData } from 'lambda360view';

// Define types for form selections
type Material = 'SUS304' | 'Aluminium' | 'Steel' | 'Brass';
type ShapeType = 'Plate' | 'Sheet' | 'Angle' | 'Channel';

export default function OrderPage() {
    const [model, setModel] = useState<ModelData | null>(null);
    const [material, setMaterial] = useState<Material>('SUS304');
    const [shape, setShape] = useState<ShapeType>('Plate');
    const [quantity, setQuantity] = useState<number>(1);
    const [loading, setLoading] = useState(true);

    // Initial price calculation (dummy logic)
    const basePrice = 5000;
    const price = basePrice * quantity;

    useEffect(() => {
        // Fetch the specific model JSON
        // Using PA-001-DF7.json as requested
        fetch(`${process.env.NEXT_PUBLIC_PREFIX || ''}/PA-001-DF7.json`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch model');
                return res.json();
            })
            .then(data => {
                const modelData = data as ModelData;
                // Convert arrays to typed arrays required by lambda360view
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
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            {/* Left: 3D Viewer Area */}
            <div style={{ flex: 1, position: 'relative', backgroundColor: '#f5f5f5', borderRight: '1px solid #ddd' }}>
                {loading && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        color: '#666'
                    }}>
                        Loading 3D Model...
                    </div>
                )}
                {model && (
                    <Lambda360View
                        model={model}
                        backgroundColor="#f5f5f5"
                        edgeColor="#333333"
                        showEdges={true}
                        showViewMenu={true}
                        orthographic={true}
                        width="100%"
                        height="100%"
                    />
                )}
            </div>

            {/* Right: Order Form Area */}
            <div style={{
                width: '400px',
                backgroundColor: '#ffffff',
                padding: '24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                boxShadow: '-2px 0 10px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>
                        カスタムオーダー
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        パラメータを指定してリアルタイムに見積もりを確認できます。
                    </p>
                </div>

                {/* Form Group: Shape Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        形状 (Shape)
                    </label>
                    <select
                        value={shape}
                        onChange={(e) => setShape(e.target.value as ShapeType)}
                        style={{
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff'
                        }}
                    >
                        <option value="Plate">平板 (Plate)</option>
                        <option value="Sheet">薄板 (Sheet)</option>
                        <option value="Angle">アングル (Angle)</option>
                        <option value="Channel">チャンネル (Channel)</option>
                    </select>
                </div>

                {/* Form Group: Material Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        材質 (Material)
                    </label>
                    <select
                        value={material}
                        onChange={(e) => setMaterial(e.target.value as Material)}
                        style={{
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#fff'
                        }}
                    >
                        <option value="SUS304">ステンレス (SUS304)</option>
                        <option value="Aluminium">アルミニウム (A5052)</option>
                        <option value="Steel">鉄 (SPCC)</option>
                        <option value="Brass">真鍮 (C2801)</option>
                    </select>
                </div>

                {/* Form Group: Dimensions (Placeholder for parameters) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        寸法 (Dimensions)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <span style={{ fontSize: '12px', color: '#666' }}>幅 (Width)</span>
                            <input
                                type="number"
                                defaultValue={100}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    marginTop: '4px'
                                }}
                            />
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: '#666' }}>高さ (Height)</span>
                            <input
                                type="number"
                                defaultValue={200}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    marginTop: '4px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Form Group: Quantity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        個数 (Quantity)
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        style={{
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                </div>

                {/* Price Display */}
                <div style={{
                    marginTop: 'auto',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ color: '#666', fontSize: '14px' }}>単価</span>
                        <span style={{ fontWeight: '600' }}>¥{basePrice.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '20px', fontWeight: 'bold', color: '#0066cc' }}>
                        <span>合計金額</span>
                        <span>¥{price.toLocaleString()}</span>
                    </div>
                </div>

                {/* Action Button */}
                <button style={{
                    backgroundColor: '#0066cc',
                    color: 'white',
                    padding: '14px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                }}>
                    カートに入れる
                </button>
            </div>
        </div>
    );
}
