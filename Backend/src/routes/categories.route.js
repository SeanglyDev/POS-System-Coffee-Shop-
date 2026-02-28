const express = require("express");
const router = express.Router();
const {
    getAllCategories,
    createCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require("../controller/categories.controller");
const { verifyAuth } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/role.middleware");


router.get("/",verifyAuth, getAllCategories);
router.get("/:id",verifyAuth, getCategoryById);
router.post('/',verifyAuth,isAdmin, createCategories)
router.put("/:id",verifyAuth,isAdmin, updateCategory);
router.delete("/:id",verifyAuth,isAdmin, deleteCategory);

module.exports = router;
