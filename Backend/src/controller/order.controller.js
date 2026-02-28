const mongoose = require("mongoose");
const productModel = require("../models/product.model");
const orderModel = require("../models/order.model");

const generateInvoiceNumber = () => {
    return "INV-" + Math.floor(100000 + Math.random() * 900000);
}

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const normalizeOrderStatus = (value) => {
    const text = String(value || "").trim().toLowerCase();
    const map = {
        pending: "Pending",
        confirmed: "Confirmed",
        completed: "Completed",
        cancelled: "Cancelled",
        cancel: "Cancelled",
        failed: "Failed"
    };
    return map[text] || null;
};

// this is get all order
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.find()
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

// this is post order is mean user order item 
exports.createOrder = async (req, res) => {
    try {
        const { items, orderStatus } = req.body;
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Order items are required" })
        }
        const normalizedStatus = orderStatus
            ? normalizeOrderStatus(orderStatus)
            : "Pending";
        if (!normalizedStatus) {
            return res.status(400).json({
                message: "orderStatus must be Pending, Confirmed, Completed, Cancelled, or Failed"
            });
        }

        let orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            if (!isValidObjectId(item.product)) {
                return res.status(400).json({ message: "Invalid product id" });
            }
            const product = await productModel.findById(item.product)
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            const itemTotal = product.price * item.qty;

            orderItems.push({
                product: product._id,
                productName: product.productName,
                qty: item.qty,
                price: product.price,
                total: itemTotal
            })
            totalAmount += itemTotal;
        }
        const order = await orderModel.create({
            invoiceNumber: generateInvoiceNumber(),
            items: orderItems,
            totalAmount,
            orderStatus: normalizedStatus
        });
        res.status(201).json({
            message: "Order created successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            message: "Order creation failed",
            error: error.message
        });
    }
}
// this is get by id 
exports.getOrderById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid order id" });
        }
        const order = await orderModel.findById(req.params.id)
            .populate("items.product");

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch order",
            error: error.message
        });
    }
};
// this is update order 
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const normalizedStatus = normalizeOrderStatus(orderStatus);
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid order id" });
        }
        if (!normalizedStatus) {
            return res.status(400).json({
                message: "orderStatus must be Pending, Confirmed, Completed, Cancelled, or Failed"
            });
        }

        const order = await orderModel.findByIdAndUpdate(
            req.params.id,
            { orderStatus: normalizedStatus },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            message: "Order status updated successfully",
            order
        });
    } catch (error) {
        res.status(500).json({
            message: "Order update failed",
            error: error.message
        });
    }
};

// this is delete order 
exports.deleteOrder = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid order id" });
        }
        const order = await orderModel.findByIdAndDelete(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            message: "Order deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Order delete failed",
            error: error.message
        });
    }
};
