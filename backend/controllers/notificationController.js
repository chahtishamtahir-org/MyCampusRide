/*
 * Notification Controller
 *
 * Handles notification operations:
 * - Get notifications (filtered by user role with pagination)
 * - Get single notification
 * - Create notification (admin sends to specific users/roles)
 * - Mark notification as read
 * - Mark all notifications as read
 * - Delete notification
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const Bus = require('../models/Bus');
const { asyncHandler } = require('../middleware/errorHandler');
const { emitNotification } = require('../services/socketService');


const getNotifications = asyncHandler(async (req, res) => {
  const { isRead, type, priority, page = 1, limit = 20 } = req.query;
  const userId = req.user._id;
  const userRole = req.user.role;
  const userStatus = req.user.status;
  const userActivatedAt = req.user.activatedAt;

  if (userStatus === 'pending' || userStatus === 'suspended') {
    return res.json({
      success: true,
      data: [],
      pagination: {
        current: 1,
        pages: 0,
        total: 0
      },
      unreadCount: 0
    });
  }

  const cutoffDate = userActivatedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filter = {
    $or: [
      { receiverId: userId },
      {
        receiverId: null,
        receiverRole: userRole,
        createdAt: { $gte: cutoffDate }
      },
      {
        receiverId: null,
        receiverRole: 'all',
        createdAt: { $gte: cutoffDate }
      }
    ]
  };

  if (isRead !== undefined) filter.isRead = isRead === 'true';
  if (type) filter.type = type;
  if (priority) filter.priority = priority;

  const skip = (page - 1) * limit;

  const notifications = await Notification.find(filter)
    .populate('senderId', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(filter);

  const unreadCount = await Notification.countDocuments({
    ...filter,
    isRead: false
  });

  res.json({
    success: true,
    data: notifications,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    },
    unreadCount
  });
});

const getNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const userStatus = req.user.status;

  if (userStatus === 'pending' || userStatus === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Account is not active.'
    });
  }

  const notification = await Notification.findById(req.params.id)
    .populate('senderId', 'name email role');

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  let hasAccess = false;
  if (notification.receiverId) {
    hasAccess = notification.receiverId.toString() === userId.toString();
  } else {
    hasAccess = notification.receiverRole === userRole || notification.receiverRole === 'all';
  }

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this notification'
    });
  }

  res.json({
    success: true,
    data: notification
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const userStatus = req.user.status;

  if (userStatus === 'pending' || userStatus === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Account is not active.'
    });
  }

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  let hasAccess = false;
  if (notification.receiverId) {
    hasAccess = notification.receiverId.toString() === userId.toString();
  } else {
    hasAccess = notification.receiverRole === userRole || notification.receiverRole === 'all';
  }

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this notification'
    });
  }

  await notification.markAsRead();

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const userStatus = req.user.status;
  const userActivatedAt = req.user.activatedAt;

  if (userStatus === 'pending' || userStatus === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Account is not active.'
    });
  }

  const cutoffDate = userActivatedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filter = {
    $or: [
      { receiverId: userId },
      {
        receiverId: null,
        receiverRole: userRole,
        createdAt: { $gte: cutoffDate }
      },
      {
        receiverId: null,
        receiverRole: 'all',
        createdAt: { $gte: cutoffDate }
      }
    ],
    isRead: false
  };

  const result = await Notification.updateMany(filter, {
    isRead: true,
    readAt: new Date()
  });

  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`
  });
});

const sendNotification = asyncHandler(async (req, res) => {
  const { title, message, type, priority, targetType, targetRole, receiverId } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Title and message are required'
    });
  }

  if (!targetType) {
    return res.status(400).json({
      success: false,
      message: 'Target type is required (individual, role, or all)'
    });
  }

  const senderId = req.user._id;
  const senderRole = req.user.role;

  const notifications = [];

  try {
    if (targetType === 'individual') {
      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID is required for individual notifications'
        });
      }

      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }

      const notification = await Notification.create({
        title,
        message,
        type: type || 'info',
        senderRole,
        senderId,
        receiverRole: receiver.role,
        receiverId: receiver._id,
        priority: priority || 'medium'
      });

      await notification.populate('senderId', 'name email role');
      emitNotification(notification);
      notifications.push(notification);
    }
    else if (targetType === 'role') {
      if (!targetRole) {
        return res.status(400).json({
          success: false,
          message: 'Target role is required for role-based notifications'
        });
      }

      if (!['student', 'driver', 'admin'].includes(targetRole)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid target role'
        });
      }

      const notification = await Notification.create({
        title,
        message,
        type: type || 'info',
        senderRole,
        senderId,
        receiverRole: targetRole,
        receiverId: null,
        priority: priority || 'medium'
      });

      await notification.populate('senderId', 'name email role');
      emitNotification(notification);
      notifications.push(notification);
    }
    else if (targetType === 'bus') {
      const { busId } = req.body;

      if (!busId) {
        return res.status(400).json({
          success: false,
          message: 'Bus ID is required for bus-targeted notifications'
        });
      }

      // Validate the bus exists and belongs to this driver
      const bus = await Bus.findById(busId);
      if (!bus) {
        return res.status(404).json({
          success: false,
          message: 'Bus not found'
        });
      }

      if (senderRole === 'driver' && bus.driverId.toString() !== senderId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only send alerts to students on your own bus'
        });
      }

      // Find all students assigned to this bus
      const students = await User.find({ assignedBus: busId, role: 'student', status: 'active' });

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No students assigned to this bus'
        });
      }

      // Create individual notifications for each student
      for (const student of students) {
        const notification = await Notification.create({
          title,
          message,
          type: type || 'warning',
          senderRole,
          senderId,
          receiverRole: 'student',
          receiverId: student._id,
          priority: priority || 'medium',
          relatedEntity: {
            type: 'bus',
            id: bus._id
          }
        });
        await notification.populate('senderId', 'name email role');
        emitNotification(notification);
        notifications.push(notification);
      }
    }
    else if (targetType === 'all') {
      const notification = await Notification.create({
        title,
        message,
        type: type || 'info',
        senderRole,
        senderId,
        receiverRole: 'all',
        receiverId: null,
        priority: priority || 'medium'
      });

      await notification.populate('senderId', 'name email role');
      emitNotification(notification);
      notifications.push(notification);
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'Invalid target type. Must be individual, role, bus, or all'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notifications
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const userStatus = req.user.status;

  if (userStatus === 'pending' || userStatus === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Account is not active.'
    });
  }

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  let hasAccess = false;
  if (userRole === 'admin') {
    hasAccess = true;
  } else if (notification.receiverId) {
    hasAccess = notification.receiverId.toString() === userId.toString();
  } else {
    hasAccess = notification.receiverRole === userRole || notification.receiverRole === 'all';
  }

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to delete this notification'
    });
  }

  await Notification.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

const getNotificationStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const userStatus = req.user.status;
  const userActivatedAt = req.user.activatedAt;

  if (userStatus === 'pending' || userStatus === 'suspended') {
    return res.json({
      success: true,
      data: {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {}
      }
    });
  }

  const cutoffDate = userActivatedAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filter = {
    $or: [
      { receiverId: userId },
      {
        receiverId: null,
        receiverRole: userRole,
        createdAt: { $gte: cutoffDate }
      },
      {
        receiverId: null,
        receiverRole: 'all',
        createdAt: { $gte: cutoffDate }
      }
    ]
  };

  const stats = await Notification.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        },
        byType: {
          $push: {
            type: '$type',
            isRead: '$isRead'
          }
        },
        byPriority: {
          $push: {
            priority: '$priority',
            isRead: '$isRead'
          }
        }
      }
    }
  ]);

  const result = stats[0] || { total: 0, unread: 0, byType: [], byPriority: [] };

  const typeCounts = {};
  result.byType.forEach(item => {
    if (!typeCounts[item.type]) {
      typeCounts[item.type] = { total: 0, unread: 0 };
    }
    typeCounts[item.type].total++;
    if (!item.isRead) typeCounts[item.type].unread++;
  });

  const priorityCounts = {};
  result.byPriority.forEach(item => {
    if (!priorityCounts[item.priority]) {
      priorityCounts[item.priority] = { total: 0, unread: 0 };
    }
    priorityCounts[item.priority].total++;
    if (!item.isRead) priorityCounts[item.priority].unread++;
  });

  res.json({
    success: true,
    data: {
      total: result.total,
      unread: result.unread,
      byType: typeCounts,
      byPriority: priorityCounts
    }
  });
});

module.exports = {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  sendNotification,
  deleteNotification,
  getNotificationStats
};
