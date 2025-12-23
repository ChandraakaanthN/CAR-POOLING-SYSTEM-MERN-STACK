const express = require('express');
const authRouter = express.Router();
const User = require('../models/user');
const validateSignup= require('../utils/validation');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userAuth = require('../middlewares/auth');


authRouter.post("/signup", async(req, res) => {
 try{
     validateSignup(req);
     const {firstName,lastName,email,password,gender,phone,license}=req.body;
     const passwordHash=await bcrypt.hash(password, 10);
     const user=new User({
         firstName,lastName,email,password:passwordHash,gender,phone,license
     });
     const token = await user.getJWT();
     res.cookie("jwt",token);
     await user.save();
   res.send(user);
   }catch(err){
     res.status(500).send("Error adding user: " + err.message);
   }
});

authRouter.post("/login",async(req,res)=>{
   const {email, password} = req.body;
   try{
    if(!email || !password){
        return res.status(400).json({ error: "Email and password are required" });
    }
    
    const user=await User.findOne({email: email.toLowerCase().trim()});
    if(!user){
        return res.status(401).json({ error: "Invalid email or password" });
    }
    
    if(!user.isActive){
        return res.status(403).json({ error: "Your account has been deactivated. Please contact support." });
    }
    
    const isvalid=await user.isPasswordvalid(password);
    if(!isvalid){
        return res.status(401).json({ error: "Invalid email or password" });
    }
    
    const token = await user.getJWT();
    res.cookie("jwt",token, {
        httpOnly: false, // Allow JavaScript access for frontend auth checks
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    const { firstName, lastName, gender, phone, license, role, isActive, email: userEmail } = user;
    res.json({ firstName, lastName, gender, phone, license, role, isActive, email: userEmail }); 
   }catch(err){
    console.error("Login error:", err);
    res.status(500).json({ error: "Error logging in: " + err.message });
   }
});

authRouter.post("/logout",(req,res)=>{
    res.cookie("jwt",null,{expiresIn:new Date(Date.now())});
    res.send("logged out successfully");
});

authRouter.patch("/changepassword",userAuth,async(req,res)=>{
    try{
        const {oldPassword, newPassword} = req.body;
        
        // Validate input
        if(!oldPassword || !newPassword){
            return res.status(400).json({ error: "Old password and new password are required" });
        }
        
        const user = req.user;
        if(!user){
            return res.status(404).json({ error: "User not found" });
        }
        
        // Validate old password
        const isvalid=await user.isPasswordvalid(oldPassword);
        if(!isvalid){
            return res.status(400).json({ error: "Invalid old password" });
        }
        
        // Validate new password strength (same as signup validation)
        if(newPassword.length < 8){
            return res.status(400).json({ error: "New password must be at least 8 characters long" });
        }
        
        // Check if new password is same as old password
        if(oldPassword === newPassword){
            return res.status(400).json({ error: "New password must be different from old password" });
        }
        
        // Hash and save new password
        const passwordHash=await bcrypt.hash(newPassword, 10);
        user.password=passwordHash;
        await user.save();
        
        res.json({ message: "Password changed successfully" });
    }catch(err){
        console.error("Change password error:", err);
        res.status(500).json({ error: "Error changing password: " + err.message });
    }
});
module.exports = authRouter;