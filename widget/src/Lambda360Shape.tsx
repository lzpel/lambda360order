import { useState, useEffect, useRef } from 'react';
import { Lambda360View } from 'lambda360view';
import { createClient, createConfig } from '@/out/client/client';
import { shapeCompute } from '@/out/client';
import type { ShapeNode } from '@/out/client';

interface Lambda360ShapeProps {
  shape: ShapeNode;
  origin_url?: string;
  upAxis?: 'Y' | 'Z' | '-Y' | '-Z';
}

export default function Lambda360Shape({ shape, origin_url = '', upAxis = 'Y' }: Lambda360ShapeProps) {
  const [model, setModel] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const baseUrl = origin_url ? `${origin_url}/api` : '/api';
    const customClient = createClient(createConfig({ baseUrl }));

    shapeCompute({ body: shape, client: customClient, parseAs: 'blob' })
      .then(async (res) => {
        if (controller.signal.aborted) return;
        if (res.data) {
          const buf = await (res.data as Blob).arrayBuffer();
          if (!controller.signal.aborted) {
            setModel(buf);
          }
        } else {
          if (!controller.signal.aborted) {
            setError('GLBの取得に失敗しました');
          }
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(String(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [shape, origin_url]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Always render Lambda360View if we have a model */}
      {model && (
        <Lambda360View
          model={model}
          backgroundColor="#f5f5f5"
          edgeColor="#333333"
          showEdges={true}
          showViewMenu={true}
          orthographic={true}
          preserveCamera={true}
          upAxis={upAxis}
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* Loading overlay - shown on top of the existing view */}
      {loading && !model && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          <div style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '14px',
            color: '#666',
          }}>
            Loading...
          </div>
        </div>
      )}

      {/* Subtle loading indicator when updating an existing model */}
      {loading && model && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '8px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '14px',
          color: '#666',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          Updating Model...
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: model ? 'rgba(245, 245, 245, 0.7)' : '#f5f5f5',
          zIndex: 10,
        }}>
          <div style={{
            padding: '12px 20px',
            backgroundColor: '#fff',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '14px',
            color: '#cc0000',
            border: '1px solid #ffcccc',
          }}>
            Error: {error}
          </div>
        </div>
      )}

      {/* Initial state with no model and not loading */}
      {!model && !loading && !error && (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#999',
        }}>
          No model
        </div>
      )}
    </div>
  );
}
