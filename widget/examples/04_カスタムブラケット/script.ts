import type { Input, Output } from '../../out/client';

export const params: Record<string, Input> = {
    width:     { type: "number", label: "幅",  unit: "mm", default: 60, constraint: { min: 30, max: 150, step: 10 } },
    thickness: { type: "number", label: "板厚", unit: "mm", default: 3,  constraint: { enum: [2, 3, 4, 6] } },
    color:     { type: "select", label: "色", default: "#888888", options: [
        { value: "#888888", label: "#888888" },
        { value: "#cccccc", label: "#cccccc" },
        { value: "#333333", label: "#333333" },
    ] },
};

export const lambda = (params: Record<string, any>): Output[] => [
    { type: "shape", shape: {
        op: "stretch",
        shape: { op: "step", content_hash: "" },
        cut: [params.width * 0.5, 0, 0],
        delta: [params.width - 60, 0, 0],
    }},
    { type: "message", messageType: "text", label: `価格: ¥${(500 + params.width * 8 + params.thickness * 50).toLocaleString()}` },
];

/*
// 旧デモ (script.js より)
const params = {
    width:     { type: "number", label: "幅",  unit: "mm", default: 60, constraint: { min: 30, max: 150, step: 10 } },
    thickness: { type: "number", label: "板厚", unit: "mm", default: 3,  constraint: { enum: [2, 3, 4, 6] } },
    color:     { type: "color",  label: "色",  default: "#888888", constraint: { enum: ["#888888", "#cccccc", "#333333"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "bracket-base.step" },
        cut: [params.width * 0.5, 0, 0],
        delta: [params.width - 60, 0, 0]
    },
    color: params.color,
    price: 500 + params.width * 8 + params.thickness * 50
});
*/
