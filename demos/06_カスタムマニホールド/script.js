const params = {
    ports:  { type: "number", label: "ポート数", unit: "個", default: 4, constraint: { enum: [2, 4, 6, 8] } },
    length: { type: "number", label: "全長",      unit: "mm", default: 160, constraint: { min: 80, max: 400, step: 40 } },
    color:  { type: "color",  label: "色",        default: "#b0b0b0", constraint: { enum: ["#b0b0b0", "#888888"] } }
};

const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "manifold-base.step" },
        cut: [80, 0, 0],
        delta: [params.length - 160, 0, 0]
    },
    color: params.color,
    price: 8000 + params.ports * 1500 + params.length * 20
});
