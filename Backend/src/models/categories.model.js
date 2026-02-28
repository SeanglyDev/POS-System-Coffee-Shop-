const mongoose = require("mongoose");
const categoriesSchema = new mongoose.Schema(
    {
        categoriesName: { type: String, required: true, trim: true, unique: true },
        status: { type: Boolean, default: true },
        description: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("category", categoriesSchema);
