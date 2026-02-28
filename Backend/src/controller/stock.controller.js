const productModel = require("../models/product.model");
const stockModel = require("../models/stock.model");

// this is get stock 
exports.getAllStock = async (req, res) => {
    try {
        const stock = await stockModel.find().populate("product", "productName image_URL");
        res.status(200).json({
            message: "Get all stock is successfully",
            stock
        })
    } catch (error) {
        res.status(500).json({ message: "Get all stock is failed" })
    }
}
// this is add stock = post
exports.addStock = async (req, res) => {
    try {
        const { product, quantity, type, note } = req.body;

        const existingProduct = await productModel.findById(product);
        if (!existingProduct) return res.status(404).json({ message: "Product is not found" })

        let newStock = existingProduct.stock;
        if (type == "IN") {
            newStock += quantity;
        } else if (type === "OUT") {
            if (existingProduct.stock < quantity) {
                return res.status(400).json({ message: "Insufficient stock" });
            }
            newStock -= quantity;
        }

        const stock = await stockModel.create({
            product,
            quantity,
            type,
            note
        });

        existingProduct.stock = newStock;
        await existingProduct.save();

        res.status(201).json({
            message: "Stock updated successfully",
            stock,
            currentStock: existingProduct.stock
        });
    } catch (error) {
        res.status(500).json({
            message: "Stock update failed",
            error: error.message
        });
    }
}
// get stock by id 
exports.getStockById = async (req, res) => {
    try {
        const stockId = await stockModel.findById(req.params.id);
        if (!stockId) return res.status(404).json({ message: "stock is not found" });
        res.status(200).json(stockId)
    } catch (error) {
        res.status(500).json({
            message: "Get stock by id is failed",
            error: error.message
        });
    }
}
// this is put stock is mean update stock
exports.updateStock = async (req, res) => {
    try {
        const { quantity, type, note } = req.body;

        const stock = await stockModel.findById(req.params.id);
        if (!stock) {
            return res.status(404).json({ message: "Stock record not found" });
        }

        const product = await productModel.findById(stock.product);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // rollback old stock
        if (stock.type === "IN") product.stock -= stock.quantity;
        if (stock.type === "OUT") product.stock += stock.quantity;

        // apply new stock
        if (type === "IN") product.stock += quantity;
        if (type === "OUT") {
            if (product.stock < quantity) {
                return res.status(400).json({ message: "Insufficient stock" });
            }
            product.stock -= quantity;
        }

        // update stock record
        stock.quantity = quantity;
        stock.type = type;
        stock.note = note;

        await stock.save();
        await product.save();

        res.status(200).json({
            message: "Stock updated successfully",
            stock,
            currentStock: product.stock
        });
    } catch (error) {
        res.status(500).json({
            message: "Stock update failed",
            error: error.message
        });
    }
}
/**
 * Delete Stock
 */
exports.deleteStock = async (req, res) => {
    try {
        const stock = await stockModel.findById(req.params.id);
        if (!stock) {
            return res.status(404).json({ message: "Stock record not found" });
        }

        const product = await productModel.findById(stock.product);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // rollback stock
        if (stock.type === "IN") product.stock -= stock.quantity;
        if (stock.type === "OUT") product.stock += stock.quantity;

        await stock.deleteOne();
        await product.save();

        res.status(200).json({
            message: "Stock deleted successfully",
            currentStock: product.stock
        });
    } catch (error) {
        res.status(500).json({
            message: "Stock delete failed",
            error: error.message
        });
    }
};
