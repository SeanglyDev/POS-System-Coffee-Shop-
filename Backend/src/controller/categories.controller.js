const categoryModel = require("../models/categories.model");
// this is get all category  
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await categoryModel.find();
        res.status(200).json({
            message: "Get all category is successfully",
            categories
        });
    } catch (error) {
        res.status(500).json({ message: "Get all category is failed" });
    }
};
// post category is mean create category 
exports.createCategories = async (req, res) => {
    try {
        const { categoriesName, description } = req.body;
        if (!categoriesName || !description) {
            return res.status(400).json({ message: "categoriesName and description are required" });
        }
        // prevent  duplicate category
        const exists = await categoryModel.findOne({ categoriesName });
        if (exists) return res.status(400).json({ message: "Category already exists" });

        const category = await categoryModel.create({ categoriesName, description });

        res.status(201).json({
            message: "Category created successfully",
            category
        });
    } catch (error) {
        res.status(500).json({
            message: "Category create failed",
            error: error.message
        });
    }
};
// this is gey by id category
exports.getCategoryById = async (req, res) => {
    try {
        const category = await categoryModel.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "category is not found" });
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({
            message: "Get category by id is failed",
            error: error.message
        });
    }
};
// this is put category is mean update category
exports.updateCategory = async (req, res) => {
    try {
        const { categoriesName, description, status } = req.body;
        const category = await categoryModel.findByIdAndUpdate(
            req.params.id,
            { categoriesName, description, status },
            { new: true, runValidators: true }
        )
        if (!category) return res.status(404).json({ message: "category is not found" })
        res.status(200).json({
            message: "category is update successfully",
            category
        })

    } catch (error) {
        res.status(500).json({
            message: "update category is failed",
            error: error.message
        }
        )
    }
}

// this is delete category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await categoryModel.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: "category is not found" });
        res.status(200).json({
            message: "category is delete successfully",
            category
        });
    } catch (error) {
        res.status(500).json({
            message: "delete category is failed",
            error: error.message
        });
    }
};
