const params = {
    hole_spacing: { type: "number", label: "穴ピッチ", unit: "mm", default: 25, constraint: { enum: [25, 50] } },
    thickness:    { type: "number", label: "厚さ",     unit: "mm", default: 10, constraint: { enum: [5, 10, 15, 20] } },
    color:        { type: "color",  label: "色",       default: "#d4d4d4", constraint: { enum: ["#d4d4d4", "#222222"] } }
};

const lambda = (params) => ({
    shape: { op: "step", path: "adapter-base.step" },
    color: params.color,
    price: 2000 + params.thickness * 200
});
