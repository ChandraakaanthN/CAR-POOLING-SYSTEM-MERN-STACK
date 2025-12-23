const express = require("express");
const profileRouter = express.Router();
const userAuth = require('../middlewares/auth');
const isvalid = require('../utils/validation');

profileRouter.get("/", userAuth, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).send("please login");
        }
        // Send user data without password
        const userData = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            license: user.license,
            gender: user.gender,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
        res.send(userData);
    } catch (err) {
        res.status(400).send("Error : " + err.message);
    }
});

profileRouter.patch("/edit",userAuth,async(req,res)=>{
     try{
        if(!isvalid){
        throw new Error("Invalid user data");
        }
        const loggesdInUser = req.user;
        Object.keys(req.body).forEach((key) => {
            if (req.body[key] !== undefined) {
                loggesdInUser[key] = req.body[key];
            }
        });
        await loggesdInUser.save();
       res.send({
  _id:loggesdInUser._id,
  firstName: loggesdInUser.firstName,
  lastName: loggesdInUser.lastName,
  gender: loggesdInUser.gender,
  license: loggesdInUser.license,
  phone: loggesdInUser.phone,
  email: loggesdInUser.email,
});
     }catch(err){
        res.status(400).send("Error: " + err.message);
     }
}); 


module.exports = profileRouter;