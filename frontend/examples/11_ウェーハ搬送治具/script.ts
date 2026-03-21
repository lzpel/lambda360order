import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    wafer_size: NumberInput,
    slots: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    wafer_size: { type: "number", label: "ウェーハ径", unit: "inch", value: 8, constraint: { enum: [6, 8, 12] } } as NumberInput,
    slots: { type: "number", label: "スロット数", unit: "枚", value: 25, constraint: { enum: [13, 25] } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#e0e8f0", options: [
            { value: "#e0e8f0", label: "アイスブルー" },
            { value: "#f0f0f0", label: "ホワイト" },
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
                cut: [0, 0, input.slots.value * 4.76 * 0.5],
                delta: [0, 0, (input.slots.value - 25) * 4.76],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(30000 + input.wafer_size.value * 5000 + input.slots.value * 200).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    wafer_size: { type: "number", label: "ウェーハ径", unit: "inch", default: 8, constraint: { enum: [6, 8, 12] } },
    slots:      { type: "number", label: "スロット数",  unit: "枚",   default: 25, constraint: { enum: [13, 25] } },
    color:      { type: "color",  label: "色",          default: "#e0e8f0", constraint: { enum: ["#e0e8f0", "#f0f0f0"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "cassette-base.step" },
        cut: [0, 0, params.slots * 4.76 * 0.5],
        delta: [0, 0, (params.slots - 25) * 4.76]
    },
    color: params.color,
    price: 30000 + params.wafer_size * 5000 + params.slots * 200
});
*/
