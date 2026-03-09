import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Lambda360 Order</h1>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <li><Link href="/upload">STEPファイル変換ツール</Link></li>
        <li><Link href="/shape_step">Lambda360Shape StepNodeデモ (単体形状モデルの表示)</Link></li>
        <li><Link href="/shape_stretch">Lambda360Shape StretchNodeデモ (伸縮可能モデルの表示)</Link></li>
        <li><Link href="/color_stretch">Lambda360Shape ColorStretchデモ (カラーモデルの伸縮)</Link></li>
        <li><Link href="/form_box">Lambda360Form Widget Demo (ボックス形状の伸縮)</Link></li>
        <li><Link href="/widget">ウィジェット埋め込みデモ (UMD/IIFE)</Link></li>
      </ul>
    </main>
  );
}
