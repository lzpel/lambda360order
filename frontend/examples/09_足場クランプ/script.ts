import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    diameter: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    diameter: { type: "number", label: "対応管径", unit: "mm", value: 48.6, constraint: { enum: [34.0, 42.7, 48.6, 60.5] } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#cc4400", options: [
            { value: "#cc4400", label: "オレンジ" },
            { value: "#888888", label: "グレー" },
            { value: "#ffcc00", label: "イエロー" },
        ]
    } as SelectInput,
};

export const lambda = (params: Record<string, Input>): Output[] => {
    const input = params as unknown as InputSchema;
    return [
        { type: "shape", shape: { op: "step", content_hash: "" } },
        { type: "message", messageType: "text", label: `価格: ¥${(600 + input.diameter.value * 10).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    diameter: { type: "number", label: "対応管径", unit: "mm", default: 48.6, constraint: { enum: [34.0, 42.7, 48.6, 60.5] } },
    color:    { type: "color",  label: "色",       default: "#cc4400", constraint: { enum: ["#cc4400", "#888888", "#ffcc00"] } }
};
const lambda = (params) => ({
    shape: { op: "step", path: "clamp-base.step" },
    color: params.color,
    price: 600 + params.diameter * 10
});
*/
