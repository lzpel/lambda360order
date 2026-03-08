const params = {
    angle:     { type: "number", label: "角度", unit: "°",  default: 90, constraint: { enum: [45, 60, 90, 135] } },
    thickness: { type: "number", label: "板厚", unit: "mm", default: 5,  constraint: { enum: [3, 4, 5, 6, 8] } },
    color:     { type: "color",  label: "色",   default: "#888888", constraint: { enum: ["#888888", "#c0c0c0", "#4a4a4a"] } }
};

const lambda = (params) => ({
    shape: { op: "step", path: "fitting-base.step" },
    color: params.color,
    price: 300 + params.thickness * 80
});
