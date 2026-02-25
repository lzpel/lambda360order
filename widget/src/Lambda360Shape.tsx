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

  let centerNode = null;
  if (error) {
    centerNode = (
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
    );
  } else if (loading) {
    centerNode = (
      <div style={{
        padding: '8px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontSize: '14px',
        color: '#666',
      }}>
        {model ? 'Updating Model...' : 'Loading...'}
      </div>
    );
  } else if (!model) {
    centerNode = (
      <div style={{ color: '#999' }}>
        No model
      </div>
    );
  }

  return (
    <Lambda360View
      model={model}
      center={centerNode}
      backgroundColor="#f5f5f5"
      edgeColor="#333333"
      showEdges={true}
      showViewMenu={true}
      orthographic={true}
      preserveCamera={true}
      upAxis={upAxis}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
}
