'use client';
import Script from 'next/script';

export default function WidgetDemoPage() {
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Lambda360 Widget Test (UMD/IIFE)</h1>
            <p>このページは、<code>widget.js</code> をスクリプトタグで読み込んでパラメトリックな3Dビューワーを表示するデモです。</p>

            <div id="custom-box" style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}></div>

            <Script src="/widget.js" />

            <Script id="lambda360-init">
                {`
                    // HTMLでのべた書きを想定したコード (Next.jsのSPA遷移対策も含む)
                    const setupWidget = () => {
                        // widget.jsの読み込みが遅れている場合は再試行
                        if (!window.Lambda360) {
                            setTimeout(setupWidget, 50);
                            return;
                        }

                        const { initLambda360 } = window.Lambda360;

                        // 1. Schema
                        const paramSchema = {
                            width: { type: "number", label: "幅", unit: "mm", default: 300, constraint: { min: 200, max: 600, step: 10 } },
                            depth: { type: "number", label: "奥行き", unit: "mm", default: 400, constraint: { min: 200, max: 800, step: 10 } },
                            height: { type: "number", label: "高さ", unit: "mm", default: 150, constraint: { enum: [100, 150, 200] } },
                            color: { type: "color", label: "色", default: "#cccccc", constraint: { enum: ["#cccccc", "#336699", "#993333"] } }
                        };

                        // 2. Shape Generator
                        const generateShape = (params) => {
                            return {
                                shape: {
                                    op: "stretch",
                                    shape: { op: "step", content_hash: "d6cb2eb2d6e0d802095ea1eda691cf9a3e9bf3394301a0d148f53e55f0f97951" },
                                    cut: [1, 0, 10], // [100, 100, 75]
                                    delta: [params.width - 200, params.depth - 200, params.height - 150]
                                },
                                color: params.color,
                                price: 1500 + (params.width * params.depth * 0.001)
                            };
                        };

                        // 3. Mount
                        if (initLambda360) {
                            // Reactの再レンダリング時に重複してマウントするのを防ぐ
                            const container = document.getElementById('custom-box');
                            if (container && container.innerHTML === '') {
                                initLambda360('#custom-box', {
                                    params: paramSchema,
                                    lambda: generateShape
                                });
                            }
                        }
                    };

                    // onloadイベントで実行（通常のHTML想定）
                    window.addEventListener('load', setupWidget);

                    // 既にページが読み込まれている場合（Next.jsのSPA遷移時）の対応
                    if (document.readyState === 'complete') {
                        setupWidget();
                    }
                `}
            </Script>
        </div>
    );
}
