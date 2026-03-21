import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    angle: NumberInput,
    thickness: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    angle: { type: "number", label: "角度", unit: "°", value: 90, constraint: { enum: [45, 60, 90, 135] } } as NumberInput,
    thickness: { type: "number", label: "板厚", unit: "mm", value: 5, constraint: { enum: [3, 4, 5, 6, 8] } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#888888", options: [
            { value: "#888888", label: "グレー" },
            { value: "#c0c0c0", label: "シルバー" },
            { value: "#4a4a4a", label: "ダークグレー" },
        ]
    } as SelectInput,
};

export const lambda = (params: Record<string, Input>): Output[] => {
    const input = params as unknown as InputSchema;
    return [
        { type: "shape", shape: { op: "step", content_hash: "" } },
        { type: "message", messageType: "text", label: `価格: ¥${(300 + input.thickness.value * 80).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    angle:     { type: "number", label: "角度", unit: "°",  default: 90, constraint: { enum: [45, 60, 90, 135] } },
    thickness: { type: "number", label: "板厚", unit: "mm", default: 5,  constraint: { enum: [3, 4, 5, 6, 8] } },
    color:     { type: "color",  label: "色",   default: "#888888", constraint: { enum: ["#888888", "#c0c0c0", "#4a4a4a"] } }
};
const lambda = (params) => ({
    shape: { op: "step", path: "fitting-base.step" },
    color: params.color,
    price: 300 + params.thickness * 80
});
*/
