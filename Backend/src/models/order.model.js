const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "products"
                },
                productName: String,
                qty: Number,
                price: Number,
                total: Number
            }
        ],
        totalAmount: Number,
        orderStatus: {
            type: String,
            enum: ["Pending", "Confirmed", "Completed", "Cancelled", "Failed"],
            default: "Pending"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("orders", orderSchema);
