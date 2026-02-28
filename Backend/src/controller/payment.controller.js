const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Stock = require("../models/stock.model");
const { sendTelegramMessage } = require("../config/telegram");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizePaymentMethod = (value = "") => {
    const method = String(value).trim().toLowerCase();

    if (method === "cash") return "Cash";

    if (["qr bank", "qr_bank", "qrbank", "aba", "wing", "visa", "card"].includes(method)) {
        return "QR Bank";
    }

    return null;
};

const isTransactionNotSupportedError = (error) => {
    const message = String(error?.message || "");
    return error?.code === 20 || message.includes("Transaction numbers are only allowed");
};

const normalizeOrderStatus = (value = "") => String(value).trim().toLowerCase();

const isOrderPayable = (orderStatus) => {
    const status = normalizeOrderStatus(orderStatus);
    return status === "pending" || status === "confirmed";
};
const markOrderStatusFailed = async (orderId) => {
    if (!isValidObjectId(orderId)) {
        return;
    }
    const order = await Order.findById(orderId);
    if (!order) {
        return;
    }
    const current = normalizeOrderStatus(order.orderStatus);
    if (current === "pending" || current === "confirmed") {
        order.orderStatus = "Failed";
        await order.save();
    }
};

const processPaymentCore = async ({ orderId, normalizedPaymentMethod, session = null }) => {
    const withSession = (query) => (session ? query.session(session) : query);

    const order = await withSession(Order.findById(orderId));
    if (!order) {
        throw new Error("Order not found");
    }
    if (normalizeOrderStatus(order.orderStatus) === "failed") {
        throw new Error("Order status Failed cannot be paid");
    }
    if (!isOrderPayable(order.orderStatus)) {
        throw new Error(`Order status ${order.orderStatus} cannot be paid`);
    }

    const existingPayment = await withSession(Payment.findOne({ order: orderId }));
    if (existingPayment) {
        throw new Error("Payment already completed for this order");
    }

    const productsToUpdate = [];
    for (const item of order.items) {
        const product = await withSession(Product.findById(item.product));
        if (!product) {
            throw new Error(`Product not found: ${item.product}`);
        }
        if (product.stock < item.qty) {
            throw new Error(`Insufficient stock for ${product.productName}`);
        }
        productsToUpdate.push({ product, qty: item.qty });
    }

    const createdPayments = await Payment.create([{
        order: order._id,
        invoiceNumber: order.invoiceNumber,
        paymentMethod: normalizedPaymentMethod,
        amount: order.totalAmount,
        paymentStatus: "Paid",
        paidAt: new Date()
    }], session ? { session } : undefined);
    const payment = createdPayments[0];

    order.orderStatus = "Confirmed";
    await order.save(session ? { session } : undefined);

    for (const { product, qty } of productsToUpdate) {
        product.stock -= qty;
        await product.save(session ? { session } : undefined);

        await Stock.create([{
            product: product._id,
            quantity: qty,
            type: "OUT",
            note: `Order ${order.invoiceNumber}`
        }], session ? { session } : undefined);
    }

    return { order, payment };
};

/**
 * CREATE PAYMENT
 * POST /api/payments
 */
exports.createPayment = async (req, res) => {
    let session;
    let requestedOrderId = "";
    try {
        const { orderId, paymentMethod } = req.body;
        requestedOrderId = String(orderId || "");
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

        if (!orderId || !paymentMethod) {
            return res.status(400).json({
                message: "orderId and paymentMethod are required"
            });
        }

        if (!normalizedPaymentMethod) {
            return res.status(400).json({
                message: "paymentMethod must be Cash or QR Bank"
            });
        }

        if (!isValidObjectId(orderId)) {
            return res.status(400).json({
                message: "Invalid order id"
            });
        }

        let order;
        let payment;

        try {
            session = await mongoose.startSession();
            await session.withTransaction(async () => {
                const result = await processPaymentCore({
                    orderId,
                    normalizedPaymentMethod,
                    session
                });
                order = result.order;
                payment = result.payment;
            });
        } catch (transactionError) {
            if (!isTransactionNotSupportedError(transactionError)) {
                throw transactionError;
            }

            const result = await processPaymentCore({
                orderId,
                normalizedPaymentMethod
            });
            order = result.order;
            payment = result.payment;
        }

        let itemLines = "";
        order.items.forEach((item, index) => {
            itemLines += `${index + 1}. ${item.productName}\n`;
            itemLines += `Qty: ${item.qty}\n`;
            itemLines += `Price: $${item.price}\n`;
            itemLines += `Subtotal: $${item.total}\n`;
            itemLines += "--------------------------\n";
        });

        const telegramMessage = [
            "PAYMENT RECEIVED",
            "",
            `Invoice: ${order.invoiceNumber}`,
            `Date: ${new Date(payment.paidAt).toLocaleString()}`,
            "",
            itemLines,
            `Total Amount: $${order.totalAmount}`,
            `Payment By: ${normalizedPaymentMethod}`
        ].join("\n");

        try {
            await sendTelegramMessage(telegramMessage);
        } catch (telegramError) {
            console.error("Telegram send failed:", telegramError.message);
        }

        res.status(201).json({
            message: "Payment successful",
            payment
        });
    } catch (error) {
        const text = String(error?.message || "");
        if (
            requestedOrderId &&
            text !== "Order not found" &&
            text !== "Payment already completed for this order"
        ) {
            try {
                await markOrderStatusFailed(requestedOrderId);
            } catch (resetError) {
                console.error("Mark order Failed failed:", resetError.message);
            }
        }
        if (text === "Order not found") {
            return res.status(404).json({ message: text });
        }
        if (text.startsWith("Order status ") && text.endsWith(" cannot be paid")) {
            return res.status(400).json({ message: text });
        }
        if (text === "Order status Failed cannot be paid") {
            return res.status(400).json({ message: text });
        }
        if (text === "Payment already completed for this order" || text.startsWith("Insufficient stock")) {
            return res.status(400).json({ message: text });
        }
        if (text.startsWith("Product not found:")) {
            return res.status(404).json({ message: text });
        }

        console.error("Payment Error:", error);
        res.status(500).json({
            message: "Payment failed",
            error: error.message
        });
    } finally {
        if (session) {
            session.endSession();
        }
    }
};

/**
 * GET ALL PAYMENTS
 * GET /api/payments
 */
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate("order")
            .sort({ createdAt: -1 });

        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch payments",
            error: error.message
        });
    }
};

/**
 * GET PAYMENT BY ID
 * GET /api/payments/:id
 */
exports.getPaymentById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid payment id"
            });
        }

        const payment = await Payment.findById(req.params.id).populate("order");

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch payment",
            error: error.message
        });
    }
};

/**
 * UPDATE PAYMENT STATUS (Admin / Webhook)
 * PUT /api/payments/:id
 */
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid payment id"
            });
        }

        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { paymentStatus },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.status(200).json({
            message: "Payment status updated",
            payment
        });
    } catch (error) {
        res.status(500).json({
            message: "Payment update failed",
            error: error.message
        });
    }
};

/**
 * DELETE PAYMENT (Admin only)
 * DELETE /api/payments/:id
 */
exports.deletePayment = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid payment id"
            });
        }

        const payment = await Payment.findByIdAndDelete(req.params.id);

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.status(200).json({
            message: "Payment deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Payment delete failed",
            error: error.message
        });
    }
};
