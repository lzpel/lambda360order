import type { Input, NumberInput, SelectInput, Output } from '@widget/Lambda360Form';

type InputSchema = {
    diameter: NumberInput,
    length: NumberInput,
    color: SelectInput,
}
export const input: InputSchema = {
    diameter: { type: "number", label: "内径", unit: "mm", value: 20, constraint: { min: 10, max: 100, step: 5 } },
    length: { type: "number", label: "長さ", unit: "mm", value: 30, constraint: { min: 10, max: 200, step: 5 } },
    color: {
        type: "select", label: "色", value: "#aaaaaa", options: [
            { value: "#aaaaaa", label: "ライトグレー" },
            { value: "#222222", label: "ブラック" },
            { value: "#ccaa00", label: "ゴールド" },
        ]
    },
};

export const lambda = (input: InputSchema): Output[] => [
    {
        type: "shape", shape: {
            op: "stretch",
            shape: { op: "step", content_hash: "" },
            cut: [0, 0, input.length.value * 0.5],
            delta: [0, 0, input.length.value - 30],
        }
    },
    { type: "message", messageType: "text", label: `価格: ¥${(800 + input.diameter.value * 20).toLocaleString()}` },
];

/*
// 旧デモ (script.js より)
const params = {
    diameter: { type: "number", label: "内径", unit: "mm", default: 20, constraint: { min: 10, max: 100, step: 5 } },
    length:   { type: "number", label: "長さ",  unit: "mm", default: 30, constraint: { min: 10, max: 200, step: 5 } },
    color:    { type: "color",  label: "色",    default: "#aaaaaa", constraint: { enum: ["#aaaaaa", "#222222", "#ccaa00"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "collar-base.step" },
        cut: [0, 0, params.length * 0.5],
        delta: [0, 0, params.length - 30]
    },
    color: params.color,
    price: 800 + params.diameter * 20
});
*/
