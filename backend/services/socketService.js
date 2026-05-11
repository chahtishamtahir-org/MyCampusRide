/**
 * Socket.IO Service
 * 
 * Centralized service for managing Socket.IO operations and room-based communication.
 * Handles real-time events, room management, and broadcast operations.
 * 
 * This service provides a clean interface for other parts of the application
 * to emit events without directly accessing the Socket.IO instance.
 */

// Global Socket.IO instance (set during server initialization)
let ioInstance = null;

/**
 * Initialize Socket.IO service with the server instance
 * @param {Object} io - Socket.IO server instance
 */
const initializeSocketService = (io) => {
  ioInstance = io;
  console.log('✅ Socket.IO service initialized');
};


/**
 * Broadcast location update to relevant rooms
 * @param {Object} locationData - Location update data
 * @param {string} locationData.busId - Bus ID
 * @param {string} locationData.routeId - Route ID
 * @param {Object} locationData.location - Location coordinates
 * @param {number} locationData.location.latitude - Latitude
 * @param {number} locationData.location.longitude - Longitude
 * @param {string} locationData.location.address - Address
 */
const broadcastLocationUpdate = (locationData) => {
  if (!ioInstance) {
    console.warn('Socket.IO not initialized');
    return;
  }

  const { busId, routeId, location } = locationData;
  const timestamp = new Date().toISOString();

  // Emit to all relevant rooms
  const eventData = {
    busId,
    location,
    timestamp,
    routeId
  };

  // Admins get all location updates
  ioInstance.to('admin-room').emit('bus-location-update', eventData);
  
  // Students on the same route
  if (routeId) {
    ioInstance.to(`route-${routeId}`).emit('bus-location-update', eventData);
  }
  
  // Specific bus followers
  ioInstance.to(`bus-${busId}`).emit('bus-location-update', eventData);

  console.log(`📡 Broadcast location update for bus ${busId}`);
};

/**
 * Broadcast trip status change
 * @param {Object} tripData - Trip information
 * @param {string} tripData.busId - Bus ID
 * @param {string} tripData.routeId - Route ID
 * @param {string} tripData.driverId - Driver ID
 * @param {string} tripData.busNumber - Bus number
 * @param {string} tripData.status - Trip status ('started' or 'ended')
 */
const broadcastTripStatus = (tripData) => {
  if (!ioInstance) {
    console.warn('Socket.IO not initialized');
    return;
  }

  const { busId, routeId, driverId, busNumber, status } = tripData;
  const timestamp = new Date().toISOString();

  const eventData = {
    type: status,
    busId,
    routeId,
    driverId,
    busNumber,
    timestamp
  };

  // Notify admins
  ioInstance.to('admin-room').emit('trip-notification', eventData);
  
  // Notify students on this route
  if (routeId) {
    ioInstance.to(`route-${routeId}`).emit('trip-notification', {
      ...eventData,
      message: status === 'started' 
        ? `Bus ${busNumber} has started its trip`
        : `Bus ${busNumber} has completed its trip`
    });
  }

  console.log(`📢 Broadcast trip ${status} for bus ${busId} on route ${routeId}`);
};


/**
 * Emit a new notification to specific recipients or groups
 * @param {Object} notification - The notification object
 */
const emitNotification = (notification) => {
  if (!ioInstance) {
    console.warn('Socket.IO not initialized');
    return;
  }

  const { receiverId, receiverRole, title } = notification;

  // 1. If it's for a specific user
  if (receiverId) {
    ioInstance.to(`user-${receiverId}`).emit('new-notification', notification);
    console.log(`🔔 Emitted private notification to user ${receiverId}: ${title}`);
    return;
  }

  // 2. If it's for a specific role
  if (receiverRole && receiverRole !== 'all') {
    if (receiverRole === 'admin') {
      ioInstance.to('admin-room').emit('new-notification', notification);
    } else {
      ioInstance.to(`${receiverRole}-room`).emit('new-notification', notification);
    }
    console.log(`🔔 Emitted role notification to ${receiverRole}: ${title}`);
    return;
  }

  // 3. If it's for everyone
  if (receiverRole === 'all') {
    ioInstance.emit('new-notification', notification);
    console.log(`🔔 Emitted broadcast notification: ${title}`);
  }
};

module.exports = {
  initializeSocketService,
  broadcastLocationUpdate,
  broadcastTripStatus,
  emitNotification
};