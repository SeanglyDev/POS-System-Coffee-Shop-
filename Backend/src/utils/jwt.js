const jwt = require("jsonwebtoken");

/**
 * Sign JWT token
 * @param {Object} payload
 */
const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
};
/**
 * Verify JWT token
 * @param {string} token
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
/**
 * Decode JWT token (no verification)
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    signToken,
    verifyToken,
    decodeToken
};
