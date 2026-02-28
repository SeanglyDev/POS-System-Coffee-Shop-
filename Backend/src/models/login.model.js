const mongoose = require("mongoose");

const registerSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        gender: { type: String, enum: ["male", "female", "other"], required: true },
        role: { type: String, enum: ["staff", "admin"], default: "staff" },

    },
    { timestamps: true }
);

module.exports = mongoose.model("usersRegister", registerSchema);
