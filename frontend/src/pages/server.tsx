import { useEffect, useState } from 'react';
import { viewerView } from '../out';
import { Lambda360View } from 'lambda360view';

export default function ServerPage() {
    const [model, setModel] = useState<ArrayBuffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get sha256 from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const sha256 = params.get('sha256') || 'dummy';

    useEffect(() => {
        if (!sha256) {
            setError('sha256 query parameter is required');
            setLoading(false);
            return;
        }

        viewerView({ query: { sha256 }, parseAs: 'blob' })
            .then(async (response) => {
                const blob = response.data as Blob;
                const arrayBuffer = await blob.arrayBuffer();
                setModel(arrayBuffer);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError('Failed to fetch GLB model');
                setLoading(false);
            });
    }, [sha256]);

    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
            {loading && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    color: '#666', fontFamily: 'sans-serif',
                }}>
                    Loading 3D Model...
                </div>
            )}
            {error && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    color: 'red', fontFamily: 'sans-serif',
                }}>
                    Error: {error}
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
    );
}
