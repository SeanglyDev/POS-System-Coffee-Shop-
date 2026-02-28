const express = require("express");
const router = express.Router();
const registerController = require("../controller/register.controller");
const { verifyAuth } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/role.middleware");

router.post("/register", registerController.registerUser);
router.get("/", verifyAuth, isAdmin,registerController.getAllUsers);
router.get("/:id",  verifyAuth, isAdmin, registerController.getUserById);
router.put("/:id", verifyAuth, isAdmin, registerController.updateUser);
router.delete("/:id",  verifyAuth, isAdmin,registerController.deleteUser);



module.exports = router;
