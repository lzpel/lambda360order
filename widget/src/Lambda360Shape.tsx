import { useState, useEffect } from 'react';
import { Lambda360View } from 'lambda360view';
import { createClient, createConfig } from '@/out/client/client';
import { shapeCompute } from '@/out/client';
import type { ShapeNode } from '@/out/client';

interface Lambda360ShapeProps {
  shape: ShapeNode;
  origin_url?: string;
}

export default function Lambda360Shape({ shape, origin_url = '' }: Lambda360ShapeProps) {
  const [model, setModel] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const baseUrl = origin_url ? `${origin_url}/api` : '/api';
    const customClient = createClient(createConfig({ baseUrl }));

    shapeCompute({ body: shape, client: customClient, parseAs: 'blob' })
      .then(async (res) => {
        if (res.data) {
          const buf = await (res.data as Blob).arrayBuffer();
          setModel(buf);
        } else {
          setError('GLBの取得に失敗しました');
        }
      })
      .catch((err: unknown) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shape, origin_url]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!model) return null;

  return (
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
  );
}
