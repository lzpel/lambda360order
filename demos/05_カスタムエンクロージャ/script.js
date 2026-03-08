const params = {
    width:  { type: "number", label: "幅",    unit: "mm", default: 200, constraint: { min: 100, max: 500, step: 20 } },
    depth:  { type: "number", label: "奥行き", unit: "mm", default: 150, constraint: { min: 80,  max: 400, step: 20 } },
    height: { type: "number", label: "高さ",   unit: "mm", default: 100, constraint: { min: 50,  max: 300, step: 20 } },
    color:  { type: "color",  label: "色",     default: "#dddddd", constraint: { enum: ["#dddddd", "#1a1a1a", "#336699"] } }
};

const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "enclosure-base.step" },
        cut: [100, 75, 50],
        delta: [params.width - 200, params.depth - 150, params.height - 100]
    },
    color: params.color,
    price: 2000 + params.width * 8 + params.depth * 6 + params.height * 5
});
