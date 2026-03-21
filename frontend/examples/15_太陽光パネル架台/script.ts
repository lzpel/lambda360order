import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    tilt: NumberInput,
    width: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    tilt: { type: "number", label: "傾斜角", unit: "°", value: 15, constraint: { enum: [10, 15, 20, 25, 30] } } as NumberInput,
    width: { type: "number", label: "幅", unit: "mm", value: 1000, constraint: { min: 800, max: 2000, step: 100 } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#aaaaaa", options: [
            { value: "#aaaaaa", label: "ライトグレー" },
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
                cut: [input.width.value * 0.5, 0, 0],
                delta: [input.width.value - 1000, 0, 0],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(4000 + input.width.value * 5 + input.tilt.value * 100).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    tilt:  { type: "number", label: "傾斜角", unit: "°",  default: 15, constraint: { enum: [10, 15, 20, 25, 30] } },
    width: { type: "number", label: "幅",      unit: "mm", default: 1000, constraint: { min: 800, max: 2000, step: 100 } },
    color: { type: "color",  label: "色",      default: "#aaaaaa", constraint: { enum: ["#aaaaaa", "#888888"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "mount-base.step" },
        cut: [params.width * 0.5, 0, 0],
        delta: [params.width - 1000, 0, 0]
    },
    color: params.color,
    price: 4000 + params.width * 5 + params.tilt * 100
});
*/
