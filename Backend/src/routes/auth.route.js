const express = require("express");
const router = express.Router();
const { login, } = require("../controller/auth.controller");
const authController = require("../controller/auth.controller");
router.post("/reset-password", authController.resetPasswordSimple);
router.post("/login", login);


module.exports = router;
