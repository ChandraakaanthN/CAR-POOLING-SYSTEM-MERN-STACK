const jwt = require("jsonwebtoken");
const User = require("../models/user");
require('dotenv').config();

const adminAuth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            throw new Error("Invalid token");
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { _id, role } = decoded;
        
        const user = await User.findById(_id);
        if (!user) {
            throw new Error("User not found");
        }
        
        if (role !== 'admin' || user.role !== 'admin') {
            throw new Error("Access denied. Admin privileges required.");
        }
        
        if (!user.isActive) {
            throw new Error("Account is deactivated");
        }
        
        req.user = user;
        next();
    } catch (err) {
        res.status(403).send("Error: " + err.message);
    }
};

module.exports = adminAuth;
