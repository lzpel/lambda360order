const params = {
    wafer_size: { type: "number", label: "ウェーハ径", unit: "inch", default: 8, constraint: { enum: [6, 8, 12] } },
    slots:      { type: "number", label: "スロット数",  unit: "枚",   default: 25, constraint: { enum: [13, 25] } },
    color:      { type: "color",  label: "色",          default: "#e0e8f0", constraint: { enum: ["#e0e8f0", "#f0f0f0"] } }
};

const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "cassette-base.step" },
        cut: [0, 0, params.slots * 4.76 * 0.5],
        delta: [0, 0, (params.slots - 25) * 4.76]
    },
    color: params.color,
    price: 30000 + params.wafer_size * 5000 + params.slots * 200
});
