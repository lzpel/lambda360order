const params = {
    diameter: { type: "number", label: "対応管径", unit: "mm", default: 48.6, constraint: { enum: [34.0, 42.7, 48.6, 60.5] } },
    color:    { type: "color",  label: "色",       default: "#cc4400", constraint: { enum: ["#cc4400", "#888888", "#ffcc00"] } }
};

const lambda = (params) => ({
    shape: { op: "step", path: "clamp-base.step" },
    color: params.color,
    price: 600 + params.diameter * 10
});
