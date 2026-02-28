const { verifyToken } = require("../utils/jwt");

const verifyAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Accept raw token, "Bearer <token>", and accidental "Bearer Bearer <token>"
        let token = authHeader.trim();
        token = token.replace(/^Bearer\s+/i, "").trim();
        token = token.replace(/^Bearer\s+/i, "").trim();

        if (!token || token === "null" || token === "undefined") {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = verifyToken(token);
        req.user = decoded; // { id, role }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

exports.verifyAuth = verifyAuth;
exports.verifyToken = verifyAuth;
