const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  profilePicture: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['admin', 'driver', 'student'],
    required: [true, 'Role is required'],
    default: 'student'
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^0\d{10}$/, 'Please enter a valid phone number (e.g., 03201033144)']
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended'],
    default: function () {
      if (this.role === 'admin') return 'active';
      if (this.role === 'driver') return 'pending';
      return 'active';
    }
  },
  activatedAt: {
    type: Date,
    required: false
  },
  studentId: {
    type: String,
    required: function () {
      return this.role === 'student';
    },
    unique: function () {
      return this.role === 'student';
    },
    sparse: true
  },
  feeStatus: {
    type: String,
    enum: ['paid', 'partially_paid', 'pending'],
    default: 'pending',
    required: function () {
      return this.role === 'student';
    }
  },
  isDisplaced: {
    type: Boolean,
    default: false,
    required: false
  },
  // Fee Notes - Automatic log of all fee-related actions
  // Stores a timestamped history of fee status changes, route assignments, and bus assignments
  // Format: "Action by Admin Name on Date Time\n"
  // Example: "Fee marked as paid by Admin John on Feb 5, 2024 10:30 AM\nAssigned to Route 1 by Admin John on Feb 5, 2024 10:35 AM"
  feeNotes: {
    type: String,
    default: '',
    required: false
  },
  // Fee Updated At - Timestamp of last fee-related update
  // Automatically set whenever feeStatus, assignedRoute, or assignedBus changes
  feeUpdatedAt: {
    type: Date,
    required: false
  },
  // Fee Updated By - Reference to the admin who made the last fee-related update
  // Used to track which admin made changes for accountability
  feeUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  assignedRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: false // Will be assigned later by admin
  },
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: false // Will be assigned later by admin
  },
  licenseNumber: {
    type: String,
    required: function () {
      return this.role === 'driver';
    }
  },
  drivingLicenseFile: {
    type: String,
    required: function () {
      return this.role === 'driver';
    }
  },
  // Student-specific fields
  routeNo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: false
  },
  stopName: {
    type: String,
    required: false
  },
  emergencyContact: {
    type: String,
    required: false,
    match: [/^0\d{10}$/, 'Please enter a valid phone number (e.g., 03201033144)'],
    validate: {
      validator: function (value) {
        // If emergencyContact is provided, validate it
        return !value || /^0\d{10}$/.test(value);
      },
      message: 'Please enter a valid phone number (e.g., 03201033144)'
    }
  },
  address: {
    type: String,
    required: false
  },
  feePaymentType: {
    type: String,
    enum: ['full', 'half', 'custom'],
    default: 'full',
    required: false
  },
  customInstallment: {
    type: Number,
    required: false
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

// Hash password before saving
userSchema.pre('save', async function (next) {
  const needsPasswordHash = this.isModified('password');
  const needsActivatedAt = (this.isNew && this.status === 'active' && !this.activatedAt) ||
    (this.isModified('status') && this.status === 'active' && !this.activatedAt);

  if (!needsPasswordHash && !needsActivatedAt) return next();

  try {
    if (needsPasswordHash) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }

    if (needsActivatedAt) {
      this.activatedAt = new Date();
      console.log(`[User Model] Setting activatedAt for user ${this.email} to ${this.activatedAt}`);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);

