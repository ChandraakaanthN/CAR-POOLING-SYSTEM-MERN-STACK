const express = require('express');
const reviewsRouter = express.Router();
const userAuth = require('../middlewares/auth');
//const isAdmin = require('../middlewares/isAdmin');
const User = require('../models/user');
const Review = require('../models/reviews');


// GET /reviews/rider/:riderId
reviewsRouter.get('/rider/:riderId', async (req, res) => {
  try {
    const { riderId } = req.params;
    const reviews = await Review.find({ rider: riderId })
      .populate('reviewer', 'firstName lastName') 
      .sort({ createdAt: -1 }); 

    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

reviewsRouter.post('/:rideId', userAuth, async (req, res) => {
  try {
    const reviewerId = req.user._id; 
    const { rideId } = req.params;
    const { rating, comment } = req.body;

    // Validate rating presence and number range (optional, since schema has validation)
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // Optional: Prevent users reviewing themselves
    if (reviewerId.toString() === rideId) {
      return res.status(400).json({ error: "You cannot review yourself" });
    }
    const review = new Review({
      reviewer: reviewerId,
      rider: rideId,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post review' });
  }
});

module.exports = reviewsRouter;
