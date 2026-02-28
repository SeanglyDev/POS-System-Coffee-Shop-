const productModel = require("../models/product.model");
// this is get but is get all product 
exports.getAllProduct = async (req, res) => {
    try {
        const product = await productModel.find().populate("categories", "categoriesName");
        res.status(200).json({
            message: "product get successfully",
            product
        })
    } catch (error) {
        res.status(500).json({
            message: "gets product is failed",
            error: error.message
        })
    }
}
// this is post product is mean create product
exports.createProduct = async (req, res) => {
    try {
        const product = await productModel.create(req.body);
        res.status(200).json({
            message: "Product create successfully",
            product
        });
    } catch (error) {
        res.status(500).json({
            message: "Create product is failed",
            error: error.message
        })
    }
}
exports.getProductById = async (req, res) => {
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "product is not found" })
        res.status(200).json(product)
    } catch (error) {
        res.status(500).json({ message: "get product by id is failed" })
    }
}
// this is put product is mean update product
exports.updateProduct = async (req, res) => {
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "product not found" });
        Object.assign(product, req.body);
        await product.save();
        res.status(200).json({
            message: "Product is update successfully",
            product
        })
    } catch (error) {
        res.status(500).json({
            message: "Product update failed",
            error: error.message
        });
    }
}
exports.deleteProduct = async (req, res) => {
    try {
        const product = await productModel.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Product delete failed",
            error: error.message
        });
    }
}
