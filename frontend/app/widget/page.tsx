'use client';
import { useEffect } from 'react';

export default function WidgetDemoPage() {
    useEffect(() => {
        const scriptId = 'lambda360-widget-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const mountWidget = () => {
            const { initLambda360 } = (window as any).Lambda360;

            // 1. Schema
            const paramSchema = {
                width: { type: "number", label: "幅", unit: "mm", default: 300, constraint: { min: 200, max: 600, step: 10 } },
                depth: { type: "number", label: "奥行き", unit: "mm", default: 400, constraint: { min: 200, max: 800, step: 10 } },
                height: { type: "number", label: "高さ", unit: "mm", default: 150, constraint: { enum: [100, 150, 200] } },
                color: { type: "color", label: "色", default: "#cccccc", constraint: { enum: ["#cccccc", "#336699", "#993333"] } }
            };

            // 2. Shape Generator
            const generateShape = (params: any) => {
                return {
                    shape: {
                        op: "subtract",
                        a: {
                            op: "stretch",
                            shape: { op: "step", path: "box-base.step" },
                            cut: [100, 100, 75],
                            delta: [params.width - 200, params.depth - 200, params.height - 150]
                        },
                        b: {
                            op: "translate",
                            shape: { op: "step", path: "mounting-hole.step" },
                            xyz: [params.width * 0.5, params.depth - 20, 0]
                        }
                    },
                    color: params.color,
                    price: 5000 + (params.width * 10)
                };
            };

            // 3. Mount
            initLambda360('#custom-box', {
                params: paramSchema,
                lambda: generateShape
            });
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = '/widget.js'; // public/widget.jsから読み込み
            script.async = true;
            script.onload = mountWidget;
            document.body.appendChild(script);
        } else {
            // 既に読み込まれてる場合
            mountWidget();
        }

        return () => {
            // ウィジェットのマウント先をクリア
            const container = document.getElementById('custom-box');
            if (container) {
                container.innerHTML = '';
            }
        };
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Lambda360 Widget Test (UMD/IIFE)</h1>
            <p>このページは、<code>widget.js</code> をスクリプトタグで読み込んでパラメトリックな3Dビューワーを表示するデモです。</p>

            <div id="custom-box" style={{ width: '1000px', height: '600px', border: '1px solid #ccc' }}></div>
        </div>
    );
}
