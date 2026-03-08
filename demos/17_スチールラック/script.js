const params = {
    width:  { type: "number", label: "幅",    unit: "mm", default: 900,  constraint: { enum: [600, 900, 1200, 1500, 1800] } },
    depth:  { type: "number", label: "奥行き", unit: "mm", default: 450,  constraint: { enum: [300, 450, 600] } },
    height: { type: "number", label: "高さ",   unit: "mm", default: 1800, constraint: { enum: [1200, 1500, 1800, 2100, 2400] } },
    color:  { type: "color",  label: "色",    default: "#888888", constraint: { enum: ["#888888", "#eeeeee", "#224488"] } }
};

const lambda = (params) => ({
    shape: {
        op: "stretch",
        shape: { op: "step", path: "rack-base.step" },
        cut: [params.width * 0.5, params.depth * 0.5, params.height * 0.5],
        delta: [params.width - 900, params.depth - 450, params.height - 1800]
    },
    color: params.color,
    price: 5000 + params.width * 4 + params.depth * 5 + params.height * 3
});
