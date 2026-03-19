import type { Input, Output } from '@/out/client';

export const params: Record<string, Input> = {
    width: { type: "number", label: "幅",    unit: "mm", default: 1500, constraint: { min: 800, max: 2400, step: 100 } },
    reach: { type: "number", label: "リーチ", unit: "mm", default: 600,  constraint: { min: 300, max: 1200, step: 100 } },
    color: { type: "select", label: "色", default: "#ff8800", options: [
        { value: "#ff8800", label: "オレンジ" },
        { value: "#228800", label: "グリーン" },
        { value: "#cc2200", label: "レッド" },
    ] },
};

export const lambda = (params: Record<string, any>): Output[] => [
    { type: "shape", shape: {
        op: "stretch",
        shape: { op: "step", content_hash: "" },
        cut: [params.width * 0.5, params.reach * 0.5, 0],
        delta: [params.width - 1500, params.reach - 600, 0],
    }},
    { type: "message", messageType: "text", label: `価格: ¥${(50000 + params.width * 30 + params.reach * 20).toLocaleString()}` },
];

/*
// 旧デモ (script.js より)
const params = {
    width: { type: "number", label: "幅",    unit: "mm", default: 1500, constraint: { min: 800, max: 2400, step: 100 } },
    reach: { type: "number", label: "リーチ", unit: "mm", default: 600,  constraint: { min: 300, max: 1200, step: 100 } },
    color: { type: "color",  label: "色",    default: "#ff8800", constraint: { enum: ["#ff8800", "#228800", "#cc2200"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "attachment-base.step" },
        cut: [params.width * 0.5, params.reach * 0.5, 0],
        delta: [params.width - 1500, params.reach - 600, 0]
    },
    color: params.color,
    price: 50000 + params.width * 30 + params.reach * 20
});
*/
