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
 * Emit event to all admins (admin-room)
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToAdmins = (event, data) => {
  if (!ioInstance) {
    console.warn('Socket.IO not initialized');
    return;
  }
  ioInstance.to('admin-room').emit(event, data);
};

/**
 * Emit event to all users on a specific route
 * @param {string} routeId - Route ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToRoute = (routeId, event, data) => {
  if (!ioInstance) {
    console.warn('Socket.IO not initialized');
    return;
  }
  ioInstance.to(`route-${routeId}`).emit(event, data);
};

/**
 * Emit event to specific bus followers
 * @param {string} busId - Bus ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToBus = (busId, event, data) => {
  if (!ioInstance) {
    console.warn('Socket.IO not initialized');
    return;
  }
  ioInstance.to(`bus-${busId}`).emit(event, data);
};

/**
 * Emit event to specific driver
 * @param {string} driverId - Driver ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToDriver = (driverId, event, data) => {
  if (!ioInstance) {
    console.warn('Socket.IO not initialized');
    return;
  }
  ioInstance.to(`driver-${driverId}`).emit(event, data);
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
 * Get active room information
 * @returns {Object} Room statistics
 */
const getRoomStats = () => {
  if (!ioInstance) {
    return { error: 'Socket.IO not initialized' };
  }

  // This would require access to the internal room structure
  // For now, return basic info
  return {
    message: 'Room statistics available through server logs',
    timestamp: new Date().toISOString()
  };
};

/**
 * Force disconnect a specific socket
 * @param {string} socketId - Socket ID to disconnect
 */
const disconnectSocket = (socketId) => {
  if (!ioInstance) {
    console.warn('Socket.IO not initialized');
    return;
  }
  ioInstance.sockets.sockets.get(socketId)?.disconnect(true);
  console.log(`🔌 Force disconnected socket: ${socketId}`);
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
  emitToAdmins,
  emitToRoute,
  emitToBus,
  emitToDriver,
  broadcastLocationUpdate,
  broadcastTripStatus,
  emitNotification,
  getRoomStats,
  disconnectSocket
};