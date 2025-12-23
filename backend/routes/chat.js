const express = require('express');
const chatRouter = express.Router();
const userAuth = require('../middlewares/auth');
const Chat = require('../models/chat');
const Request = require('../models/requests');
const Ride = require('../models/ride');

// Get chat for a specific ride (only for participants)
chatRouter.get('/:rideId', userAuth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user._id;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Check if user is the ride owner
    const isOwner = ride.owner.toString() === userId.toString();
    
    // Check if user has an accepted request for this ride
    const request = await Request.findOne({
      rideId: rideId,
      'requests.userId': userId,
      'requests.status': 'accepted'
    });

    // Only allow access if user is owner or has accepted request
    if (!isOwner && !request) {
      return res.status(403).json({ error: 'Access denied. Only ride owner and accepted passengers can access this chat.' });
    }

    // Find existing chat
    let chat = await Chat.findOne({ rideId: rideId })
      .populate('participants', 'firstName lastName')
      .populate('messages.sender', 'firstName lastName');

    if (!chat) {
      // Create new chat with ride owner and ALL accepted passengers
      const participants = [ride.owner];
      
      // Get all accepted requests for this ride
      const allRequests = await Request.findOne({ rideId: rideId });
      if (allRequests) {
        const acceptedRequests = allRequests.requests.filter(req => req.status === 'accepted');
        acceptedRequests.forEach(req => {
          if (!participants.some(p => p.toString() === req.userId.toString())) {
            participants.push(req.userId);
          }
        });
      }

      chat = new Chat({
        rideId: rideId,
        participants: participants,
        messages: []
      });
      await chat.save();
      
      // Populate after save
      chat = await Chat.findById(chat._id)
        .populate('participants', 'firstName lastName')
        .populate('messages.sender', 'firstName lastName');
    } else {
      // Update participants if new passengers have been accepted
      const allRequests = await Request.findOne({ rideId: rideId });
      if (allRequests) {
        const acceptedRequests = allRequests.requests.filter(req => req.status === 'accepted');
        const currentParticipants = chat.participants.map(p => p._id.toString());
        const newParticipants = [ride.owner];
        
        acceptedRequests.forEach(req => {
          if (!newParticipants.some(p => p.toString() === req.userId.toString())) {
            newParticipants.push(req.userId);
          }
        });

        // Check if participants list needs updating
        const needsUpdate = newParticipants.length !== currentParticipants.length ||
          newParticipants.some(p => !currentParticipants.includes(p.toString()));

        if (needsUpdate) {
          chat.participants = newParticipants;
          await chat.save();
          
          // Re-populate after update
          chat = await Chat.findById(chat._id)
            .populate('participants', 'firstName lastName')
            .populate('messages.sender', 'firstName lastName');
        }
      }
    }

    res.json(chat);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// Get all chats for current user
chatRouter.get('/', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find chats where user is a participant
    const chats = await Chat.find({
      participants: userId
    })
    .populate('rideId', 'fromPlace toPlace date starttime vehicleName')
    .populate('participants', 'firstName lastName')
    .populate('messages.sender', 'firstName lastName')
    .sort({ lastMessage: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

module.exports = chatRouter; 