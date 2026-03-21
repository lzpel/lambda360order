import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    width: NumberInput,
    depth: NumberInput,
    height: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    width: { type: "number", label: "幅", unit: "mm", value: 200, constraint: { min: 100, max: 500, step: 20 } } as NumberInput,
    depth: { type: "number", label: "奥行き", unit: "mm", value: 150, constraint: { min: 80, max: 400, step: 20 } } as NumberInput,
    height: { type: "number", label: "高さ", unit: "mm", value: 100, constraint: { min: 50, max: 300, step: 20 } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#dddddd", options: [
            { value: "#dddddd", label: "ホワイト" },
            { value: "#1a1a1a", label: "ブラック" },
            { value: "#336699", label: "ネイビー" },
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
                cut: [100, 75, 50],
                delta: [input.width.value - 200, input.depth.value - 150, input.height.value - 100],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(2000 + input.width.value * 8 + input.depth.value * 6 + input.height.value * 5).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    width:  { type: "number", label: "幅",    unit: "mm", default: 200, constraint: { min: 100, max: 500, step: 20 } },
    depth:  { type: "number", label: "奥行き", unit: "mm", default: 150, constraint: { min: 80,  max: 400, step: 20 } },
    height: { type: "number", label: "高さ",   unit: "mm", default: 100, constraint: { min: 50,  max: 300, step: 20 } },
    color:  { type: "color",  label: "色",     default: "#dddddd", constraint: { enum: ["#dddddd", "#1a1a1a", "#336699"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "enclosure-base.step" },
        cut: [100, 75, 50],
        delta: [params.width - 200, params.depth - 150, params.height - 100]
    },
    color: params.color,
    price: 2000 + params.width * 8 + params.depth * 6 + params.height * 5
});
*/
