"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Lambda360 Order</h1>
      <p>Select a tool:</p>
      <ul>
        <li>
          <Link href="/torus">Torus Generator</Link>
        </li>
        <li>
          <Link href="/step">STEP Viewer</Link>
        </li>
      </ul>
    </main>
  );
}
