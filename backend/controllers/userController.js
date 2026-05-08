/*
 * User Management Controller
 *
 * This file handles all user-related operations (admin only):
 * - Get all users (with filtering and pagination)
 * - Get single user details
 * - Update user (with AUTOMATIC FEE NOTES generation)
 * - Delete user
 * - Approve/reject driver applications
 *
 * IMPORTANT: The updateUser function automatically tracks all fee-related changes:
 * - When feeStatus changes: Records "Fee marked as [status] by [admin] on [date]"
 * - When assignedRoute changes: Records "Assigned to route [name] by [admin] on [date]"
 * - When assignedBus changes: Records "Assigned to bus [number] by [admin] on [date]"
 * This creates an audit trail that helps admins track fee management history.
 */

const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const { role, status, isDisplaced, assignedBus, page = 1, limit = 10 } = req.query;

  // Build filter object
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (isDisplaced) filter.isDisplaced = isDisplaced === 'true';
  if (assignedBus) filter.assignedBus = assignedBus;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get users with pagination
  const users = await User.find(filter)
    .populate({
      path: 'assignedBus',
      select: 'busNumber model year capacity',
      populate: [
        { path: 'driverId', select: 'name email phone' },
        { path: 'routeId', select: 'routeName routeNo' }
      ]
    })
    .populate('assignedRoute', 'routeName routeNo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await User.countDocuments(filter);

  res.json({
    success: true,
    data: users,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate({
      path: 'assignedBus',
      populate: [
        { path: 'driverId', select: 'name email phone' },
        { path: 'routeId', select: 'routeName routeNo stops departureTime estimatedDuration distance' }
      ]
    })
    .populate('assignedRoute', 'routeName routeNo stops departureTime estimatedDuration distance');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, studentId, licenseNumber, assignedBus, assignedRoute } = req.body;
  const files = req.files || {};

  // Validation
  if (role === 'driver' && (!files.drivingLicense || files.drivingLicense.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Driving license PDF is required for driver registration'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Check if student ID already exists for students
  if (role === 'student' && studentId) {
    const existingStudent = await User.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student ID already exists'
      });
    }
  }

  // Check if license number already exists for drivers
  if (role === 'driver' && licenseNumber) {
    const existingDriver = await User.findOne({ licenseNumber });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: 'License number already exists'
      });
    }
  }

  // Prepare user data
  const userData = {
    name,
    email,
    password,
    role,
    phone
  };

  if (files.profilePicture && files.profilePicture.length > 0) {
    userData.profilePicture = 'uploads/profiles/' + files.profilePicture[0].filename;
  }

  // Add role-specific fields
  if (role === 'student') {
    userData.studentId = studentId;
    userData.feeStatus = 'pending';
    if (assignedBus) userData.assignedBus = assignedBus;
    if (assignedRoute) userData.assignedRoute = assignedRoute;
  } else if (role === 'driver') {
    userData.licenseNumber = licenseNumber;
    userData.drivingLicenseFile = 'uploads/licenses/' + files.drivingLicense[0].filename;
  }

  // Create user
  const user = await User.create(userData);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, status, feeStatus, assignedRoute, assignedBus } = req.body;

  // Find the existing user to compare changes
  const user = await User.findById(req.params.id)
    .populate('assignedRoute', 'routeName')
    .populate('assignedBus', 'busNumber');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get the admin who is making this update
  const adminName = req.user.name; // The logged-in admin's name
  const adminId = req.user._id;

  // Generate timestamp for the note
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Initialize variables for tracking changes
  let feeNoteEntries = [];

  // AUTOMATIC FEE NOTES GENERATION
  // Check if feeStatus changed
  if (feeStatus && feeStatus !== user.feeStatus) {
    const statusMap = {
      'paid': 'Paid',
      'partially_paid': 'Partially Paid',
      'pending': 'Pending'
    };
    feeNoteEntries.push(
      `Fee marked as ${statusMap[feeStatus]} by ${adminName} on ${timestamp}`
    );
  }

  // Check if assignedRoute changed
  if (assignedRoute !== undefined) {
    // Convert to string for comparison
    const oldRouteId = user.assignedRoute?._id?.toString();
    const newRouteId = assignedRoute?.toString();

    if (oldRouteId !== newRouteId) {
      if (!newRouteId) {
        // Route was removed
        feeNoteEntries.push(
          `Unassigned from route by ${adminName} on ${timestamp}`
        );
      } else {
        // Route was changed or newly assigned
        const routeData = await Route.findById(newRouteId);
        if (routeData) {
          feeNoteEntries.push(
            `Assigned to route "${routeData.routeName}" by ${adminName} on ${timestamp}`
          );
        }
      }
    }
  }

  let shouldClearDisplaced = false;

  // Check if assignedBus changed
  if (assignedBus !== undefined) {
    // Convert to string for comparison
    const oldBusId = user.assignedBus?._id?.toString();
    const newBusId = assignedBus?.toString();

    if (oldBusId !== newBusId) {
      if (!newBusId) {
        // Bus was removed
        feeNoteEntries.push(
          `Unassigned from bus by ${adminName} on ${timestamp}`
        );
      } else {
        // Bus was changed or newly assigned
        const busData = await Bus.findById(newBusId);
        if (busData) {
          // Check if there is capacity
          if (busData.capacity <= 0) {
            return res.status(400).json({
              success: false,
              message: `Bus ${busData.busNumber} is full. Cannot assign user.`
            });
          }

          feeNoteEntries.push(
            `Assigned to bus "${busData.busNumber}" by ${adminName} on ${timestamp}`
          );

          // Clear displaced flag when assigned to a valid bus
          shouldClearDisplaced = true;
        }
      }

      // CAPACITY MANAGEMENT
      // 1. If there was an old bus, increment its capacity
      if (oldBusId) {
        await Bus.findByIdAndUpdate(oldBusId, { $inc: { capacity: 1 } });
      }

      // 2. If there is a new bus, decrement its capacity
      if (newBusId) {
        await Bus.findByIdAndUpdate(newBusId, { $inc: { capacity: -1 } });
      }
    }
  }

  // Build the update object
  const updateData = { name, email, phone, status, feeStatus, assignedRoute, assignedBus };

  if (shouldClearDisplaced) {
    updateData.isDisplaced = false;
  }

  // Handle activatedAt when status changes to 'active'
  // This is needed because findByIdAndUpdate bypasses the pre-save hook
  if (status === 'active' && user.status !== 'active' && !user.activatedAt) {
    updateData.activatedAt = new Date();
    console.log(`[updateUser] Setting activatedAt for user ${user.email} to ${updateData.activatedAt}`);
  }

  // If there were any fee-related changes, append to feeNotes
  if (feeNoteEntries.length > 0) {
    const newNote = feeNoteEntries.join('\n');
    const existingNotes = user.feeNotes || '';

    // Append new notes to existing notes (with separator if notes already exist)
    updateData.feeNotes = existingNotes
      ? `${existingNotes}\n${newNote}`
      : newNote;

    // Update fee tracking fields
    updateData.feeUpdatedAt = new Date();
    updateData.feeUpdatedBy = adminId;
  }

  // Update user with all changes including automatic fee notes
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate({
    path: 'assignedBus',
    select: 'busNumber model year',
    populate: [
      { path: 'driverId', select: 'name' },
      { path: 'routeId', select: 'routeName routeNo' }
    ]
  })
    .populate('assignedRoute', 'routeName routeNo')
    .populate('feeUpdatedBy', 'name email');

  res.json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Don't allow deleting admin users
  if (user.role === 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete admin users'
    });
  }

  // If user was assigned to a bus, free up the seat
  if (user.assignedBus) {
    await Bus.findByIdAndUpdate(user.assignedBus, { $inc: { capacity: 1 } });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Approve driver
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
const approveDriver = asyncHandler(async (req, res) => {
  const driver = await User.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
  }

  if (driver.role !== 'driver') {
    return res.status(400).json({
      success: false,
      message: 'User is not a driver'
    });
  }

  if (driver.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Driver is not pending approval'
    });
  }

  // Update driver status
  driver.status = 'active';
  await driver.save();

  console.log(`[approveDriver] Driver ${driver.email} approved. activatedAt: ${driver.activatedAt}`);

  await Notification.createSystemNotification(
    'Account Approved',
    'Your driver account has been approved. You can now access all driver features.',
    'driver',
    {
      receiverId: driver._id,
      type: 'success',
      priority: 'high',
      relatedEntity: { type: 'user', id: driver._id }
    }
  );

  res.json({
    success: true,
    message: 'Driver approved successfully',
    data: driver
  });
});

// @desc    Reject driver
// @route   PUT /api/users/:id/reject
// @access  Private/Admin
const rejectDriver = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const driver = await User.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
  }

  if (driver.role !== 'driver') {
    return res.status(400).json({
      success: false,
      message: 'User is not a driver'
    });
  }

  if (driver.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Driver is not pending approval'
    });
  }

  // Update driver status
  driver.status = 'suspended';
  await driver.save();

  await Notification.createSystemNotification(
    'Account Rejected',
    `Your driver account application has been rejected. Reason: ${reason || 'No reason provided'}`,
    'driver',
    {
      receiverId: driver._id,
      type: 'error',
      priority: 'high',
      relatedEntity: { type: 'user', id: driver._id }
    }
  );

  res.json({
    success: true,
    message: 'Driver rejected successfully',
    data: driver
  });
});

// @desc    Get pending drivers
// @route   GET /api/users/pending-drivers
// @access  Private/Admin
const getPendingDrivers = asyncHandler(async (req, res) => {
  const pendingDrivers = await User.find({
    role: 'driver',
    status: 'pending'
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: pendingDrivers
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        suspended: {
          $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
        }
      }
    }
  ]);

  const totalUsers = await User.countDocuments();
  const totalActive = await User.countDocuments({ status: 'active' });
  const totalPending = await User.countDocuments({ status: 'pending' });
  const totalSuspended = await User.countDocuments({ status: 'suspended' });

  res.json({
    success: true,
    data: {
      total: totalUsers,
      active: totalActive,
      pending: totalPending,
      suspended: totalSuspended,
      byRole: stats
    }
  });
});

// @desc    Get driver's license PDF
// @route   GET /api/users/:id/license
// @access  Private/Admin
const getDriverLicense = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.role !== 'driver') {
    return res.status(400).json({
      success: false,
      message: 'User is not a driver'
    });
  }

  if (!user.drivingLicenseFile) {
    return res.status(404).json({
      success: false,
      message: 'No driving license file found for this driver'
    });
  }

  const filePath = path.join(__dirname, '..', user.drivingLicenseFile);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'Driving license file not found on server'
    });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${user.drivingLicenseFile}"`);
  res.sendFile(filePath);
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  approveDriver,
  rejectDriver,
  getPendingDrivers,
  getUserStats,
  getDriverLicense
};
