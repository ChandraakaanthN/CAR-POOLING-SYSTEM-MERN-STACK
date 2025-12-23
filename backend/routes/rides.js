const express = require('express');
const rideRouter = express.Router();
const userAuth = require('../middlewares/auth');
const Ride = require('../models/ride');

// GET all available rides (excluding rides created by the logged-in user and past dates)
rideRouter.get('/', userAuth, async (req, res) => {
  try {
    const currentDate = new Date();
    // currentDate.setHours(0, 0, 0, 0); // Start of today
    
    const rides = await Ride.find({
      noOfVacancies: { $gt: 0 },
      owner: { $ne: req.user._id },
      date: { $gte: currentDate } 
    }).populate("owner", "firstName lastName email");
    res.status(200).json(rides);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

// Route-aware search: match rides whose route passes near both origin and destination
rideRouter.get('/search', userAuth, async (req, res) => {
  try {
    const { fromLng, fromLat, toLng, toLat } = req.query;
    if ([fromLng, fromLat, toLng, toLat].some(v => v === undefined)) {
      return res.status(400).json({ error: 'fromLng, fromLat, toLng, toLat are required' });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const MAX_DISTANCE_METERS = 5000; // 5km
    const fromPoint = {
      type: 'Point',
      coordinates: [parseFloat(fromLng), parseFloat(fromLat)],
    };
    const toPointCoords = [parseFloat(toLng), parseFloat(toLat)];
    const radiusRadians = MAX_DISTANCE_METERS / 6378137; // meters to radians

    const rides = await Ride.aggregate([
      {
        $geoNear: {
          near: fromPoint,
          distanceField: 'distFrom',
          key: 'fromLocation',
          maxDistance: MAX_DISTANCE_METERS,
          spherical: true,
          query: {
            noOfVacancies: { $gt: 0 },
            date: { $gte: currentDate },
            owner: { $ne: req.user._id },
          },
        },
      },
      {
        $match: {
          toLocation: {
            $geoWithin: { $centerSphere: [toPointCoords, radiusRadians] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner',
        },
      },
      { $unwind: '$owner' },
      {
        $project: {
          'owner.password': 0,
        },
      },
      { $sort: { distFrom: 1 } },
    ]);

    res.status(200).json(rides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search rides', details: err.message });
  }
});

// GET all rides created by the logged-in user
rideRouter.get('/my-rides', userAuth, async (req, res) => {
    try {
        const rides = await Ride.find({ owner: req.user._id }).populate("owner", "firstName lastName email");
        res.status(200).json(rides);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your rides" });
    }
});

// POST a new ride
rideRouter.post('/', userAuth, async (req, res) => {
  try {
    const {
      fromPlace,
      toPlace,
      vehicleType,
      vehicleName,
      vehicleNumber,
      noOfVacancies,
      cost,
      date,
      starttime,
      fromLocation,
      toLocation,
      routePoints,
    } = req.body;
    
    const newRide = new Ride({
      owner: req.user._id, 
      fromPlace,
      toPlace,
      vehicleType,
      vehicleName,
      vehicleNumber,
      noOfVacancies,
      cost,
      date,
      starttime,
      fromLocation,
      toLocation,
      routePoints,
    });

    await newRide.save();
    res.status(201).json({ message: "Ride created successfully", ride: newRide });
  } catch (err) {
    res.status(500).json({ error: "Failed to create ride", details: err.message });
  }
});

// GET ride by id with owner populated (for details page)
rideRouter.get('/:rideId', userAuth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId).populate('owner', 'firstName lastName email phone');
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ride', details: err.message });
  }
});

module.exports = rideRouter;
