const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "orders",
            required: true
        },
        invoiceNumber: {
            type: String,
            required: true
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "QR Bank", "ABA", "Wing", "Visa", "Card"],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending"
        },
        transactionId: {
            type: String // from payment gateway
        },
        paidAt: {
            type: Date
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
