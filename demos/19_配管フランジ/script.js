const params = {
    diameter:       { type: "number", label: "呼び径",   unit: "A",   default: 50, constraint: { enum: [15, 20, 25, 32, 40, 50, 65, 80, 100] } },
    pressure_class: { type: "number", label: "圧力クラス", unit: "MPa", default: 1.0, constraint: { enum: [1.0, 2.0, 5.0, 10.0] } },
    color:          { type: "color",  label: "色",       default: "#aaaaaa", constraint: { enum: ["#aaaaaa", "#888888"] } }
};

const lambda = (params) => ({
    shape: { op: "step", path: "flange-base.step" },
    color: params.color,
    price: 500 + params.diameter * 20 + params.pressure_class * 500
});
