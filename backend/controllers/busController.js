/*
 * Bus Management Controller
 *
 * Handles all bus-related operations:
 * - Get all buses (with filtering and pagination)
 * - Get single bus details
 * - Create new bus
 * - Update bus information
 * - Delete bus
 * - Assign driver to bus
 * - Unassign driver from bus
 * - Assign route to bus
 * - Unassign route from bus
 */

const Bus = require('../models/Bus');
const User = require('../models/User');
const Route = require('../models/Route');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all buses
// @route   GET /api/buses
// @access  Private
const getBuses = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  // Build filter object
  const filter = {};
  if (status) filter.status = status;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get buses with pagination
  const buses = await Bus.find(filter)
    .populate('driverId', 'name email phone')
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance')
    .sort({ busNumber: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await Bus.countDocuments(filter);

  res.json({
    success: true,
    data: buses,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Get single bus
// @route   GET /api/buses/:id
// @access  Private
const getBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id)
    .populate('driverId', 'name email phone')
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');

  if (!bus) {
    return res.status(404).json({
      success: false,
      message: 'Bus not found'
    });
  }

  res.json({
    success: true,
    data: bus
  });
});

// @desc    Create new bus
// @route   POST /api/buses
// @access  Private/Admin
const createBus = asyncHandler(async (req, res) => {
  const { busNumber, driverId, routeId, capacity, model, year } = req.body;

  // Check if bus number already exists
  const existingBus = await Bus.findOne({ busNumber });
  if (existingBus) {
    return res.status(400).json({
      success: false,
      message: 'Bus number already exists'
    });
  }

  // Validate driver if provided
  if (driverId) {
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver' || driver.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver. Driver must be active.'
      });
    }

    // Check if driver is already assigned to another bus
    const existingDriverBus = await Bus.findOne({ driverId, status: { $ne: 'out_of_service' } });
    if (existingDriverBus) {
      return res.status(400).json({
        success: false,
        message: 'Driver is already assigned to another bus'
      });
    }
  }

  // Validate route if provided
  if (routeId) {
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(400).json({
        success: false,
        message: 'Route not found'
      });
    }
  }

  // Create bus
  const bus = await Bus.create({
    busNumber,
    driverId: driverId || null,
    routeId: routeId || null,
    capacity,
    model,
    year
  });

  // Populate the created bus
  const populatedBus = await Bus.findById(bus._id)
    .populate('driverId', 'name email phone')
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');

  res.status(201).json({
    success: true,
    message: 'Bus created successfully',
    data: populatedBus
  });
});

// @desc    Update bus
// @route   PUT /api/buses/:id
// @access  Private/Admin
const updateBus = asyncHandler(async (req, res) => {
  const { busNumber, driverId, routeId, capacity, model, year, status } = req.body;

  const bus = await Bus.findById(req.params.id);
  if (!bus) {
    return res.status(404).json({
      success: false,
      message: 'Bus not found'
    });
  }

  // Check if bus number already exists (excluding current bus)
  if (busNumber && busNumber !== bus.busNumber) {
    const existingBus = await Bus.findOne({ busNumber, _id: { $ne: req.params.id } });
    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Bus number already exists'
      });
    }
  }

  // Check if driver exists and is active (if driverId is being updated)
  const currentDriverId = bus.driverId ? bus.driverId.toString() : null;
  if (driverId && driverId !== currentDriverId) {
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver' || driver.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver. Driver must be active.'
      });
    }

    // Check if driver is already assigned to another bus
    const existingDriverBus = await Bus.findOne({
      driverId,
      _id: { $ne: req.params.id },
      status: { $ne: 'out_of_service' }
    });
    if (existingDriverBus) {
      return res.status(400).json({
        success: false,
        message: 'Driver is already assigned to another bus'
      });
    }
  }

  // Check if route exists (if routeId is being updated)
  const currentRouteId = bus.routeId ? bus.routeId.toString() : null;
  if (routeId && routeId !== currentRouteId) {
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(400).json({
        success: false,
        message: 'Route not found'
      });
    }
  }

  // Handle student displacement if status changes
  if (status) {
    const isNonActive = ['maintenance', 'out_of_service', 'inactive'].includes(status);
    const isActive = ['available', 'on_trip'].includes(status);

    if (isNonActive) {
      await User.updateMany(
        { assignedBus: req.params.id },
        { $set: { isDisplaced: true } }
      );
    } else if (isActive) {
      await User.updateMany(
        { assignedBus: req.params.id },
        { $set: { isDisplaced: false } }
      );
    }
  }

  // Update bus
  const updatedBus = await Bus.findByIdAndUpdate(
    req.params.id,
    { busNumber, driverId, routeId, capacity, model, year, status },
    { new: true, runValidators: true }
  ).populate('driverId', 'name email phone')
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');

  res.json({
    success: true,
    message: 'Bus updated successfully',
    data: updatedBus
  });
});

// @desc    Delete bus
// @route   DELETE /api/buses/:id
// @access  Private/Admin
const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) {
    return res.status(404).json({
      success: false,
      message: 'Bus not found'
    });
  }

  // Check if bus is currently on a trip
  if (bus.isOnTrip) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete bus that is currently on a trip'
    });
  }

  // Handle displaced students
  // Unassign bus and mark as displaced
  await User.updateMany(
    { assignedBus: req.params.id },
    {
      $set: {
        assignedBus: null,
        isDisplaced: true
      }
    }
  );

  await Bus.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Bus deleted successfully'
  });
});

// @desc    Get buses by driver
// @route   GET /api/buses/driver/:driverId
// @access  Private
const getBusesByDriver = asyncHandler(async (req, res) => {
  const buses = await Bus.find({ driverId: req.params.driverId })
    .populate('driverId', 'name email phone')
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');

  res.json({
    success: true,
    data: buses
  });
});

// @desc    Get buses by route
// @route   GET /api/buses/route/:routeId
// @access  Private
const getBusesByRoute = asyncHandler(async (req, res) => {
  const buses = await Bus.find({ routeId: req.params.routeId })
    .populate('driverId', 'name email phone')
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');

  res.json({
    success: true,
    data: buses
  });
});

// @desc    Get active buses
// @route   GET /api/buses/active
// @access  Private
const getActiveBuses = asyncHandler(async (req, res) => {
  const buses = await Bus.find({
    status: 'available',
    isActive: true
  })
    .populate('driverId', 'name email phone')
    .populate('routeId', 'routeName stops departureTime estimatedDuration distance');

  res.json({
    success: true,
    data: buses
  });
});

// @desc    Get bus statistics
// @route   GET /api/buses/stats
// @access  Private/Admin
const getBusStats = asyncHandler(async (req, res) => {
  const stats = await Bus.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalBuses = await Bus.countDocuments();
  const activeBuses = await Bus.countDocuments({ status: 'available' });
  const onTripBuses = await Bus.countDocuments({ isOnTrip: true });
  const maintenanceBuses = await Bus.countDocuments({ status: 'maintenance' });

  res.json({
    success: true,
    data: {
      total: totalBuses,
      active: activeBuses,
      onTrip: onTripBuses,
      maintenance: maintenanceBuses,
      byStatus: stats
    }
  });
});

module.exports = {
  getBuses,
  getBus,
  createBus,
  updateBus,
  deleteBus,
  getBusesByDriver,
  getBusesByRoute,
  getActiveBuses,
  getBusStats
};




