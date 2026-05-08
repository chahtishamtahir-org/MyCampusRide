/**
 * Admin Live Tracking View
 * 
 * Real-time dashboard for admins to monitor all active buses on campus.
 * Features:
 * - Global map view showing all buses
 * - Real-time location updates with smooth animations
 * - Bus status indicators and filters
 * - Trip notifications and statistics
 * - Connection status monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab
} from '@mui/material';
import {
  Refresh,
  Notifications,
  DirectionsBus,
  LocationOn,
  SignalCellularAlt,
  SignalCellularOff
} from '@mui/icons-material';
import { trackingService } from '../../../services';
import socketService from '../../../services/socketService';
import RealTimeBusMap from '../../../components/RealTimeBusMap';
import {
  BRAND_COLORS,
  CARD_STYLES,
  BORDER_RADIUS,
  SHADOWS
} from '../../../styles/brandStyles';

const AdminLiveTrackingView = () => {
  const [busLocations, setBusLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, on_trip, available
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    onTrip: 0,
    available: 0
  });

  // Initialize socket connection
  useEffect(() => {
    // Connect to Socket.IO
    socketService.connect('admin-user', 'admin');
    
    // Listen for connection status
    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleReconnect = () => setConnectionStatus('connected');
    
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('reconnect', handleReconnect);
    
    // Listen for real-time bus location updates
    socketService.on('bus-location-update', (data) => {
      console.log('📍 Real-time location update:', data);
      updateBusLocation(data);
    });
    
    // Listen for trip notifications
    socketService.on('trip-notification', (data) => {
      console.log('📢 Trip notification:', data);
      addNotification(data);
      // Refresh bus locations to get updated status
      loadBusLocations();
    });
    
    // Load initial data
    loadBusLocations();
    
    // Cleanup on unmount
    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('reconnect', handleReconnect);
      socketService.off('bus-location-update');
      socketService.off('trip-notification');
    };
  }, []);

  // Load bus locations from API
  const loadBusLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await trackingService.getActiveBusLocations();
      const locations = response.data?.data || [];
      
      setBusLocations(locations);
      calculateStats(locations);
    } catch (err) {
      console.error('Failed to load bus locations:', err);
      setError('Failed to load bus tracking data');
      setBusLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Update specific bus location in real-time
  const updateBusLocation = (locationData) => {
    setBusLocations(prevLocations => {
      const updatedLocations = prevLocations.map(bus => {
        if (bus.busId?.toString() === locationData.busId?.toString() || 
            bus._id?.toString() === locationData.busId?.toString()) {
          return {
            ...bus,
            location: locationData.location,
            lastUpdate: locationData.timestamp
          };
        }
        return bus;
      });
      
      calculateStats(updatedLocations);
      return updatedLocations;
    });
  };

  // Add notification to the list
  const addNotification = (notificationData) => {
    const newNotification = {
      id: Date.now(),
      ...notificationData,
      timestamp: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep last 10
  };

  // Calculate statistics
  const calculateStats = (locations) => {
    const total = locations.length;
    const onTrip = locations.filter(bus => bus.isOnTrip).length;
    const available = locations.filter(bus => !bus.isOnTrip).length;
    
    setStats({ total, onTrip, available });
  };

  // Filter buses based on selection
  const filteredBuses = busLocations.filter(bus => {
    if (filter === 'on_trip') return bus.isOnTrip;
    if (filter === 'available') return !bus.isOnTrip;
    return true;
  });

  // Handle manual refresh
  const handleRefresh = () => {
    loadBusLocations();
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ color: BRAND_COLORS.skyBlue }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: BRAND_COLORS.slate900, mb: 1 }}>
              Live Bus Tracking
            </Typography>
            <Typography variant="body1" sx={{ color: BRAND_COLORS.slate600 }}>
              Monitor all campus buses in real-time
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {/* Connection Status removed as requested */}
            
            {/* Refresh Button */}
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                bgcolor: BRAND_COLORS.primary,
                '&:hover': { bgcolor: BRAND_COLORS.primaryDark },
                px: 3,
                py: 1.5
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={4}>
            <Card sx={{
              ...CARD_STYLES.standard,
              border: `2px solid ${BRAND_COLORS.primary}`,
              background: BRAND_COLORS.primaryGradient,
              color: BRAND_COLORS.white
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <DirectionsBus sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Total Buses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{
              ...CARD_STYLES.standard,
              border: `2px solid ${BRAND_COLORS.successGreen}`,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: BRAND_COLORS.white
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocationOn sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  {stats.onTrip}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  On Trip
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card sx={{
              ...CARD_STYLES.standard,
              border: `2px solid ${BRAND_COLORS.slate400}`,
              background: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
              color: BRAND_COLORS.white
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <DirectionsBus sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                  {stats.available}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Filter Buses</InputLabel>
            <Select
              value={filter}
              label="Filter Buses"
              onChange={(e) => setFilter(e.target.value)}
              sx={{ borderRadius: BORDER_RADIUS.md }}
            >
              <MenuItem value="all">All Buses</MenuItem>
              <MenuItem value="on_trip">On Trip</MenuItem>
              <MenuItem value="available">Available</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
            Showing {filteredBuses.length} of {busLocations.length} buses
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: BORDER_RADIUS.md }}>
          {error}
        </Alert>
      )}

      {/* Main Map Section */}
      <Card sx={{ ...CARD_STYLES.standard, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <RealTimeBusMap
            busLocations={filteredBuses}
            mode="admin"
            height={600}
            showControls={true}
            onBusSelect={(bus) => console.log('Selected bus:', bus)}
          />
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card sx={{ ...CARD_STYLES.standard }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Notifications sx={{ color: BRAND_COLORS.warningOrange }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Activity
                </Typography>
              </Box>
              <Button size="small" onClick={clearNotifications}>
                Clear All
              </Button>
            </Box>
            
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {notifications.map((notification) => (
                <Box
                  key={notification.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    bgcolor: BRAND_COLORS.slate100,
                    borderRadius: BORDER_RADIUS.md,
                    borderLeft: `4px solid ${notification.type === 'started' ? BRAND_COLORS.successGreen : BRAND_COLORS.primary}`
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {notification.message || 
                         `Trip ${notification.type} for Bus ${notification.busNumber}`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: BRAND_COLORS.slate500 }}>
                        Route: {notification.routeId} | Driver: {notification.driverId}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: BRAND_COLORS.slate400 }}>
                      {notification.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Button for Quick Refresh */}
      <Fab
        color="primary"
        aria-label="refresh"
        onClick={handleRefresh}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          bgcolor: BRAND_COLORS.primary,
          '&:hover': { bgcolor: BRAND_COLORS.primaryDark }
        }}
      >
        <Refresh />
      </Fab>
    </Container>
  );
};

export default AdminLiveTrackingView;