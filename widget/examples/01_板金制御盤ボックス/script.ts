import type { Input, Output } from '../../out/client';

export const params: Record<string, Input> = {
	width:  { type: "number", label: "幅",	unit: "mm", default: 300, constraint: { min: 200, max: 600, step: 10 } },
	depth:  { type: "number", label: "奥行き", unit: "mm", default: 400, constraint: { min: 200, max: 800, step: 10 } },
	height: { type: "number", label: "高さ",   unit: "mm", default: 150, constraint: { enum: [100, 150, 200] } },
	color:  { type: "select", label: "色", default: "#cccccc", options: [
		{ value: "#cccccc", label: "#cccccc" },
		{ value: "#336699", label: "#336699" },
		{ value: "#993333", label: "#993333" },
	] },
	email:  { type: "text", label: "メールアドレス", variant: "email", placeholder: "example@example.com" },
};

export const lambda = (params: Record<string, any>): Output[] => [
	{ 
        type: "shape",
        axisUp: "Z",
        shape: {
            op: "stretch",
            shape: { op: "step", content_hash: "c648cc3352136f4db46d0cbe133b6cf5bf9d208889186d0138ad9d671da72484" },
            cut: [100, 100, 75],
            delta: [params.width - 200, params.depth - 200, params.height - 150],
        },
    },
	{ type: "message", messageType: "text", label: `価格: ¥${(5000 + params.width * 10).toLocaleString()}` },
	{ type: "action", label: "見積もりを送信", email_to: [params.email], email_bcc: [], slack: [],
	  disable: params.email ? false : "メールアドレスを入力してください" },
];

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
