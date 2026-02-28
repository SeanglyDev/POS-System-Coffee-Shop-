const bcrypt = require("bcryptjs");
const { signToken } = require("../utils/jwt");
const User = require("../models/register.model");
const Register = require("../models/register.model");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user
        const user = await Register.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 2. Check password
        const isMatch = await  bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 3. CREATE JWT TOKEN ✅
        const token = signToken({
            id: user._id,
            role: user.role // admin | staff
        });

        // 4. Send token to client
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
}

exports.resetPasswordSimple = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and newPassword required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const saltRounds = 10;
    user.password = await bcrypt.hash(newPassword, saltRounds);

    await user.save();

    res.json({ message: "Password updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};