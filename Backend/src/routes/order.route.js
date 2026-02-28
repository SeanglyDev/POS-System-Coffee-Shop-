const express = require("express");
const router = express.Router();
const { verifyAuth } = require("../middleware/auth.middleware");
const { isStaffOrAdmin, isAdmin } = require("../middleware/role.middleware");

const {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
} = require("../controller/order.controller");

router.post("/", verifyAuth, createOrder);
router.get("/", verifyAuth, isStaffOrAdmin, getAllOrders);
router.get("/:id", verifyAuth, isStaffOrAdmin, getOrderById);
router.put("/:id", verifyAuth, isStaffOrAdmin, updateOrderStatus);
router.delete("/:id", verifyAuth, isAdmin, deleteOrder);



module.exports = router;
