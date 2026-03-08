const params = {
    width:     { type: "number", label: "幅",  unit: "mm", default: 1200, constraint: { min: 600, max: 2400, step: 100 } },
    length:    { type: "number", label: "長さ", unit: "mm", default: 3000, constraint: { min: 1000, max: 6000, step: 500 } },
    thickness: { type: "number", label: "厚さ", unit: "mm", default: 150,  constraint: { enum: [100, 150, 200] } }
};

const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "precast-base.step" },
        cut: [params.width * 0.5, params.length * 0.5, 0],
        delta: [params.width - 1200, params.length - 3000, 0]
    },
    color: "#c8c0b0",
    price: params.width * params.length * params.thickness * 0.0002
});
