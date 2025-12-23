const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, 
    },
    rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: { validator: Number.isInteger },
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000,
    }
}, {
    timestamps: true 
});



module.exports = mongoose.model('Review', reviewSchema);
