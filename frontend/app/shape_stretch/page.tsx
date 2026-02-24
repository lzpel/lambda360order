'use client';

import { useState } from 'react';
import Lambda360Shape from '@widget/Lambda360Shape';
import type { ShapeNode } from '@/out/client';

const STEP_HASH = 'd6cb2eb2d6e0d802095ea1eda691cf9a3e9bf3394301a0d148f53e55f0f97951';

const baseShape: ShapeNode = {
  op: 'step',
  content_hash: STEP_HASH,
};

type Vec3 = [number, number, number];

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label style={{ width: '24px', fontWeight: '600', color: '#555' }}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        style={{
          flex: 1,
          padding: '6px 8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      />
      <span style={{ fontSize: '12px', color: '#999' }}>mm</span>
    </div>
  );
}

export default function ShapeStretchPage() {
  const [cut, setCut] = useState<Vec3>([0, 0, 0]);
  const [delta, setDelta] = useState<Vec3>([0, 0, 0]);
  const [shape, setShape] = useState<ShapeNode>(baseShape);

  const handleApply = () => {
    setShape({
      op: 'stretch',
      shape: baseShape,
      cut: [...cut],
      delta: [...delta],
    });
  };

  const handleReset = () => {
    setCut([0, 0, 0]);
    setDelta([0, 0, 0]);
    setShape(baseShape);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* 左: 3Dビュー */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Lambda360Shape shape={shape} origin_url={'https://dfrujiq0byx89.cloudfront.net'} upAxis="Z" />
      </div>

      {/* 右: フォーム */}
      <div style={{
        width: '280px',
        backgroundColor: '#fff',
        borderLeft: '1px solid #e5e7eb',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflowY: 'auto',
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a' }}>
          StretchNode
        </h2>

        {/* 切断面の座標 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#333' }}>
            切断面の座標 cut (mm)
          </p>
          <NumberInput label="X" value={cut[0]} onChange={(v) => setCut([v, cut[1], cut[2]])} />
          <NumberInput label="Y" value={cut[1]} onChange={(v) => setCut([cut[0], v, cut[2]])} />
          <NumberInput label="Z" value={cut[2]} onChange={(v) => setCut([cut[0], cut[1], v])} />
        </div>

        {/* 伸縮量 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#333' }}>
            伸縮量 delta (mm)
          </p>
          <NumberInput label="X" value={delta[0]} onChange={(v) => setDelta([v, delta[1], delta[2]])} />
          <NumberInput label="Y" value={delta[1]} onChange={(v) => setDelta([delta[0], v, delta[2]])} />
          <NumberInput label="Z" value={delta[2]} onChange={(v) => setDelta([delta[0], delta[1], v])} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
          <button
            onClick={handleApply}
            style={{
              padding: '12px',
              backgroundColor: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            適用
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '10px',
              backgroundColor: '#f3f4f6',
              color: '#555',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  );
}
