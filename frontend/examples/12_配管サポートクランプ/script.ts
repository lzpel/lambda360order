import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    pipe_diameter: NumberInput,
    width: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    pipe_diameter: { type: "number", label: "管外径", unit: "mm", value: 60.5, constraint: { enum: [27.2, 34.0, 42.7, 48.6, 60.5, 76.3, 101.6] } } as NumberInput,
    width: { type: "number", label: "幅", unit: "mm", value: 80, constraint: { min: 40, max: 200, step: 20 } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#888888", options: [
            { value: "#888888", label: "グレー" },
            { value: "#cc4400", label: "オレンジ" },
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
                cut: [input.width.value * 0.5, 0, 0],
                delta: [input.width.value - 80, 0, 0],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(400 + input.pipe_diameter.value * 15 + input.width.value * 5).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    pipe_diameter: { type: "number", label: "管外径", unit: "mm", default: 60.5, constraint: { enum: [27.2, 34.0, 42.7, 48.6, 60.5, 76.3, 101.6] } },
    width:         { type: "number", label: "幅",     unit: "mm", default: 80, constraint: { min: 40, max: 200, step: 20 } },
    color:         { type: "color",  label: "色",     default: "#888888", constraint: { enum: ["#888888", "#cc4400"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "pipe-clamp-base.step" },
        cut: [params.width * 0.5, 0, 0],
        delta: [params.width - 80, 0, 0]
    },
    color: params.color,
    price: 400 + params.pipe_diameter * 15 + params.width * 5
});
*/
