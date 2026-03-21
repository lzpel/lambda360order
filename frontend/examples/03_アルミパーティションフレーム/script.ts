import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    width: NumberInput,
    height: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    width: { type: "number", label: "幅", unit: "mm", value: 900, constraint: { min: 600, max: 1800, step: 100 } } as NumberInput,
    height: { type: "number", label: "高さ", unit: "mm", value: 1800, constraint: { min: 900, max: 2400, step: 100 } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#c0c0c0", options: [
            { value: "#c0c0c0", label: "シルバー" },
            { value: "#e8e8e8", label: "ホワイト" },
            { value: "#4a4a4a", label: "ダークグレー" },
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
                cut: [input.width.value * 0.5, 0, input.height.value * 0.5],
                delta: [input.width.value - 900, 0, input.height.value - 1800],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(3000 + input.width.value * 5 + input.height.value * 3).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    width:  { type: "number", label: "幅",  unit: "mm", default: 900,  constraint: { min: 600, max: 1800, step: 100 } },
    height: { type: "number", label: "高さ", unit: "mm", default: 1800, constraint: { min: 900, max: 2400, step: 100 } },
    color:  { type: "color",  label: "色",  default: "#c0c0c0", constraint: { enum: ["#c0c0c0", "#e8e8e8", "#4a4a4a"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "frame-base.step" },
        cut: [params.width * 0.5, 0, params.height * 0.5],
        delta: [params.width - 900, 0, params.height - 1800]
    },
    color: params.color,
    price: 3000 + params.width * 5 + params.height * 3
});
*/
