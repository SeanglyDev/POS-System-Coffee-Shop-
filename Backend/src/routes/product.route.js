const express = require("express");
const router = express.Router();
const { verifyAuth } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/role.middleware");

const {
    getAllProduct,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controller/product.controller");

router.get("/",verifyAuth, getAllProduct);
router.get("/:id",verifyAuth, getProductById);
router.post("/",verifyAuth,isAdmin, createProduct);
router.put("/:id",verifyAuth,isAdmin, updateProduct);
router.delete("/:id", verifyAuth, isAdmin, deleteProduct);

module.exports = router;  
