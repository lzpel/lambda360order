import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    width: NumberInput,
    depth: NumberInput,
    height: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    width: { type: "number", label: "幅", unit: "mm", value: 900, constraint: { enum: [600, 900, 1200, 1500, 1800] } } as NumberInput,
    depth: { type: "number", label: "奥行き", unit: "mm", value: 450, constraint: { enum: [300, 450, 600] } } as NumberInput,
    height: { type: "number", label: "高さ", unit: "mm", value: 1800, constraint: { enum: [1200, 1500, 1800, 2100, 2400] } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#888888", options: [
            { value: "#888888", label: "グレー" },
            { value: "#eeeeee", label: "ホワイト" },
            { value: "#224488", label: "ネイビー" },
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
                cut: [input.width.value * 0.5, input.depth.value * 0.5, input.height.value * 0.5],
                delta: [input.width.value - 900, input.depth.value - 450, input.height.value - 1800],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(5000 + input.width.value * 4 + input.depth.value * 5 + input.height.value * 3).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    width:  { type: "number", label: "幅",    unit: "mm", default: 900,  constraint: { enum: [600, 900, 1200, 1500, 1800] } },
    depth:  { type: "number", label: "奥行き", unit: "mm", default: 450,  constraint: { enum: [300, 450, 600] } },
    height: { type: "number", label: "高さ",   unit: "mm", default: 1800, constraint: { enum: [1200, 1500, 1800, 2100, 2400] } },
    color:  { type: "color",  label: "色",    default: "#888888", constraint: { enum: ["#888888", "#eeeeee", "#224488"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "rack-base.step" },
        cut: [params.width * 0.5, params.depth * 0.5, params.height * 0.5],
        delta: [params.width - 900, params.depth - 450, params.height - 1800]
    },
    color: params.color,
    price: 5000 + params.width * 4 + params.depth * 5 + params.height * 3
});
*/
