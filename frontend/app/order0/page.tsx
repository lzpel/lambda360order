'use client';
import OrderWidget from '@widget/OrderWidget';

export default function OrderPage() {
  const prefix = process.env.NEXT_PUBLIC_PREFIX ?? '';
  const modelUrl = `${prefix}/PA-001-DF7.glb`;

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <OrderWidget modelUrl={modelUrl} />
    </div>
  );
}
