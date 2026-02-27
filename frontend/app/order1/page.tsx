"use client";

import Lambda360Order from '@widget/Lambda360Order';
import type { ShapeNode } from '@/out/client';

export default function Order1Page() {
    const params = {
        width: { type: "number" as const, label: "幅", unit: "mm", default: 300, constraint: { min: 200, max: 600, step: 10 } },
        depth: { type: "number" as const, label: "奥行き", unit: "mm", default: 400, constraint: { min: 200, max: 800, step: 10 } },
        height: { type: "number" as const, label: "高さ", unit: "mm", default: 150, constraint: { enum: [100, 150, 200] } },
        color: { type: "color" as const, label: "色", default: "#cccccc", constraint: { enum: ["#cccccc", "#336699", "#993333"] } }
    };

    const lambda = (params: Record<string, any>) => {
        return {
            shape: {
                op: "stretch",
                shape: { op: "step", content_hash: "d6cb2eb2d6e0d802095ea1eda691cf9a3e9bf3394301a0d148f53e55f0f97951" },
                cut: [1, 0, 10], // [100, 100, 75]
                delta: [params.width - 200, params.depth - 200, params.height - 150]
            } as ShapeNode,
            color: params.color,
            price: 1500 + (params.width * params.depth * 0.001)
        };
    };

    return (
        <div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
            <Lambda360Order params={params} lambda={lambda} />
        </div>
    );
}
