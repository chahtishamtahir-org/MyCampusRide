const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  capacity: {
    type: Number,
    required: [true, 'Bus capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [100, 'Capacity cannot exceed 100']
  },
  currentLocation: {
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    },
    address: {
      type: String,
      default: 'Location not available'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnTrip: {
    type: Boolean,
    default: false
  },
  tripStartTime: {
    type: Date,
    default: null
  },
  lastLocationUpdate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['available', 'on_trip', 'maintenance', 'out_of_service', 'inactive'],
    default: 'available'
  },
  model: {
    type: String,
    required: [true, 'Bus model is required']
  },
  year: {
    type: Number,
    required: [true, 'Bus year is required'],
    min: [1990, 'Year must be 1990 or later'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries (busNumber already has unique index)
busSchema.index({ driverId: 1 });
busSchema.index({ routeId: 1 });
busSchema.index({ status: 1 });

module.exports = mongoose.model('Bus', busSchema);
