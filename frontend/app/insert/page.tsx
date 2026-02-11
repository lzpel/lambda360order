'use client';

import Script from 'next/script';
import Head from 'next/head';

export default function InsertPage() {
    return (
        <>
            <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
                <h1>外部スクリプト埋め込みデモ (External Embedding)</h1>
                <p>このページは、3Dビューワーがスクリプト経由で注入される外部Webサイト（WordPressやShopify等）をシミュレートしています。</p>
                <p>以下の点線枠内が、ビューワーが挿入されるターゲットコンテナです：</p>
                <hr />

                {/* 
            ここは3Dビューワーが注入されるターゲットコンテナです。
            ユーザー（サイト管理者）は、この空のdivタグを自分のサイトに設置するだけで済みます。
        */}
                <div id="lambda360-viewer-container" style={{ width: '100%', height: '500px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    (ここにスクリプトによって3Dビューワーが注入されます)
                </div>

                {/* 
            【想定される外部スクリプト】
            本来は以下のようなタグを1行貼るだけで動作する形を目指します：
            <script src="https://cdn.lambda360.com/loader.js" data-container="lambda360-viewer-container" data-model="PA-001-DF7"></script>
            
            現在はデモとして、コンソールログを出力するだけのダミー処理を入れています。
        */}
                <Script
                    id="lambda360-loader"
                    strategy="afterInteractive"
                    src="https://lzpel.github.io/lambda360order/main.js"
                />
            </div>
        </>
    );
}
