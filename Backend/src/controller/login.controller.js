const User = require("../models/register.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// post user
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1) validate
        if (!email || !password) {
            return res.status(400).json({ message: "email and password are required" });
        }

        // 2) find user
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 3) compare password (bcrypt)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 4) create JWT token
        const token = jwt.sign(
            { userId: user._id.toString(), role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        // 5) response (do not return password)
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                image_Url: user.image_Url,
                firstName: user.firstName,
                lastName: user.lastName,
                gender: user.gender,
                phoneNumber: user.phoneNumber,
                dob: user.dob,
                address: user.address
            }
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { login };
