'use client';
import { useEffect } from 'react';

export default function InsertPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.id = 'lambda360-loader';
    script.src = 'https://lzpel.github.io/lambda360order/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById('lambda360-loader');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>外部スクリプト埋め込みデモ (External Embedding)</h1>
      <p>このページは、3Dビューワーがスクリプト経由で注入される外部Webサイト（WordPressやShopify等）をシミュレートしています。</p>
      <p>以下の点線枠内が、ビューワーが挿入されるターゲットコンテナです：</p>
      <hr />

      {/*
        ここは3Dビューワーが注入されるターゲットコンテナです。
        ユーザー（サイト管理者）は、この空のdivタグを自分のサイトに設置するだけで済みます。
      */}
      <div
        id="lambda360-order"
        data-model="https://lzpel.github.io/lambda360order/PA-001-DF7.json"
        style={{ width: '100%', height: '500px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}
      >
        (ここにスクリプトによって3Dビューワーが注入されます)
      </div>

      {/*
        【想定される外部スクリプト】
        本来は以下のようなタグを1行貼るだけで動作する形を目指します：
        <script src="https://lzpel.github.io/lambda360order/widget.js"></script>
      */}
    </div>
  );
}
