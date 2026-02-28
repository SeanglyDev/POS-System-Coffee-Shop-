const mongoose = require("mongoose");
const stockSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "products", required: true },
        quantity: { type: Number, required: true },
        type: { type: String, enum: ["IN", "OUT"], }, // stock in or out required: true 
        note: { type: String, trim: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Stock", stockSchema);