exports.isAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({
            message: "Access denied: Admin only"
        });
    }
    next();
};
exports.isStaffOrAdmin = (req, res, next) => {
    if (!["admin", "staff"].includes(req.user?.role)) {
        return res.status(403).json({
            message: "Access denied"
        });
    }
    next();
};
