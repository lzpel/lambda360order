'use client';

import Lambda360Shape from '@widget/Lambda360Shape';
import type { ShapeNode } from '@/out/client';

const testShape: ShapeNode = {
  op: 'step',
  content_hash: 'bd405c4e4cd565154134b09ed3dc350bec22d1dac86d98b390a1803a485d146b',
};

export default function ShapePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Lambda360Shape shape={testShape} />
    </div>
  );
}
