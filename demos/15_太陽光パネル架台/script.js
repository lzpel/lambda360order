const params = {
    tilt:  { type: "number", label: "傾斜角", unit: "°",  default: 15, constraint: { enum: [10, 15, 20, 25, 30] } },
    width: { type: "number", label: "幅",      unit: "mm", default: 1000, constraint: { min: 800, max: 2000, step: 100 } },
    color: { type: "color",  label: "色",      default: "#aaaaaa", constraint: { enum: ["#aaaaaa", "#888888"] } }
};

const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "mount-base.step" },
        cut: [params.width * 0.5, 0, 0],
        delta: [params.width - 1000, 0, 0]
    },
    color: params.color,
    price: 4000 + params.width * 5 + params.tilt * 100
});
