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
