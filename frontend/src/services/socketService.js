/**
 * Socket Service
 * 
 * Centralized Socket.IO client connection management for the frontend.
 * Handles connection lifecycle, event listeners, and reconnection logic.
 * Provides a clean API for components to subscribe to real-time events.
 */

import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.eventListeners = new Map();
    this.userId = null;
    this.userRole = null;
  }

  /**
   * Initialize Socket.IO connection
   * @param {string} userId - Current user ID
   * @param {string} userRole - Current user role
   */
  connect(userId, userRole) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.userId = userId;
    this.userRole = userRole;

    // Determine backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';
    
    // Initialize socket connection
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
      withCredentials: true
    });

    this.setupEventListeners();

    // Restore any custom listeners that were registered before connection
    for (const [event, listeners] of this.eventListeners.entries()) {
      if (!this.socket.hasListeners(event)) {
        this.socket.on(event, (data) => this._triggerListeners(event, data));
      }
    }

    console.log(`🔌 Socket.IO connecting to ${backendUrl}`);
  }

  /**
   * Setup core socket event listeners
   */
  setupEventListeners() {
    // Connection established
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log(`✅ Socket.IO connected: ${this.socket.id}`);
      toast.success('Real-time tracking connected');
      
      // Auto-join appropriate room based on user role
      this.joinAppropriateRoom();
      
      this._triggerListeners('connect');
    });

    // Connection lost
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`🔌 Socket.IO disconnected: ${reason}`);
      
      if (reason === 'io server disconnect') {
        // Server actively disconnected, don't reconnect automatically
        toast.error('Tracking connection lost');
      } else {
        // Client-side disconnection, will attempt to reconnect
        toast.warn('Tracking connection lost, reconnecting...');
      }
      
      this._triggerListeners('disconnect', reason);
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attempt) => {
      this.reconnectAttempts = attempt;
      console.log(`🔄 Reconnection attempt ${attempt}`);
      this._triggerListeners('reconnect_attempt', attempt);
    });

    // Reconnection successful
    this.socket.on('reconnect', (attempt) => {
      this.isConnected = true;
      console.log(`✅ Reconnected after ${attempt} attempts`);
      toast.success('Tracking connection restored');
      
      // Rejoin rooms after reconnection
      this.joinAppropriateRoom();
      this._triggerListeners('reconnect', attempt);
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      this.isConnected = false;
      console.log('❌ Reconnection failed');
      toast.error('Unable to restore tracking connection');
      this._triggerListeners('reconnect_failed');
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      toast.error('Tracking connection error');
      this._triggerListeners('connect_error', error);
    });
  }

  /**
   * Helper to execute all registered external listeners for an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  _triggerListeners(event, data) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Join appropriate room based on user role
   */
  joinAppropriateRoom() {
    if (!this.userId || !this.userRole || !this.socket?.connected) {
      return;
    }

    let roomId;
    
    switch (this.userRole) {
      case 'admin':
        roomId = 'admin-room';
        break;
      case 'driver':
        roomId = `driver-${this.userId}`;
        break;
      case 'student':
        roomId = null; // Backend will still join user-specific and role-specific rooms
        break;
      default:
        console.warn(`Unknown user role: ${this.userRole}`);
        return;
    }

    this.joinRoom(roomId);
  }

  /**
   * Join a specific room
   * @param {string} roomId - Room identifier
   */
  joinRoom(roomId) {
    if (!this.socket?.connected) {
      console.warn('Cannot join room - not connected');
      return;
    }

    this.socket.emit('join-room', {
      userId: this.userId,
      role: this.userRole,
      roomId: roomId
    });

    console.log(`👥 Joined room: ${roomId}`);
  }

  /**
   * Leave a specific room
   * @param {string} roomId - Room identifier
   */
  leaveRoom(roomId) {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.leave(roomId);
    console.log(`🚪 Left room: ${roomId}`);
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler function
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event).push(callback);
    
    // Register with socket if not already registered
    if (!this.socket?.hasListeners(event)) {
      this.socket?.on(event, (data) => {
        this._triggerListeners(event, data);
      });
    }
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler function to remove
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    
    if (index > -1) {
      listeners.splice(index, 1);
    }
    
    // Remove socket listener if no more callbacks
    if (listeners.length === 0 && this.socket?.hasListeners(event)) {
      this.socket.off(event);
      this.eventListeners.delete(event);
    }
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn(`Cannot emit ${event} - not connected`);
      return;
    }
    
    this.socket.emit(event, data);
  }

  /**
   * Send location update (driver-specific)
   * @param {Object} locationData - Location information
   * @param {string} locationData.busId - Bus ID
   * @param {string} locationData.routeId - Route ID
   * @param {Object} locationData.location - Location coordinates
   * @param {number} locationData.location.latitude - Latitude
   * @param {number} locationData.location.longitude - Longitude
   * @param {string} locationData.location.address - Address
   */
  sendLocationUpdate(locationData) {
    this.emit('location-update', {
      ...locationData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send trip started notification
   * @param {Object} tripData - Trip information
   */
  sendTripStarted(tripData) {
    this.emit('trip-started', tripData);
  }

  /**
   * Send trip ended notification
   * @param {Object} tripData - Trip information
   */
  sendTripEnded(tripData) {
    this.emit('trip-ended', tripData);
  }

  /**
   * Check connection status
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Get connection info
   * @returns {Object} Connection information
   */
  getConnectionInfo() {
    return {
      connected: this.isConnected(),
      id: this.socket?.id || null,
      userId: this.userId,
      userRole: this.userRole,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      console.log('🔌 Socket.IO disconnected manually');
    }
  }

  /**
   * Cleanup service
   */
  cleanup() {
    this.disconnect();
    this.userId = null;
    this.userRole = null;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;