"use client";

import Lambda360Form from '@widget/Lambda360Form';
import type { ShapeNode } from '@/out/client';

export default function FormBoxPage() {
    const input = {
        width:  { type: "number" as const, label: "幅",    unit: "mm", default: 300, constraint: { min: 200, max: 600, step: 10 } },
        depth:  { type: "number" as const, label: "奥行き", unit: "mm", default: 400, constraint: { min: 200, max: 800, step: 10 } },
        height: { type: "number" as const, label: "高さ",  unit: "mm", default: 150, constraint: { enum: [100, 150, 200] } },
        color:  { type: "select" as const, label: "色",    default: "#cccccc", options: [
            { value: "#cccccc", label: "シルバー" },
            { value: "#336699", label: "ネイビー" },
            { value: "#993333", label: "ワイン" },
        ]},
    };

    const lambda = (input: Record<string, any>) => {
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
            ...(input.width > 500 && input.height > 180 ? [{
                type: "message" as const,
                label: "幅500mm超かつ高さ180mm超の組み合わせは製造不可です",
                messageType: "error" as const,
            }] : []),
            {
                type: "action" as const,
                label: "見積もりを送信",
                email_to: ["citygirlstat00@gmail.com"],
                email_bcc: [],
                slack: ["#orders"],
            },
        ];
    };

    return (
        <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
            <Lambda360Form input={input} lambda={lambda} />
        </div>
    );
}
