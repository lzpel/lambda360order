"use client";

import Lambda360Order, { OrderConfig } from '@widget/Lambda360Order';

export default function Order1Page() {
    const orderConfig: OrderConfig = {
        params: {
            width: { type: "number", label: "幅", unit: "mm", default: 300, constraint: { min: 200, max: 600, step: 10 } },
            depth: { type: "number", label: "奥行き", unit: "mm", default: 400, constraint: { min: 200, max: 800, step: 10 } },
            height: { type: "number", label: "高さ", unit: "mm", default: 150, constraint: { enum: [100, 150, 200] } },
            color: { type: "color", label: "色", default: "#cccccc", constraint: { enum: ["#cccccc", "#336699", "#993333"] } }
        },
        shape: {
            op: "subtract",
            a: {
                op: "stretch",
                shape: { op: "step", content_hash: "d6cb2eb2d6e0d802095ea1eda691cf9a3e9bf3394301a0d148f53e55f0f97951" },
                cut: [100, 100, 75],
                delta: ["$width - 200", "$depth - 200", "$height - 150"]
            },
            b: {
                op: "translate",
                shape: { op: "step", content_hash: "bd405c4e4cd565154134b09ed3dc350bec22d1dac86d98b390a1803a485d146b" },
                xyz: ["$width * 0.5", "$depth - 20", 0]
            }
        },
        color: "$color"
    };

    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
            <Lambda360Order order={orderConfig} />
        </div>
    );
}
