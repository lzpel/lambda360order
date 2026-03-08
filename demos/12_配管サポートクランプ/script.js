const params = {
    pipe_diameter: { type: "number", label: "管外径", unit: "mm", default: 60.5, constraint: { enum: [27.2, 34.0, 42.7, 48.6, 60.5, 76.3, 101.6] } },
    width:         { type: "number", label: "幅",     unit: "mm", default: 80, constraint: { min: 40, max: 200, step: 20 } },
    color:         { type: "color",  label: "色",     default: "#888888", constraint: { enum: ["#888888", "#cc4400"] } }
};

const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "pipe-clamp-base.step" },
        cut: [params.width * 0.5, 0, 0],
        delta: [params.width - 80, 0, 0]
    },
    color: params.color,
    price: 400 + params.pipe_diameter * 15 + params.width * 5
});
