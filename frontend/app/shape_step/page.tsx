'use client';

import Lambda360Shape from '@widget/Lambda360Shape';
import type { ShapeNode } from '@/out/client';

const testShape: ShapeNode = {
  op: 'step',
  content_hash: 'bd405c4e4cd565154134b09ed3dc350bec22d1dac86d98b390a1803a485d146b',
};

export default function ShapePage() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Lambda360Shape shape={testShape} origin_url="https://dfrujiq0byx89.cloudfront.net" />
    </div>
  );
}
