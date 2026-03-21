import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    width: NumberInput,
    length: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    width: { type: "number", label: "幅", unit: "mm", value: 800, constraint: { min: 400, max: 1600, step: 50 } } as NumberInput,
    length: { type: "number", label: "長さ", unit: "mm", value: 600, constraint: { min: 300, max: 1200, step: 50 } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#333333", options: [
            { value: "#333333", label: "ダークグレー" },
            { value: "#888888", label: "グレー" },
        ]
    } as SelectInput,
};

export const lambda = (params: Record<string, Input>): Output[] => {
    const input = params as unknown as InputSchema;
    return [
        {
            type: "shape", shape: {
                op: "stretch",
                shape: { op: "step", content_hash: "" },
                cut: [input.width.value * 0.5, input.length.value * 0.5, 0],
                delta: [input.width.value - 800, input.length.value - 600, 0],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(3000 + input.width.value * 4 + input.length.value * 4).toLocaleString()}` },
    ];
};

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
