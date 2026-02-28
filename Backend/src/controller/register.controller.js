const User = require("../models/register.model");
const bcrypt = require("bcryptjs");
/**
 * Get All Users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update User
 */
exports.updateUser = async (req, res) => {
    try {
        const {
            image_Url,
            firstName,
            lastName,
            email,
            password,
            gender,
            phoneNumber,
            dob,
            address,
            role
        } = req.body;

        const updateData = {
            image_Url,
            firstName,
            lastName,
            email,
            gender,
            phoneNumber,
            dob,
            address,
            role
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User updated successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete User
 */
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "User deleted successfully",
            user
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get User By ID
 */
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Register User
 */
exports.registerUser = async (req, res) => {
    try {
        const {
            image_Url,
            firstName,
            lastName,
            email,
            password,
            gender,
            phoneNumber,
            dob,
            address,
            role
        } = req.body;

        // check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            image_Url,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            gender,
            phoneNumber,
            dob,
            address,
            role
        });

        res.status(201).json({
            message: "User registered successfully",
            user
        });
    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};
// update user
exports.updateUser = async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        if (password) rest.password = await bcrypt.hash(password, 10);

        const updateUser = await User.findByIdAndUpdate(
            req.params.id,
            rest,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updateUser) return res.status(400).json({ message: "User is not found" })

        res.status(200).json({
            message: "User is update successfully !",
            user: updateUser
        })

    } catch (error) {
        res.status(500).json({
            message: "Update is failed",
            error: error.message
        })
    }
}
// delete user
exports.deleteUser = async (req, res) => {
    try {
        const deleteUser = await User.findByIdAndDelete(req.params.id)
        if (!deleteUser) return res.status(400).json({ message: "User is not found", })
        res.status(200).json({ message: "User delete is successfully !" })
    } catch (error) {
        res.status(500).json({ message: "Delete user is failed" })
    }
}
