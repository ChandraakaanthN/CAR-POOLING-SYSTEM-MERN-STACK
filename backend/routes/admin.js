const express = require('express');
const adminRouter = express.Router();
const adminAuth = require('../middlewares/adminAuth');
const User = require('../models/user');
const Ride = require('../models/ride');
const Request = require('../models/requests');
const Review = require('../models/reviews');
const Chat = require('../models/chat');

// Get admin dashboard statistics
adminRouter.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const activeUsers = await User.countDocuments({ role: 'user', isActive: true });
        const totalRides = await Ride.countDocuments();
        const activeRides = await Ride.countDocuments({ 
            date: { $gte: new Date() },
            noOfVacancies: { $gt: 0 }
        });
        const totalRequests = await Request.countDocuments();
        const pendingRequests = await Request.countDocuments({
            'requests.status': 'pending'
        });
        const totalReviews = await Review.countDocuments();

        // Recent activities
        const recentUsers = await User.find({ role: 'user' })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('firstName lastName email createdAt');

        const recentRides = await Ride.find()
            .populate('owner', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            statistics: {
                totalUsers,
                activeUsers,
                totalRides,
                activeRides,
                totalRequests,
                pendingRequests,
                totalReviews
            },
            recentActivities: {
                users: recentUsers,
                rides: recentRides
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch dashboard data", details: err.message });
    }
});

// Get all users with pagination and search
adminRouter.get('/users', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        const skip = (page - 1) * limit;

        let query = { role: 'user' };
        
        // Search functionality
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalUsers = await User.countDocuments(query);

        res.json({
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                hasNextPage: page * limit < totalUsers,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users", details: err.message });
    }
});

// Get user details by ID
adminRouter.get('/users/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId)
            .select('-password')
            .populate('requestedRides');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get user's rides
        const userRides = await Ride.find({ owner: userId })
            .sort({ createdAt: -1 });

        // Get user's requests
        const userRequests = await Request.find({
            'requests.userId': userId
        }).populate('rideId');

        // Get user's reviews
        const userReviews = await Review.find({ reviewer: userId })
            .populate('rider', 'firstName lastName');

        res.json({
            user,
            rides: userRides,
            requests: userRequests,
            reviews: userReviews
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user details", details: err.message });
    }
});

// Update user status (activate/deactivate)
adminRouter.patch('/users/:userId/status', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: "isActive must be a boolean value" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ 
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to update user status", details: err.message });
    }
});

// Delete user
adminRouter.delete('/users/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete user's rides
        await Ride.deleteMany({ owner: userId });

        // Delete user's requests
        await Request.deleteMany({ 'requests.userId': userId });

        // Delete user's reviews
        await Review.deleteMany({ 
            $or: [{ reviewer: userId }, { rider: userId }] 
        });

        // Delete user's chats
        await Chat.deleteMany({ participants: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.json({ message: "User and all associated data deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user", details: err.message });
    }
});

// Get all rides with pagination and filters
adminRouter.get('/rides', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', search = '' } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        // Status filter
        if (status === 'active') {
            query.date = { $gte: new Date() };
            query.noOfVacancies = { $gt: 0 };
        } else if (status === 'completed') {
            query.date = { $lt: new Date() };
        } else if (status === 'full') {
            query.noOfVacancies = 0;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { fromPlace: { $regex: search, $options: 'i' } },
                { toPlace: { $regex: search, $options: 'i' } },
                { vehicleName: { $regex: search, $options: 'i' } }
            ];
        }

        const rides = await Ride.find(query)
            .populate('owner', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalRides = await Ride.countDocuments(query);

        res.json({
            rides,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRides / limit),
                totalRides,
                hasNextPage: page * limit < totalRides,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch rides", details: err.message });
    }
});

// Get ride details with requests
adminRouter.get('/rides/:rideId', adminAuth, async (req, res) => {
    try {
        const { rideId } = req.params;

        const ride = await Ride.findById(rideId)
            .populate('owner', 'firstName lastName email phone');

        if (!ride) {
            return res.status(404).json({ error: "Ride not found" });
        }

        // Get ride requests
        const requests = await Request.findOne({ rideId })
            .populate('requests.userId', 'firstName lastName email phone');

        // Get ride chat
        const chat = await Chat.findOne({ rideId })
            .populate('participants', 'firstName lastName')
            .populate('messages.sender', 'firstName lastName');

        res.json({
            ride,
            requests: requests || { requests: [] },
            chat: chat || { messages: [] }
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch ride details", details: err.message });
    }
});

// Delete ride
adminRouter.delete('/rides/:rideId', adminAuth, async (req, res) => {
    try {
        const { rideId } = req.params;

        // Check if ride exists
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ error: "Ride not found" });
        }

        // Delete associated requests
        await Request.deleteMany({ rideId });

        // Delete associated chat
        await Chat.deleteMany({ rideId });

        // Delete the ride
        await Ride.findByIdAndDelete(rideId);

        res.json({ message: "Ride and all associated data deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete ride", details: err.message });
    }
});

// Get all requests with pagination
adminRouter.get('/requests', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '' } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        
        if (status) {
            query['requests.status'] = status;
        }

        const requests = await Request.find(query)
            .populate('rideId', 'fromPlace toPlace date starttime cost')
            .populate('requests.userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalRequests = await Request.countDocuments(query);

        res.json({
            requests,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRequests / limit),
                totalRequests,
                hasNextPage: page * limit < totalRequests,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch requests", details: err.message });
    }
});

// Get system statistics
adminRouter.get('/statistics', adminAuth, async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // User statistics
        const totalUsers = await User.countDocuments({ role: 'user' });
        const newUsers = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: startDate }
        });

        // Ride statistics
        const totalRides = await Ride.countDocuments();
        const newRides = await Ride.countDocuments({
            createdAt: { $gte: startDate }
        });

        // Request statistics
        const totalRequests = await Request.countDocuments();
        const pendingRequests = await Request.countDocuments({
            'requests.status': 'pending'
        });

        // Revenue statistics (assuming cost is in rupees)
        const totalRevenue = await Ride.aggregate([
            {
                $lookup: {
                    from: 'requests',
                    localField: '_id',
                    foreignField: 'rideId',
                    as: 'requests'
                }
            },
            {
                $unwind: '$requests'
            },
            {
                $unwind: '$requests.requests'
            },
            {
                $match: {
                    'requests.requests.status': 'accepted'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $multiply: ['$cost', '$requests.requests.seatsRequested'] } }
                }
            }
        ]);

        // Monthly user registration trend
        const monthlyUsers = await User.aggregate([
            {
                $match: {
                    role: 'user',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.json({
            overview: {
                totalUsers,
                newUsers,
                totalRides,
                newRides,
                totalRequests,
                pendingRequests,
                totalRevenue: totalRevenue[0]?.totalRevenue || 0
            },
            trends: {
                monthlyUsers
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch statistics", details: err.message });
    }
});

module.exports = adminRouter;
