/*
 * Tracking Controller
 *
 * Handles real-time bus tracking operations:
 * - Start trip (marks bus as on trip, sends notification to students)
 * - Stop trip (marks bus as available, calculates trip duration)
 * - Update bus location (real-time location updates during trip)
 * - Get bus location (for students tracking their bus)
 * - Get all bus locations (for admin dashboard map view)
 */

const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const { broadcastLocationUpdate, broadcastTripStatus } = require('../services/socketService');

// @desc    Start trip
// @route   POST /api/tracking/start-trip
// @access  Private/Driver
const startTrip = asyncHandler(async (req, res) => {
  const driverId = req.user._id;

  // Find driver's assigned bus
  const bus = await Bus.findOne({ driverId })
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');
  
  if (!bus) {
    return res.status(404).json({
      success: false,
      message: 'No bus assigned to you'
    });
  }

  if (bus.isOnTrip) {
    return res.status(400).json({
      success: false,
      message: 'Trip is already in progress'
    });
  }

  if (bus.status !== 'available') {
    return res.status(400).json({
      success: false,
      message: 'Bus is not available for trips'
    });
  }

  // Start trip
  bus.isOnTrip = true;
  bus.status = 'on_trip';
  bus.tripStartTime = new Date();
  await bus.save();

  // Broadcast trip started to relevant users
  broadcastTripStatus({
    busId: bus._id,
    routeId: bus.routeId._id,
    driverId: driverId,
    busNumber: bus.busNumber,
    status: 'started'
  });

  // Create notification for students on this route
  await Notification.createSystemNotification(
    'Trip Started',
    `Bus ${bus.busNumber} has started its trip on route ${bus.routeId.routeName}`,
    'student',
    {
      type: 'info',
      priority: 'medium',
      relatedEntity: {
        type: 'bus',
        id: bus._id
      }
    }
  );

  res.json({
    success: true,
    message: 'Trip started successfully',
    data: {
      bus: bus,
      tripStartTime: bus.tripStartTime
    }
  });
});

// @desc    Stop trip
// @route   POST /api/tracking/stop-trip
// @access  Private/Driver
const stopTrip = asyncHandler(async (req, res) => {
  const driverId = req.user._id;

  // Find driver's assigned bus
  const bus = await Bus.findOne({ driverId })
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');
  
  if (!bus) {
    return res.status(404).json({
      success: false,
      message: 'No bus assigned to you'
    });
  }

  if (!bus.isOnTrip) {
    return res.status(400).json({
      success: false,
      message: 'No trip in progress'
    });
  }

  // Calculate trip duration
  const tripDuration = new Date() - bus.tripStartTime;
  const tripDurationMinutes = Math.round(tripDuration / (1000 * 60));

  // Stop trip
  bus.isOnTrip = false;
  bus.status = 'available';
  bus.tripStartTime = null;
  await bus.save();

  // Broadcast trip ended to relevant users
  broadcastTripStatus({
    busId: bus._id,
    routeId: bus.routeId._id,
    driverId: driverId,
    busNumber: bus.busNumber,
    status: 'ended'
  });

  // Create notification for students on this route
  await Notification.createSystemNotification(
    'Trip Completed',
    `Bus ${bus.busNumber} has completed its trip on route ${bus.routeId.routeName}. Duration: ${tripDurationMinutes} minutes`,
    'student',
    {
      type: 'success',
      priority: 'medium',
      relatedEntity: {
        type: 'bus',
        id: bus._id
      }
    }
  );

  res.json({
    success: true,
    message: 'Trip stopped successfully',
    data: {
      bus: bus,
      tripDuration: tripDurationMinutes
    }
  });
});

// @desc    Update bus location
// @route   PUT /api/tracking/update-location
// @access  Private/Driver
const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, address } = req.body;
  const driverId = req.user._id;

  // Find driver's assigned bus
  const bus = await Bus.findOne({ driverId });
  
  if (!bus) {
    return res.status(404).json({
      success: false,
      message: 'No bus assigned to you'
    });
  }

  if (!bus.isOnTrip) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update location when not on a trip'
    });
  }

  // Update location
  bus.currentLocation = {
    latitude,
    longitude,
    address: address || 'Location not available'
  };
  bus.lastLocationUpdate = new Date();
  await bus.save();

  // Broadcast location update to relevant users
  broadcastLocationUpdate({
    busId: bus._id,
    routeId: bus.routeId?._id,
    location: bus.currentLocation
  });

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: {
      bus: bus,
      location: bus.currentLocation,
      lastUpdate: bus.lastLocationUpdate
    }
  });
});

// @desc    Get bus location
// @route   GET /api/tracking/bus/:busId
// @access  Private
const getBusLocation = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.busId)
    .populate('driverId', 'name phone')
    .populate('routeId', 'routeName stops');
  
  if (!bus) {
    return res.status(404).json({
      success: false,
      message: 'Bus not found'
    });
  }

  res.json({
    success: true,
    data: {
      bus: bus,
      location: bus.currentLocation,
      isOnTrip: bus.isOnTrip,
      lastUpdate: bus.lastLocationUpdate,
      tripStartTime: bus.tripStartTime
    }
  });
});

// @desc    Get all active bus locations
// @route   GET /api/tracking/active-buses
// @access  Private
const getActiveBusLocations = asyncHandler(async (req, res) => {
  const activeBuses = await Bus.find({ 
    isOnTrip: true,
    status: 'on_trip'
  })
    .populate('driverId', 'name phone')
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');

  const busLocations = activeBuses.map(bus => ({
    busId: bus._id,
    busNumber: bus.busNumber,
    driver: bus.driverId,
    route: bus.routeId,
    location: bus.currentLocation,
    isOnTrip: bus.isOnTrip,
    lastUpdate: bus.lastLocationUpdate,
    tripStartTime: bus.tripStartTime
  }));

  res.json({
    success: true,
    data: busLocations
  });
});

// @desc    Get simulated bus locations (for when Google Maps API is not available)
// @route   GET /api/tracking/simulate
// @access  Private
const getSimulatedLocations = asyncHandler(async (req, res) => {
  const { routeId } = req.query;

  let buses;
  if (routeId) {
    buses = await Bus.find({ routeId, isOnTrip: true })
      .populate('driverId', 'name phone')
      .populate('routeId', 'routeName stops departureTime estimatedDuration distance');
  } else {
    buses = await Bus.find({ isOnTrip: true })
      .populate('driverId', 'name phone')
      .populate('routeId', 'routeName stops departureTime estimatedDuration distance');
  }

  // Generate simulated locations along the route
  const simulatedLocations = buses.map(bus => {
    const route = bus.routeId;
    const stops = route.stops || [];
    
    if (stops.length === 0) {
      return {
        busId: bus._id,
        busNumber: bus.busNumber,
        driver: bus.driverId,
        route: bus.routeId,
        location: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
          address: 'Simulated Location'
        },
        isOnTrip: bus.isOnTrip,
        lastUpdate: new Date(),
        tripStartTime: bus.tripStartTime,
        isSimulated: true
      };
    }

    // Pick a random stop or interpolate between stops
    const randomStopIndex = Math.floor(Math.random() * stops.length);
    const currentStop = stops[randomStopIndex];
    
    // Add some random offset to simulate movement
    const latOffset = (Math.random() - 0.5) * 0.001;
    const lngOffset = (Math.random() - 0.5) * 0.001;

    return {
      busId: bus._id,
      busNumber: bus.busNumber,
      driver: bus.driverId,
      route: bus.routeId,
      location: {
        latitude: currentStop.latitude + latOffset,
        longitude: currentStop.longitude + lngOffset,
        address: currentStop.address
      },
      isOnTrip: bus.isOnTrip,
      lastUpdate: new Date(),
      tripStartTime: bus.tripStartTime,
      isSimulated: true,
      currentStop: currentStop
    };
  });

  res.json({
    success: true,
    data: simulatedLocations,
    message: 'Simulated locations generated'
  });
});

// @desc    Get driver's trip status
// @route   GET /api/tracking/my-trip
// @access  Private/Driver
const getMyTripStatus = asyncHandler(async (req, res) => {
  const driverId = req.user._id;

  const bus = await Bus.findOne({ driverId })
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');
  
  if (!bus) {
    return res.status(404).json({
      success: false,
      message: 'No bus assigned to you'
    });
  }

  const tripData = {
    bus: bus,
    isOnTrip: bus.isOnTrip,
    tripStartTime: bus.tripStartTime,
    currentLocation: bus.currentLocation,
    lastLocationUpdate: bus.lastLocationUpdate,
    tripDuration: bus.isOnTrip && bus.tripStartTime 
      ? Math.round((new Date() - bus.tripStartTime) / (1000 * 60))
      : 0
  };

  res.json({
    success: true,
    data: tripData
  });
});

module.exports = {
  startTrip,
  stopTrip,
  updateLocation,
  getBusLocation,
  getActiveBusLocations,
  getSimulatedLocations,
  getMyTripStatus
};




