const validator = require('validator');

const validateSignup=(req)=>{
    const { firstName, lastName, email, password}= req.body;
    if(!firstName || !lastName || !email || !password) {
        throw new Error("All fields are required");
    }else if   (!validator.isEmail(email)) {
        throw new Error("Invalid email address");
    }else if(!validator.isStrongPassword(password)) {
        throw new Error("Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one symbol.");
   }
};

const isvalid=(req)=>{
    let isallowedUpdates = ['firstName', 'lastName', 'phone', 'gender'];
    let isUpdateValid = Object.keys(req.body).every((key) => isallowedUpdates.includes(key));
    return isUpdateValid;
}
module.exports=validateSignup;
module.exports=isvalid;