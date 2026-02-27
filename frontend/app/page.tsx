import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Lambda360 Order</h1>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <li><Link href="/upload">STEPファイル変換ツール</Link></li>
        <li><Link href="/shape_step">StepNodeデモ (単体形状モデルの表示)</Link></li>
        <li><Link href="/shape_stretch">StretchNodeデモ (伸縮可能モデルの表示)</Link></li>
        <li><Link href="/order0">Order Widget Demo 0 (形状組み立て)</Link></li>
        <li><Link href="/order1">Order Widget Demo 1 (ボックス形状の伸縮)</Link></li>
        <li><Link href="/widget">ウィジェット埋め込みデモ (UMD/IIFE)</Link></li>
        <li><Link href="/server">Server Viewer デモ</Link></li>
      </ul>
    </main>
  );
}
