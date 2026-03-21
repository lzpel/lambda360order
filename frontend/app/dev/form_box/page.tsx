"use client";

import Lambda360Form from '@widget/Lambda360Form';
import type { NumberInput, SelectInput, Input, Output } from '@widget/Lambda360Form';

const input: Record<string, Input> = {
	width:  { type: "number", label: "幅",    unit: "mm", value: 300, default: 300, constraint: { min: 200, max: 600, step: 10 } } as NumberInput,
	depth:  { type: "number", label: "奥行き", unit: "mm", value: 400, default: 400, constraint: { min: 200, max: 800, step: 10 } } as NumberInput,
	height: { type: "number", label: "高さ",  unit: "mm", value: 150, default: 150, constraint: { enum: [100, 150, 200] } } as NumberInput,
	color:  { type: "select", label: "色",    value: "#cccccc", default: "#cccccc", options: [
		{ value: "#cccccc", label: "シルバー" },
		{ value: "#336699", label: "ネイビー" },
		{ value: "#993333", label: "ワイン" },
	]} as SelectInput,
};

const lambda = (input: Record<string, Input>): Output[] => {
	const width  = input.width  as unknown as number;
	const depth  = input.depth  as unknown as number;
	const height = input.height as unknown as number;
	const price = 1500 + (width * depth * 0.001);
	return [
		{
			type: "shape",
			label: "プレビュー",
			shape: {
				op: "stretch",
				shape: { op: "step", content_hash: "d6cb2eb2d6e0d802095ea1eda691cf9a3e9bf3394301a0d148f53e55f0f97951" },
				cut: [1, 0, 10],
				delta: [width - 200, depth - 200, height - 150],
			},
		},
		{ type: "border" },
		{
			type: "message",
			label: `参考価格: ¥${price.toLocaleString()}`,
			messageType: "info",
		},
		...(width > 500 && height > 180 ? [{
			type: "message" as const,
			label: "幅500mm超かつ高さ180mm超の組み合わせは製造不可です",
			messageType: "error" as const,
		}] : []),
		{
			type: "action",
			label: "見積もりを送信",
			subject: "板金加工の見積もりが発行されました",
			email_to: ["citygirlstat00@gmail.com"],
			email_bcc: [],
			slack: ["#orders"],
		},
	];
};

export default function FormBoxPage() {
	return (
		<div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
			<Lambda360Form input={input} lambda={lambda} />
		</div>
	);
}
