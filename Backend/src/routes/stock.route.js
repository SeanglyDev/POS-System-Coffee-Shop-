const express = require("express");
const router = express.Router();
const { addStock,
    getStockById,
    getAllStock,
    updateStock,
    deleteStock } = require("../controller/stock.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { isStaffOrAdmin } = require("../middleware/role.middleware");


router.get("/",verifyToken,isStaffOrAdmin, getAllStock);
router.post("/", verifyToken, isStaffOrAdmin, addStock);
router.get("/:id",verifyToken,isStaffOrAdmin, getStockById);
router.put("/:id", verifyToken, isStaffOrAdmin, updateStock);
router.delete("/:id", verifyToken, isStaffOrAdmin, deleteStock);


module.exports = router;
