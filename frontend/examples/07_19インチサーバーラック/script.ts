import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    units: NumberInput,
    depth: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    units: { type: "number", label: "ユニット数(U)", unit: "U", value: 12, constraint: { enum: [6, 9, 12, 18, 24, 42] } } as NumberInput,
    depth: { type: "number", label: "奥行き", unit: "mm", value: 600, constraint: { min: 450, max: 1000, step: 50 } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#222222", options: [
            { value: "#222222", label: "ブラック" },
            { value: "#eeeeee", label: "ホワイト" },
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
                cut: [0, input.depth.value * 0.5, input.units.value * 22.225 * 0.5],
                delta: [0, input.depth.value - 600, input.units.value * 22.225 - 12 * 22.225],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(15000 + input.units.value * 800 + input.depth.value * 10).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    units: { type: "number", label: "ユニット数(U)", unit: "U",  default: 12, constraint: { enum: [6, 9, 12, 18, 24, 42] } },
    depth: { type: "number", label: "奥行き",         unit: "mm", default: 600, constraint: { min: 450, max: 1000, step: 50 } },
    color: { type: "color",  label: "色",             default: "#222222", constraint: { enum: ["#222222", "#eeeeee"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "rack-base.step" },
        cut: [0, params.depth * 0.5, params.units * 22.225 * 0.5],
        delta: [0, params.depth - 600, params.units * 22.225 - 12 * 22.225]
    },
    color: params.color,
    price: 15000 + params.units * 800 + params.depth * 10
});
*/
