const express = require('express');
const requestRouter = express.Router();
const userAuth = require('../middlewares/auth');
const Ride = require('../models/ride');
const User = require('../models/user');
const Request = require('../models/requests');

//requesting this ride
requestRouter.post('/ride/:rideId',userAuth, async(req,res)=>{
     const user=req.user;
     const {rideId}=req.params;
      if(!rideId || !user){
        return res.status(400).json({error: "Invalid request"});
      }
     const seats=req.body.seats||1;
     try{
        const ride = await Ride.findById(rideId);
        if(!ride){
          return res.status(404).json({error: "Ride not found"});
        }
        if(user._id.toString()===ride.owner.toString()){
          return res.status(400).json({error: "You cannot request seats for your own ride"});
        }
        if(ride.noOfVacancies <= 0){
          return res.status(400).json({error: "No vacancies available for this ride"});
        }
        
        // Find existing requests for this ride
        let rideRequest = await Request.findOne({rideId});
        
        // Calculate seats the current user already holds (pending or accepted) for this ride
        let userExistingSeats = 0;
        let existingPendingRequest = null;
        if(rideRequest){
          const userRequests = rideRequest.requests.filter(r => r.userId.toString() === user._id.toString());
          userExistingSeats = userRequests
            .filter(r => r.status === 'pending' || r.status === 'accepted')
            .reduce((sum, r) => sum + (r.seatsRequested || 0), 0);
          
          existingPendingRequest = userRequests.find(r => r.status === 'pending');
        }

        // Calculate available seats for this user (total vacancies minus their existing seats)
        const availableForUser = ride.noOfVacancies - userExistingSeats;
        
        // Validate request
        if(availableForUser <= 0){
          return res.status(400).json({error: `You have already requested all available seats. You can request up to ${ride.noOfVacancies} seat(s) total for this ride.`});
        }
        
        if(seats > availableForUser){
          return res.status(400).json({error: `You can only request up to ${availableForUser} more seat(s). You already have ${userExistingSeats} seat(s) (pending/accepted) out of ${ride.noOfVacancies} total available.`});
        }

        const request= {
          userId: user._id,
          seatsRequested: seats, 
          status: 'pending',
          requestedAt: new Date(),
        }
        
        if(!rideRequest){
          // Create new request document
          rideRequest = new Request({
            rideId,
            requests: [request],
          });
        } else {
          if(existingPendingRequest){
            // Update existing pending request
            existingPendingRequest.seatsRequested += seats;
            existingPendingRequest.requestedAt = new Date();
          } else {
            // Create a new request (user has accepted/rejected requests or no previous requests)
            rideRequest.requests.push(request);
          }
        }
           
        await rideRequest.save();
        
        // Update user's requested rides list (only if not already present)
        const userDoc = await User.findById(user._id);
        if(userDoc && !userDoc.requestedRides.includes(rideRequest._id)){
          await User.findByIdAndUpdate(user._id, {
            $push: { requestedRides: rideRequest._id }
          });
        }
        
        return res.status(201).json({
          message: "Request created successfully", 
          request: rideRequest,
          availableSeats: availableForUser - seats
        });
        
     }catch(err){
       console.error('Error creating ride request:', err);
       return res.status(500).json({error: err.message || "Failed to create request"});
     }
});


//ride owner accepting or rejecting the request
requestRouter.post('/ride/:rideId/:reqId', userAuth, async (req, res) => {
    const { rideId, reqId } = req.params;

    const {status}=req.body;
    try {
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ error: "Ride not found" });
        }

        // Ensure only the ride owner can accept/reject requests
        if (ride.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Forbidden: Only the ride owner can respond to requests" });
        }

        const rideRequest = await Request.findOne({rideId});
        if (!rideRequest) {
            return res.status(404).json({ error: "No requests found for this ride" });
        }
          
        // Find the specific pending request for this user
        const request = rideRequest.requests.find(r => {
          const userId = typeof r.userId === 'object' ? r.userId._id : r.userId;
          return userId.toString() === reqId && r.status === 'pending';
        });

        if (!request) {
            return res.status(404).json({ error: "Pending request not found for this user" });
        }
        
        if (status !== 'accepted' && status !== 'rejected') {
            return res.status(400).json({ error: "Invalid status update" });
        }
        
        if(status === 'accepted') {
          // Check if requested seats are less than or equal to available vacancies
          if(request.seatsRequested > ride.noOfVacancies) {
            return res.status(400).json({ error: `Not enough vacancies available. Only ${ride.noOfVacancies} seat(s) remaining` });
          }

          // Accept the request
          request.status = 'accepted';
          
          // Update ride vacancies
          ride.noOfVacancies -= request.seatsRequested;
          
          // If vacancies are filled (0 or less), reject all remaining pending requests
          if(ride.noOfVacancies <= 0){
            rideRequest.requests.forEach(req => {
              if(req.status === 'pending' && req._id.toString() !== request._id.toString()) {
                req.status = 'rejected';
              }
            });
          }
          
          await ride.save();
        } else {
          // Reject the request
          request.status = 'rejected';
        }
        
        await rideRequest.save();

        res.status(200).json({ 
          message: status === 'accepted' ? "Request accepted successfully" : "Request rejected successfully", 
          request,
          ride: {
            noOfVacancies: ride.noOfVacancies
          }
        });
    } catch (err) {
        res.status(500).json({ Error: err.message });
    }
});


requestRouter.get('/ride/:rideId', userAuth, async (req, res) => {
    const {rideId}=req.params;
    try{
        const requests = await Request.find({ rideId: rideId })
            .populate('requests.userId', 'firstName lastName email')
            .populate('rideId', 'fromPlace toPlace date starttime');
        
        if (!requests || requests.length === 0) {
            return res.status(404).json({ message: "No requests found for this ride" });
        }
        
        res.status(200).json(requests);
    }catch(err){
        res.status(500).json({ Error: "Failed to fetch requests", details: err.message });
    }
});

// Get all requests made by a user (ensure user can only view their own requests)
requestRouter.get('/:userId', userAuth, async (req, res) => {
  const { userId } = req.params;
  try {
    if (req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Forbidden: You can only view your own requests" });
    }

    const requests = await Request.find({ "requests.userId": userId })
      .populate('rideId')
      .lean();

    const result = requests.map(reqDoc => {
      const userReqs = reqDoc.requests.filter(r => r.userId.toString() === userId);
      if (!userReqs.length) return null;

      // Sum seats across all requests for this ride by the user
      const seatsRequested = userReqs.reduce((sum, r) => sum + (r.seatsRequested || 0), 0);

      // Use the latest request to represent current status/timestamp
      const latestReq = userReqs.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))[0];

      return {
        rideId: reqDoc.rideId,
        status: latestReq?.status,
        seatsRequested,
        requestedAt: latestReq?.requestedAt,
      };
    }).filter(Boolean);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No requests found for this user" });
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user's requests", details: err.message });
  }
});



module.exports = requestRouter;