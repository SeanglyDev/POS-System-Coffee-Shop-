const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
    {
        image_URL: { type: String, required: true },
        productName: { type: String, required: true, trim: true },
        categories: { type: mongoose.Schema.Types.ObjectId, ref: "category", default: null },
        price: { type: Number, required: true, min: 0 },
        stock: { type: Number, default: 0, min: 0 },
        totalPriceAllStock: { type: Number, default: 0 },
        description: { type: String, trim: true },
        status: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// auto calculate total price
productSchema.pre("save", function () {
    this.totalPriceAllStock = this.price * this.stock;
});

module.exports = mongoose.model("products", productSchema);
