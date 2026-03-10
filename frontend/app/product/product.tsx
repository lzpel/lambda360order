'use client';
import Lambda360Form from '@widget/Lambda360Form';
import type { ShapeNode } from '@/out/client';

const demoInput = {
  width:  { type: "number" as const, label: "幅",    unit: "mm", default: 300, constraint: { min: 200, max: 600, step: 10 } },
  depth:  { type: "number" as const, label: "奥行き", unit: "mm", default: 400, constraint: { min: 200, max: 800, step: 10 } },
  height: { type: "number" as const, label: "高さ",  unit: "mm", default: 150, constraint: { enum: [100, 150, 200] } },
  color:  { type: "select" as const, label: "色",    default: "#cccccc", options: [
    { value: "#cccccc", label: "シルバー" },
    { value: "#336699", label: "ネイビー" },
    { value: "#993333", label: "ワイン" },
  ]},
};

const demoLambda = (input: Record<string, any>) => {
  const price = 1500 + (input.width * input.depth * 0.001);
  return [
    {
      type: "shape" as const,
      label: "プレビュー",
      shape: {
        op: "stretch",
        shape: { op: "step", content_hash: "d6cb2eb2d6e0d802095ea1eda691cf9a3e9bf3394301a0d148f53e55f0f97951" },
        cut: [1, 0, 10],
        delta: [input.width - 200, input.depth - 200, input.height - 150],
      } as ShapeNode,
    },
    { type: "border" as const },
    {
      type: "message" as const,
      label: `参考価格: ¥${price.toLocaleString()}`,
      messageType: "info" as const,
    },
    {
      type: "action" as const,
      label: "見積もりを送信",
      email_to: ["citygirlstat00@gmail.com"],
      email_bcc: [],
      slack: ["#orders"],
    },
  ];
};

const features = [
  {
    icon: '📋',
    title: 'フォームを作る感覚で導入',
    desc: '項目を定義するだけで 3D つきの見積もりフォームが完成。CAD の知識は不要です。',
  },
  {
    icon: '📐',
    title: '入力するたびに形が変わる',
    desc: '幅・奥行き・高さを入力すると 3D モデルがリアルタイムで更新。製造不可の組み合わせも自動チェックします。',
  },
  {
    icon: '✉️',
    title: 'そのまま見積もりを送信',
    desc: '送信ボタン一つで担当者にメール・Slack 通知。受注から社内共有まで自動化されます。',
  },
];

const steps = [
  { num: '01', title: 'サイズ・仕様を入力', desc: '幅・奥行き・高さをスライダーや入力欄で直感的に設定できます。' },
  { num: '02', title: '3D でリアルタイム確認', desc: 'パラメータを変えるたびに3Dモデルが即時更新されます。' },
  { num: '03', title: '見積もりをそのまま送信', desc: 'ボタン一つで担当者にメール・Slack通知が届きます。' },
];

export default function Product() {
  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: '#1a1a1a',
        lineHeight: 1.7,
        overflowX: 'hidden',
      }}
    >
      {/* ── Hero ─────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #06111f 0%, #0d2b52 55%, #0055bb 100%)',
          color: '#fff',
          padding: '7rem 2rem 6rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: '740px', margin: '0 auto', position: 'relative' }}>
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(96,165,250,0.18)',
              border: '1px solid rgba(96,165,250,0.45)',
              borderRadius: '999px',
              padding: '5px 18px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#93c5fd',
              marginBottom: '1.75rem',
            }}
          >
            製造業向け 3D 見積もりフォーム
          </span>
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 6vw, 4rem)',
              fontWeight: 900,
              margin: '0 0 1.5rem',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            形<span style={{ color: '#60a5fa' }}>/</span>Katachi<span style={{ color: '#60a5fa' }}>360</span>
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.75)',
              margin: '0 auto 2.75rem',
              maxWidth: '520px',
            }}
          >
            Google フォームの感覚で使える、3D つき見積もりフォーム。
            サイズを入力すると形が見え、そのまま発注できます。
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="#demo"
              style={{
                background: '#fff',
                color: '#0055bb',
                padding: '14px 34px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              デモを試す <span>→</span>
            </a>
            <a
              href="#features"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                padding: '14px 34px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '15px',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              詳細を見る
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────── */}
      <section
        style={{
          background: '#0d2b52',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '3.5rem',
          flexWrap: 'wrap',
        }}
      >
        {[
          { val: '< 100ms', label: 'プレビュー更新' },
          { val: 'ゼロコード', label: '埋め込み対応' },
          { val: 'メール / Slack', label: '自動通知' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa' }}>{s.val}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" style={{ background: '#f4f8ff', padding: '5.5rem 2rem' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                margin: '0 0 0.6rem',
                letterSpacing: '-0.025em',
                color: '#0d2b52',
              }}
            >
              主な機能
            </h2>
            <p style={{ color: '#666', fontSize: '15px' }}>受注業務を効率化する 3 つのコア機能</p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  border: '1px solid #dde9ff',
                  borderRadius: '14px',
                  padding: '2rem 1.75rem',
                  boxShadow: '0 2px 16px rgba(0,85,187,0.07)',
                }}
              >
                <div style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    margin: '0 0 0.6rem',
                    color: '#0d2b52',
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#555', margin: 0, lineHeight: 1.85 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section style={{ padding: '5.5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                margin: '0 0 0.6rem',
                letterSpacing: '-0.025em',
                color: '#0d2b52',
              }}
            >
              使い方
            </h2>
            <p style={{ color: '#666', fontSize: '15px' }}>たった 3 ステップで見積もり完了</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    minWidth: '58px',
                    height: '58px',
                    background: 'linear-gradient(135deg, #0055bb, #0d2b52)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '14px',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,85,187,0.3)',
                  }}
                >
                  {s.num}
                </div>
                <div style={{ paddingTop: '8px' }}>
                  <h3 style={{ margin: '0 0 0.3rem', fontWeight: 700, fontSize: '1.05rem', color: '#0d2b52' }}>
                    {s.title}
                  </h3>
                  <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ────────────────────────────────────── */}
      <section id="demo" style={{ background: '#edf3ff', padding: '5.5rem 2rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span
              style={{
                display: 'inline-block',
                background: '#dbeafe',
                color: '#1d4ed8',
                borderRadius: '999px',
                padding: '5px 18px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              ライブデモ
            </span>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                margin: '0 0 0.75rem',
                letterSpacing: '-0.025em',
                color: '#0d2b52',
              }}
            >
              実際に試してみよう
            </h2>
            <p style={{ color: '#555', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
              パラメータを変えるとリアルタイムで 3D モデルが更新されます。
              気に入ったら「見積もりを送信」でそのまま発注できます。
            </p>
          </div>

          {/* browser chrome frame */}
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #bfdbfe',
              boxShadow: '0 12px 48px rgba(0,85,187,0.13)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(90deg, #0d2b52, #0055bb)',
                padding: '11px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
              }}
            >
              {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                <div
                  key={i}
                  style={{ width: 11, height: 11, borderRadius: '50%', background: c }}
                />
              ))}
              <span
                style={{
                  marginLeft: '10px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              >
                katachi360-demo
              </span>
            </div>
            <Lambda360Form input={demoInput} lambda={demoLambda} />
          </div>
        </div>
      </section>

      {/* ── Embed snippet ────────────────────────────────── */}
      <section style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                margin: '0 0 0.6rem',
                letterSpacing: '-0.025em',
                color: '#0d2b52',
              }}
            >
              簡単に埋め込める
            </h2>
            <p style={{ color: '#666', fontSize: '15px' }}>
              HTML に 2 行追加するだけで、どのサイトにも導入可能です。
            </p>
          </div>
          <div
            style={{
              background: '#0d1117',
              borderRadius: '12px',
              padding: '1.5rem 1.75rem',
              overflowX: 'auto',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            <pre style={{ margin: 0, fontSize: '13px', lineHeight: 1.8, color: '#e6edf3' }}>
              <span style={{ color: '#8b949e' }}>{`<!-- 1. ウィジェットスクリプトを読み込む -->`}</span>
              {'\n'}
              <span style={{ color: '#ff7b72' }}>{`<script`}</span>
              {' '}
              <span style={{ color: '#79c0ff' }}>src</span>
              <span style={{ color: '#e6edf3' }}>=</span>
              <span style={{ color: '#a5d6ff' }}>{`"https://unpkg.com/lambda360form@latest/dist/lambda360form.js"`}</span>
              <span style={{ color: '#ff7b72' }}>{`></script>`}</span>
              {'\n\n'}
              <span style={{ color: '#8b949e' }}>{`<!-- 2. マウント先の要素を用意して initLambda360 を呼ぶ -->`}</span>
              {'\n'}
              <span style={{ color: '#ff7b72' }}>{`<div`}</span>
              {' '}
              <span style={{ color: '#79c0ff' }}>id</span>
              <span style={{ color: '#e6edf3' }}>=</span>
              <span style={{ color: '#a5d6ff' }}>{`"my-order"`}</span>
              <span style={{ color: '#ff7b72' }}>{`></div>`}</span>
              {'\n'}
              <span style={{ color: '#ff7b72' }}>{`<script>`}</span>
              {'\n'}
              {'  '}
              <span style={{ color: '#79c0ff' }}>Lambda360</span>
              <span style={{ color: '#e6edf3' }}>.</span>
              <span style={{ color: '#d2a8ff' }}>initLambda360</span>
              <span style={{ color: '#e6edf3' }}>(</span>
              <span style={{ color: '#a5d6ff' }}>{`'#my-order'`}</span>
              <span style={{ color: '#e6edf3' }}>, {'{ params, lambda }'})</span>
              <span style={{ color: '#e6edf3' }}>;</span>
              {'\n'}
              <span style={{ color: '#ff7b72' }}>{`</script>`}</span>
            </pre>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #06111f 0%, #0055bb 100%)',
          color: '#fff',
          padding: '6rem 2rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(96,165,250,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(0,85,187,0.3) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: '580px', margin: '0 auto', position: 'relative' }}>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              margin: '0 0 1rem',
              letterSpacing: '-0.025em',
            }}
          >
            今すぐ導入しませんか？
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '2.5rem', fontSize: '15px' }}>
            Katachi360 は御社のサイトにワンラインで埋め込み可能です。
            お気軽にお問い合わせください。
          </p>
          <a
            href="mailto:info@lambda360.jp"
            style={{
              background: '#fff',
              color: '#0055bb',
              padding: '15px 44px',
              borderRadius: '9px',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              display: 'inline-block',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            お問い合わせ
          </a>
        </div>
      </section>

    </div>
  );
}
