const jwt = require("jsonwebtoken");
const User = require("../models/user");
require('dotenv').config();

const userAuth=async(req,res,next)=>{
    //read the token
   try{
     const token = req.cookies.jwt;
        if (!token) {
            throw new Error("Invalid token");
        }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const {_id} = decoded;
    const user = await User.findById(_id);
    if(!user){
        throw new Error("User not found");
    }
    req.user = user;
    next();
   }catch(err){
     res.status(400).send("Error: " + err.message);
   }
};

module.exports = userAuth;