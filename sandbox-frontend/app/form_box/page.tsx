"use client";

import Lambda360Form from 'lambda360form';
import type { Lambda360FormProps } from 'lambda360form';

type ShapeNode = Parameters<Lambda360FormProps['lambda']>[0] extends Record<string, any>
    ? ReturnType<Lambda360FormProps['lambda']>['shape']
    : never;

const params: Lambda360FormProps['params'] = {
    width:  { type: "number", label: "幅",   unit: "mm", default: 300, constraint: { min: 200, max: 600, step: 10 } },
    depth:  { type: "number", label: "奥行き", unit: "mm", default: 400, constraint: { min: 200, max: 800, step: 10 } },
    height: { type: "number", label: "高さ",  unit: "mm", default: 150, constraint: { enum: [100, 150, 200] } },
    color:  { type: "color",  label: "色",   default: "#cccccc", constraint: { enum: ["#cccccc", "#336699", "#993333"] } },
};

const lambda: Lambda360FormProps['lambda'] = (p) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", content_hash: "d6cb2eb2d6e0d802095ea1eda691cf9a3e9bf3394301a0d148f53e55f0f97951" },
        cut: [1, 0, 10],
        delta: [p.width - 200, p.depth - 200, p.height - 150],
    } as ShapeNode,
    color: p.color,
    price: 1500 + (p.width * p.depth * 0.001),
});

export default function FormBoxPage() {
    return (
        <div style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}>
            <Lambda360Form params={params} lambda={lambda} origin_url={'https://d3l2x153v6axn.cloudfront.net'} />
        </div>
    );
}
