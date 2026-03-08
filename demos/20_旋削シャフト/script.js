const params = {
    diameter: { type: "number", label: "径",  unit: "mm", default: 20, constraint: { min: 5, max: 100, step: 5 } },
    length:   { type: "number", label: "長さ", unit: "mm", default: 200, constraint: { min: 50, max: 1000, step: 25 } },
    color:    { type: "color",  label: "色",  default: "#c8c8c8", constraint: { enum: ["#c8c8c8", "#888888"] } }
};

const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "shaft-base.step" },
        cut: [0, 0, params.length * 0.5],
        delta: [0, 0, params.length - 200]
    },
    color: params.color,
    price: 1000 + params.diameter * params.diameter * params.length * 0.0005
});
