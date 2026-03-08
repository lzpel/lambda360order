const params = {
    width:  { type: "number", label: "幅",  unit: "mm", default: 900,  constraint: { min: 600, max: 1800, step: 100 } },
    height: { type: "number", label: "高さ", unit: "mm", default: 1800, constraint: { min: 900, max: 2400, step: 100 } },
    color:  { type: "color",  label: "色",  default: "#c0c0c0", constraint: { enum: ["#c0c0c0", "#e8e8e8", "#4a4a4a"] } }
};

const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "frame-base.step" },
        cut: [params.width * 0.5, 0, params.height * 0.5],
        delta: [params.width - 900, 0, params.height - 1800]
    },
    color: params.color,
    price: 3000 + params.width * 5 + params.height * 3
});
