const express = require("express");
const router = express.Router();
const { validateObjectId } = require("../middleware/validateObjectId.middleware");
const { verifyToken } = require("../middleware/auth.middleware");
const { isStaffOrAdmin, isAdmin } = require("../middleware/role.middleware");


const {
    createPayment,
    getAllPayments,
    getPaymentById,
    updatePaymentStatus,
    deletePayment
} = require("../controller/payment.controller");

router.post("/", verifyToken, createPayment);
router.get("/", verifyToken, isStaffOrAdmin, getAllPayments);
router.get("/:id", validateObjectId(), getPaymentById,);
router.put("/:id", verifyToken, isStaffOrAdmin, updatePaymentStatus);
router.delete("/:id", verifyToken, isAdmin, deletePayment);

module.exports = router;
