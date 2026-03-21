import type { Input, NumberInput, SelectInput, TextInput, Output } from '@/out/client';

type InputSchema = {
	width: NumberInput,
	depth: NumberInput,
	height: NumberInput,
	color: SelectInput,
	email: TextInput,
}

export const input: InputSchema = {
	width: { type: "number", label: "幅", unit: "mm", value: 310, constraint: { min: 310, max: 600, step: 10 } } as NumberInput,
	depth: { type: "number", label: "奥行き", unit: "mm", value: 430, constraint: { min: 430, max: 800, step: 10 } } as NumberInput,
	height: { type: "number", label: "高さ", unit: "mm", value: 150, constraint: { enum: [100, 150, 200, 2000] } } as NumberInput,
	color: {
		type: "select", label: "色", value: "#cccccc", options: [
			{ value: "#cccccc", label: "シルバー" },
			{ value: "#336699", label: "ネイビー" },
			{ value: "#993333", label: "ワインレッド" },
		]
	} as SelectInput,
	email: { type: "text", label: "メールアドレス", variant: "email", placeholder: "example@example.com", value: "" } as TextInput,
};

export const lambda = (params: Record<string, Input>): Output[] => {
	const input: InputSchema = params as InputSchema;
	const delta = [
		input.depth.value - 430, 
		input.height.value - 75,
		input.width.value - 302.2
	];
	return [
		{
			type: "shape",
			axisUp: "Y",
			//axisCenter: ["X", "Z"],
			shape: {
				op: "stretch",
				shape: { op: "step", content_hash: "c648cc3352136f4db46d0cbe133b6cf5bf9d208889186d0138ad9d671da72484" },
				cut: [100, 10, -100],
				delta: delta//[params.width - 200, params.height - 100, params.depth - 200],
			},
			annotations: [
				{
					type: "distance",
					start: [-input.depth.value / 4, input.height.value, 0],
					end: [-input.depth.value / 4, input.height.value, -input.width.value],
					label: `幅 ${input.width.value}mm`,
				},
				{
					type: "distance",
					start: [0, input.height.value, input.width.value / 4],
					end: [input.depth.value, input.height.value, input.width.value / 4],
					label: `奥行き ${input.depth.value}mm`,
				},
				{
					type: "distance",
					start: [-input.depth.value / 4, 0, input.width.value / 4],
					end: [-input.depth.value / 4, input.height.value, input.width.value / 4],
					label: `高さ ${input.height.value}mm`,
				},
			],
		},
		{ type: "message", messageType: "text", label: `価格: ¥${(5000 + input.width.value * 10).toLocaleString()}` },
		{
			type: "action", 
			subject: "01_板金制御盤ボックス 見積もり送信",
			label: "見積もりを送信", 
			email_to: [input.email.value],
			email_bcc: [],
			slack: [],
			disable: input.email.value ? false : "メールアドレスを入力してください"
		},
	];
}
/*
// 旧デモ (script.js より)
const params = {
	width: { type: "number", label: "幅", unit: "mm", default: 300, constraint: { min: 200, max: 600, step: 10 } },
	depth: { type: "number", label: "奥行き", unit: "mm", default: 400, constraint: { min: 200, max: 800, step: 10 } },
	height: { type: "number", label: "高さ", unit: "mm", default: 150, constraint: { enum: [100, 150, 200] } },
	color: { type: "color", label: "色", default: "#cccccc", constraint: { enum: ["#cccccc", "#336699", "#993333"] } }
};
const lambda = (params) => {
	return {
		shape: {
			op: "stretch",
			shape: { op: "step", content_hash: "c648cc3352136f4db46d0cbe133b6cf5bf9d208889186d0138ad9d671da72484" },
			cut: [100, 100, 75],
			delta: [params.width - 200, params.depth - 200, params.height - 150]
		},
		color: params.color,
		price: 5000 + (params.width * 10)
	};
};
*/
