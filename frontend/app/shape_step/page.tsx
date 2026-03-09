'use client';

import Lambda360Shape from '@widget/Lambda360Shape';
import type { ShapeNode } from '@/out/client';

const testShape: ShapeNode = {
  op: 'step',
  content_hash: 'bd405c4e4cd565154134b09ed3dc350bec22d1dac86d98b390a1803a485d146b',
};

export default function ShapePage() {
  return (
    <Lambda360Shape shape={testShape} origin_url="https://d3l2x153v6axn.cloudfront.net" />
  );
}
