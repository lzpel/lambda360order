import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    ports: NumberInput,
    length: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    ports: { type: "number", label: "ポート数", unit: "個", value: 4, constraint: { enum: [2, 4, 6, 8] } } as NumberInput,
    length: { type: "number", label: "全長", unit: "mm", value: 160, constraint: { min: 80, max: 400, step: 40 } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#b0b0b0", options: [
            { value: "#b0b0b0", label: "ライトグレー" },
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
                cut: [80, 0, 0],
                delta: [input.length.value - 160, 0, 0],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(8000 + input.ports.value * 1500 + input.length.value * 20).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    ports:  { type: "number", label: "ポート数", unit: "個", default: 4, constraint: { enum: [2, 4, 6, 8] } },
    length: { type: "number", label: "全長",      unit: "mm", default: 160, constraint: { min: 80, max: 400, step: 40 } },
    color:  { type: "color",  label: "色",        default: "#b0b0b0", constraint: { enum: ["#b0b0b0", "#888888"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "manifold-base.step" },
        cut: [80, 0, 0],
        delta: [params.length - 160, 0, 0]
    },
    color: params.color,
    price: 8000 + params.ports * 1500 + params.length * 20
});
*/
