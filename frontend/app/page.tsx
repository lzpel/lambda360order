import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Lambda360 Order</h1>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <li><Link href="/order0">Order Widget Demo</Link></li>
        <li><Link href="/insert">外部スクリプト埋め込みデモ</Link></li>
        <li><Link href="/server">Server Viewer</Link></li>
      </ul>
    </main>
  );
}
