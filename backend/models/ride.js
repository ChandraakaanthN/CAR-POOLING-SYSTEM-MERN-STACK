// models/Ride.js

const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fromPlace: {
    type: String,
    required: true,
    trim: true,
  },
  toPlace: {
    type: String,
    required: true,
    trim: true,
  },
  // GeoJSON start and end
  fromLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  toLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined },
  },
  // Simplified route representation for proximity matching
  routePoints: {
    type: { type: String, enum: ['MultiPoint'], default: 'MultiPoint' },
    coordinates: { type: [[Number]], default: undefined }, // array of [lng, lat]
  },
  vehicleType: {
    type: String,
    required: true,
  },
  vehicleName: {
    type: String,
    required: true,
  },
  vehicleNumber: {
    type: String,
    required: true,
  },
  noOfVacancies: {
    type: Number,
    required: true,
    min: 0,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
  },
  starttime:{
   type: String,
   required: true,
  },
}, { timestamps: true });

rideSchema.index({ fromLocation: '2dsphere' });
rideSchema.index({ toLocation: '2dsphere' });
rideSchema.index({ routePoints: '2dsphere' });

module.exports = mongoose.model("Ride", rideSchema);
