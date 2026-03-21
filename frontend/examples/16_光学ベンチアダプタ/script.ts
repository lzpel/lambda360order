import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    hole_spacing: NumberInput,
    thickness: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    hole_spacing: { type: "number", label: "穴ピッチ", unit: "mm", value: 25, constraint: { enum: [25, 50] } } as NumberInput,
    thickness: { type: "number", label: "厚さ", unit: "mm", value: 10, constraint: { enum: [5, 10, 15, 20] } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#d4d4d4", options: [
            { value: "#d4d4d4", label: "シルバー" },
            { value: "#222222", label: "ブラック" },
        ]
    } as SelectInput,
};

export const lambda = (params: Record<string, Input>): Output[] => {
    const input = params as unknown as InputSchema;
    return [
        { type: "shape", shape: { op: "step", content_hash: "" } },
        { type: "message", messageType: "text", label: `価格: ¥${(2000 + input.thickness.value * 200).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    hole_spacing: { type: "number", label: "穴ピッチ", unit: "mm", default: 25, constraint: { enum: [25, 50] } },
    thickness:    { type: "number", label: "厚さ",     unit: "mm", default: 10, constraint: { enum: [5, 10, 15, 20] } },
    color:        { type: "color",  label: "色",       default: "#d4d4d4", constraint: { enum: ["#d4d4d4", "#222222"] } }
};
const lambda = (params) => ({
    shape: { op: "step", path: "adapter-base.step" },
    color: params.color,
    price: 2000 + params.thickness * 200
});
*/
