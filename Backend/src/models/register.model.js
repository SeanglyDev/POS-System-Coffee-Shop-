const mongoose = require('mongoose');
const loginSchema = new mongoose.Schema(
    {
        image_Url: { type: String, required: true },
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        gender: { type: String, enum: ["male", "female", "other"], required: true },
        phoneNumber: { type: String, required: true, trim: true },
        dob: { type: Date, required: true },
        address: { type: String, required: true, trim: true },
        role: { type: String, enum: ["staff", "admin"], default: "staff" },
        passwordResetTokenHash: { type: String },
        passwordResetExpiresAt: { type: Date },
    },
    { timestamps: true } 
);

module.exports = mongoose.model("Login", loginSchema);