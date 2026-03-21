import type { Input, NumberInput, SelectInput, Output } from '@/out/client';

type InputSchema = {
    width: NumberInput,
    length: NumberInput,
    color: SelectInput,
}

export const input: InputSchema = {
    width: { type: "number", label: "幅", unit: "mm", value: 200, constraint: { enum: [100, 150, 200, 300, 400, 600] } } as NumberInput,
    length: { type: "number", label: "長さ", unit: "mm", value: 2000, constraint: { min: 500, max: 3000, step: 500 } } as NumberInput,
    color: {
        type: "select", label: "色", value: "#bbbbbb", options: [
            { value: "#bbbbbb", label: "ライトグレー" },
            { value: "#888888", label: "グレー" },
            { value: "#ffcc00", label: "イエロー" },
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
                cut: [input.width.value * 0.5, input.length.value * 0.5, 0],
                delta: [input.width.value - 200, input.length.value - 2000, 0],
            }
        },
        { type: "message", messageType: "text", label: `価格: ¥${(1500 + input.width.value * 3 + input.length.value * 1).toLocaleString()}` },
    ];
};

/*
// 旧デモ (script.js より)
const params = {
    width:  { type: "number", label: "幅",  unit: "mm", default: 200, constraint: { enum: [100, 150, 200, 300, 400, 600] } },
    length: { type: "number", label: "長さ", unit: "mm", default: 2000, constraint: { min: 500, max: 3000, step: 500 } },
    color:  { type: "color",  label: "色",  default: "#bbbbbb", constraint: { enum: ["#bbbbbb", "#888888", "#ffcc00"] } }
};
const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "tray-base.step" },
        cut: [params.width * 0.5, params.length * 0.5, 0],
        delta: [params.width - 200, params.length - 2000, 0]
    },
    color: params.color,
    price: 1500 + params.width * 3 + params.length * 1
});
*/
