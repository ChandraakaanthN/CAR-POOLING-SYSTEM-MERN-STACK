const mongoose = require('mongoose');

const userRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    seatsRequested: {
        type: Number,
        min: 1,
        default: 1,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending',
    },
     requestedAt: {
        type: Date,
        default: Date.now,
    },
});

const requestSchema = new mongoose.Schema({
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true,
    },
    requests: [userRequestSchema], 
}, {
    timestamps: true,
});

module.exports = mongoose.model('Request', requestSchema);
