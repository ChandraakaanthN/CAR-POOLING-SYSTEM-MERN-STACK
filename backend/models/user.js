const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    email:{
          type: String,
          lowercase: true,
          trim: true,
          required: true,
          unique: true,
          validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid email address");
            }
          }
    },
    password:{
        type: String,
        required: true,
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error("Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one symbol.");
            }     
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    requestedRides: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request'
    }],
    gender:{
        type: String,
    },
    phone:{
        type: String,
        required: true,
        validate(value){
            if(!validator.isMobilePhone(value, 'any', {strictMode: false})){
                throw new Error("Invalid phone number");
            }
        }
    },
    license:{
        type: String,
        required: true,
        validate(value){
            if(!validator.isLength(value, {min: 5, max: 15})){
                throw new Error("License number must be between 5 and 15 characters long");
            }
        }
    }
},
{ 
    timestamps: true
});

userSchema.methods.getJWT=async function(){
     const user = this;
     const token=await jwt.sign({_id: user._id, role: user.role},process.env.JWT_SECRET,{expiresIn: "1d"});
        return token;
};

userSchema.methods.isPasswordvalid=async function(password){
    const user = this;
    const isvalid = await bcrypt.compare(password, user.password);
    return isvalid;
};

module.exports = mongoose.model('User', userSchema);