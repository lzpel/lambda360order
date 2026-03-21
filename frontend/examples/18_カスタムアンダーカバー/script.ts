import type { Input, Output } from '@/out/client';

export const input: Record<string, Input> = {
    width: { type: "number", label: "幅", unit: "mm", default: 800, constraint: { min: 400, max: 1600, step: 50 } },
    length: { type: "number", label: "長さ", unit: "mm", default: 600, constraint: { min: 300, max: 1200, step: 50 } },
    color: {
        type: "select", label: "色", default: "#333333", options: [
            { value: "#333333", label: "ダークグレー" },
            { value: "#888888", label: "グレー" },
        ]
    },
};

export const lambda = (input: Record<string, Input>): Output[] => [
    {
        type: "shape", shape: {
            op: "stretch",
            shape: { op: "step", content_hash: "" },
            cut: [params.width * 0.5, params.length * 0.5, 0],
            delta: [params.width - 800, params.length - 600, 0],
        }
    },
    { type: "message", messageType: "text", label: `価格: ¥${(3000 + params.width * 4 + params.length * 4).toLocaleString()}` },
];

/*
// 旧デモ (script.js より)
const params = {
    width:  { type: "number", label: "幅",  unit: "mm", default: 800, constraint: { min: 400, max: 1600, step: 50 } },
    length: { type: "number", label: "長さ", unit: "mm", default: 600, constraint: { min: 300, max: 1200, step: 50 } },
    color:  { type: "color",  label: "色",  default: "#333333", constraint: { enum: ["#333333", "#888888"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "undercover-base.step" },
        cut: [params.width * 0.5, params.length * 0.5, 0],
        delta: [params.width - 800, params.length - 600, 0]
    },
    color: params.color,
    price: 3000 + params.width * 4 + params.length * 4
});
*/
