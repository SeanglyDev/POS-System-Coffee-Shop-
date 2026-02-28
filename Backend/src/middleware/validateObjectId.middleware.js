const mongoose = require("mongoose");

exports.validateObjectId = (paramName = "id") => {
    return (req, res, next) => {
        const id = req.params[paramName];

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid ID format"
            });
        }

        next();
    };
};
