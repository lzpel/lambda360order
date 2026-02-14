"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

// SSRを無効化してOrderWidgetをインポート
const OrderWidget = dynamic(() => import("@embedded/OrderWidget"), {
    ssr: false,
    loading: () => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Loading Widget...
        </div>
    ),
});

export default function EmbeddedPage() {
    // 環境変数に基づいてURLを構成（GitHub Pagesデプロイ用）
    const prefix = process.env.NEXT_PUBLIC_PREFIX || "";
    const modelUrl = `${prefix}/PA-001-DF7.json`;

    return (
        <main style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Embedded Widget Demo (Integrated as React Component)</span>
                <Link href="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</Link>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                <OrderWidget modelUrl={modelUrl} />
            </div>
        </main>
    );
}
