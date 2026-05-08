/*
 * Authentication Controller
 *
 * This file handles all authentication-related operations:
 * - User registration (with role-specific validation)
 * - User login (with password verification)
 * - Admin secret code validation (for admin registration security)
 * - JWT token generation (for maintaining user sessions)
 * - Getting current user information
 * - User logout
 *
 * SECURITY NOTE: Passwords are hashed before storage using bcrypt (in User model)
 */

const jwt = require('jsonwebtoken');
const Route = require('../models/Route');
const User = require('../models/User');
const Bus = require('../models/Bus');
const { asyncHandler } = require('../middleware/errorHandler');

// Generate JWT Token
// This creates a secure token that proves a user is logged in
// The token is stored in a cookie and sent with every request to verify identity
// Parameters:
//   - userId: The MongoDB _id of the user
// Returns: A signed JWT token string
const generateToken = (userId) => {
  // Get the secret key from environment variables (for security)
  // If not set, use a default (NOT recommended for production)
  const secret = process.env.JWT_SECRET || 'AhtKhz1314MyCampusRideSecretKey2024';

  // Create and sign the token
  // - Payload: { userId } - embeds the user ID in the token
  // - Secret: used to sign and verify the token
  // - ExpiresIn: token validity period (7 days)
  return jwt.sign({ userId }, secret, {
    expiresIn: '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, studentId, licenseNumber, adminSecretCode } = req.body;

  // FILE VALIDATION
  const files = req.files || {};

  // 1. Profile Picture is now OPTIONAL
  // Removed mandatory check

  // 2. Driving License is mandatory for DRIVERS
  if (role === 'driver' && (!files.drivingLicense || files.drivingLicense.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Driving license PDF is required for driver registration'
    });
  }

  // ADMIN SECRET CODE VALIDATION
  // If registering as admin, validate the secret code
  // This prevents unauthorized users from creating admin accounts
  // The secret code is stored in the .env file: ADMIN_SECRET_CODE
  if (role === 'admin') {
    // Check if secret code was provided
    if (!adminSecretCode) {
      return res.status(400).json({
        success: false,
        message: 'Admin secret code is required to register as admin'
      });
    }

    // Get the secret code from environment variables
    const correctSecretCode = process.env.ADMIN_SECRET_CODE;

    // Validate the provided secret code
    if (adminSecretCode !== correctSecretCode) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin secret code. Please contact the system administrator.'
      });
    }
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
  } else if (role === 'driver') {
    userData.licenseNumber = licenseNumber;
    userData.drivingLicenseFile = 'uploads/licenses/' + files.drivingLicense[0].filename;
  }

  // Create user
  const user = await User.create(userData);

  // Generate token
  const token = generateToken(user._id);

  // Set token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if user is suspended
  if (user.status === 'suspended') {
    return res.status(401).json({
      success: false,
      message: 'Account is suspended. Please contact administrator.'
    });
  }

  // Generate token
  const token = generateToken(user._id);

  // Set token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Set to false in development
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax' // More permissive for development
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON()
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'assignedBus',
      populate: [
        { path: 'driverId', select: 'name email phone' },
        { path: 'routeId', select: 'routeName routeNo stops departureTime estimatedDuration distance' }
      ]
    })
    .populate('assignedRoute', 'routeName routeNo stops departureTime estimatedDuration distance');

  res.json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const userId = req.user._id;

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name must be a non-empty string'
      });
    }
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters'
      });
    }
  }

  // Validate email if provided
  if (email !== undefined) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use by another account'
      });
    }
  }

  // Validate phone if provided
  if (phone !== undefined) {
    const phoneRegex = /^0\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone must be in format 03XXXXXXXXX (e.g., 03001234567)'
      });
    }
  }

  const updateData = {};

  if (name !== undefined) {
    updateData.name = name.trim();
  }

  if (email !== undefined) {
    updateData.email = email;
  }

  if (phone !== undefined) {
    updateData.phone = phone;
  }

  if (req.file) {
    updateData.profilePicture = 'uploads/profiles/' + req.file.filename;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile. Please try again.'
    });
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  // Get user with password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Select route for student
// @route   PUT /api/auth/select-route
// @access  Private (Student only)
const selectRoute = asyncHandler(async (req, res) => {
  const { routeId, stopName } = req.body;
  const userId = req.user._id;

  // Ensure user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only students can select a route'
    });
  }

  if (!routeId) {
    return res.status(400).json({
      success: false,
      message: 'Route ID is required'
    });
  }

  // Validate that the route exists and is active
  const route = await Route.findById(routeId);
  if (!route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }

  if (!route.isActive) {
    return res.status(400).json({
      success: false,
      message: 'This route is not currently active'
    });
  }

  // Validate stop if provided
  if (stopName && route.stops && route.stops.length > 0) {
    const validStop = route.stops.find(s => s.name === stopName);
    if (!validStop) {
      return res.status(400).json({
        success: false,
        message: 'Selected stop is not valid for this route'
      });
    }
  }

  // If user was previously assigned to a bus, free up the seat
  if (req.user.assignedBus) {
    await Bus.findByIdAndUpdate(req.user.assignedBus, { $inc: { capacity: 1 } });
  }

  // Update the student's assignedRoute, stopName, and clear bus
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { assignedRoute: routeId, assignedBus: null, stopName: stopName || null },
    { new: true, runValidators: true }
  ).populate('assignedRoute', 'routeName routeNo description departureTime distance estimatedDuration stops');

  res.json({
    success: true,
    message: `Route "${route.routeName}" selected successfully${stopName ? ` with stop "${stopName}"` : ''}`,
    data: updatedUser
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = asyncHandler(async (req, res) => {
  // Clear the token cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  selectRoute,
  logout
};

