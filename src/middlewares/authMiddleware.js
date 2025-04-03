require("dotenv").config();
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

// Middleware to authenticate JWT
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: req.t("unauthorized_no_token") });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log("Decoded JWT:", decoded); // Debugging log
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: req.t("unauthorized_token_expired") });
        }
        return res.status(401).json({ error: req.t("unauthorized_invalid_token") });
    }
};

// Middleware to authorize based on roles (Admin & User)
const authorize = (roles = []) => {
    return (req, res, next) => {
        console.log("User Role:", req.user.role); // Debugging log

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: req.t("forbidden_no_permission") });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
