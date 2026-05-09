/**
 * Enhanced Driver Tracking Component
 * 
 * Complete trip management solution with real-time geolocation integration.
 * Features:
 * - Trip start/stop controls with Socket.IO notifications
 * - Continuous location broadcasting
 * - Browser Geolocation API integration
 * - Accuracy indicators and fallbacks
 * - Real-time map visualization
 * - Trip statistics and duration tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  MyLocation,
  LocationOn,
  Speed,
  AccessTime,
  SignalCellularAlt,
  SignalCellularOff,
  Settings,
  Warning
} from '@mui/icons-material';
import { trackingService, busService } from '../../../services';
import socketService from '../../../services/socketService';
import RealTimeBusMap from '../../../components/RealTimeBusMap';
import {
  BRAND_COLORS,
  CARD_STYLES,
  BORDER_RADIUS,
  SHADOWS
} from '../../../styles/brandStyles';

const EnhancedDriverTracking = () => {
  const [busInfo, setBusInfo] = useState(null);
  const [isOnTrip, setIsOnTrip] = useState(false);
  const [tripStartTime, setTripStartTime] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(socketService.isConnected ? 'connected' : 'disconnected');
  const [isTracking, setIsTracking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(5000); // 5 seconds
  const [highAccuracy, setHighAccuracy] = useState(true);
  
  // Refs for tracking
  const locationWatchId = useRef(null);
  const locationUpdateInterval = useRef(null);
  const busInfoRef = useRef(null);
  const currentLocationRef = useRef(null);

  // Update refs when state changes
  useEffect(() => {
    busInfoRef.current = busInfo;
  }, [busInfo]);

  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  // Initialize on mount
  useEffect(() => {
    loadDriverData();
    
    // Setup socket connection
    socketService.connect('driver-user', 'driver');
    
    // Listen for connection events
    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleReconnect = () => setConnectionStatus('connected');
    
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('reconnect', handleReconnect);
    
    // Cleanup on unmount
    return () => {
      stopLocationTracking();
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('reconnect', handleReconnect);
    };
  }, []);

  // Handle map sizing issues - especially important for sidebar transitions
  useEffect(() => {
    // Trigger map resize after component mounts and after potential sidebar animations
    const handleMapResize = () => {
      // Dispatch a custom event that the map component can listen to
      window.dispatchEvent(new CustomEvent('map-should-resize'));
      
      // Also trigger resize directly if map is available
      setTimeout(() => {
        const mapElements = document.querySelectorAll('.leaflet-container');
        mapElements.forEach(map => {
          if (map._leaflet_map) {
            map._leaflet_map.invalidateSize();
          }
        });
      }, 300); // Delay to allow for sidebar animation completion
    };
    
    // Run immediately on mount
    handleMapResize();
    
    // Also run after a short delay to catch any delayed rendering
    const delayTimer = setTimeout(handleMapResize, 500);
    
    // Listen for potential sidebar toggle events
    const handleSidebarToggle = () => {
      setTimeout(handleMapResize, 300);
    };
    
    window.addEventListener('resize', handleMapResize);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    
    return () => {
      clearTimeout(delayTimer);
      window.removeEventListener('resize', handleMapResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  // Handle auto-starting tracking if already on a trip from previous session
  useEffect(() => {
    if (isOnTrip && busInfo && !isTracking) {
      startLocationTracking();
    }
  }, [isOnTrip, busInfo, isTracking]);

  // Load driver's assigned bus
  const loadDriverData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await busService.getDriverBuses();
      const buses = response.data?.data || response.data || [];
      
      if (buses.length > 0) {
        const driverBus = buses[0];
        setBusInfo(driverBus);
        
        // Check current trip status
        const tripStatus = await trackingService.getMyTripStatus();
        const tripData = tripStatus.data?.data;
        
        setIsOnTrip(tripData?.isOnTrip || false);
        setTripStartTime(tripData?.tripStartTime ? new Date(tripData.tripStartTime) : null);
        
        if (tripData?.currentLocation) {
          setCurrentLocation(tripData.currentLocation);
        }
      } else {
        setError('No bus assigned to you. Please contact admin.');
      }
    } catch (err) {
      console.error('Failed to load driver data:', err);
      setError('Failed to load bus information');
    } finally {
      setLoading(false);
    }
  };

  // Start trip
  const startTrip = async () => {
    try {
      setLoading(true);
      const response = await trackingService.startTrip();
      
      setIsOnTrip(true);
      setTripStartTime(new Date());
      
      // Start location tracking
      startLocationTracking();
      
      
      console.log('🚀 Trip started successfully');
    } catch (err) {
      console.error('Failed to start trip:', err);
      setError('Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  // Stop trip
  const stopTrip = async () => {
    try {
      setLoading(true);
      
      // Stop location tracking first
      stopLocationTracking();
      
      const response = await trackingService.stopTrip();
      
      setIsOnTrip(false);
      setTripStartTime(null);
      
      
      console.log('🏁 Trip stopped successfully');
    } catch (err) {
      console.error('Failed to stop trip:', err);
      setError('Failed to stop trip');
    } finally {
      setLoading(false);
    }
  };

  // Start continuous location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
      
    setIsTracking(true);
      
    // First try to get current position immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Validate coordinates before setting them
        if (position.coords.latitude === 0 && position.coords.longitude === 0) {
          console.warn('Received zero coordinates on initial fetch');
          return;
        }
          
        if (Math.abs(position.coords.latitude) > 90 || Math.abs(position.coords.longitude) > 180) {
          console.warn('Received invalid coordinates on initial fetch');
          return;
        }
          
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
          
        setCurrentLocation(locationData);
        setLocationAccuracy(position.coords.accuracy);
          
        // Send location update via Socket.IO
        sendLocationUpdate(locationData);
      },
      (error) => {
        console.error('Initial geolocation error:', error);
        // Continue with watchPosition even if initial position fails
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: 0
      }
    );
      
    // Start watching position
    locationWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        // Validate coordinates before setting them
        if (position.coords.latitude === 0 && position.coords.longitude === 0) {
          console.warn('Received zero coordinates, skipping update');
          return;
        }
          
        if (Math.abs(position.coords.latitude) > 90 || Math.abs(position.coords.longitude) > 180) {
          console.warn('Received invalid coordinates, skipping update');
          return;
        }
          
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
          
        setCurrentLocation(locationData);
        setLocationAccuracy(position.coords.accuracy);
          
        // Send location update via Socket.IO
        sendLocationUpdate(locationData);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError(`Geolocation error: ${error.message}`);
        handleLocationError(error);
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: 10000,
        maximumAge: updateInterval
      }
    );
      
    // Also send periodic updates (fallback)
    locationUpdateInterval.current = setInterval(() => {
      if (currentLocationRef.current) {
        sendLocationUpdate(currentLocationRef.current);
      }
    }, updateInterval);
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    setIsTracking(false);
    
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
    
    if (locationUpdateInterval.current) {
      clearInterval(locationUpdateInterval.current);
      locationUpdateInterval.current = null;
    }
  };

  // Send location update via Socket.IO
  const sendLocationUpdate = (locationData) => {
    const currentBus = busInfoRef.current;
    if (!currentBus || !locationData || locationData.latitude === 0 || locationData.longitude === 0) return;
    
    const updateData = {
      busId: currentBus._id,
      routeId: currentBus.routeId?._id || currentBus.routeId,
      location: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: 'Location tracking active', // Could integrate reverse geocoding
        accuracy: locationData.accuracy,
        speed: locationData.speed
      }
    };
    
    socketService.sendLocationUpdate(updateData);
    console.log('📍 Location update sent:', updateData);
  };

  // Handle location errors
  const handleLocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setError('Location access denied. Please enable location permissions.');
        break;
      case error.POSITION_UNAVAILABLE:
        setError('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        setError('Location request timed out.');
        break;
      default:
        setError('An unknown error occurred while getting location.');
        break;
    }
  };

  // Calculate trip duration
  const getTripDuration = () => {
    if (!tripStartTime) return '00:00:00';
    
    const now = new Date();
    const diff = now - tripStartTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle manual location update
  const updateLocationManually = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not available');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setCurrentLocation(locationData);
        sendLocationUpdate(locationData);
      },
      handleLocationError,
      { enableHighAccuracy: highAccuracy }
    );
  };

  // Show loading state
  if (loading && !busInfo) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ color: BRAND_COLORS.skyBlue }} />
      </Container>
    );
  }

  // Show error state
  if (error && !busInfo) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: BORDER_RADIUS.md }}>
          {error}
        </Alert>
      </Container>
    );
  }

  // Show no bus assigned
  if (!busInfo) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card sx={{ ...CARD_STYLES.standard, textAlign: 'center', p: 6 }}>
          <MyLocation sx={{ fontSize: 80, color: BRAND_COLORS.slate400, mb: 3 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND_COLORS.slate700, mb: 2 }}>
            No Bus Assigned
          </Typography>
          <Typography variant="body1" sx={{ color: BRAND_COLORS.slate600, mb: 3 }}>
            You don't have a bus assigned yet. Please contact the admin.
          </Typography>
          <Button
            variant="contained"
            onClick={loadDriverData}
            sx={{
              bgcolor: BRAND_COLORS.primary,
              '&:hover': { bgcolor: BRAND_COLORS.primaryDark }
            }}
          >
            Refresh
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: BRAND_COLORS.slate900, mb: 1 }}>
              Trip Management
            </Typography>
            <Typography variant="body1" sx={{ color: BRAND_COLORS.slate600 }}>
              Manage your bus trips and real-time location tracking
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {/* Connection Status removed as requested */}
            
            {/* Settings Button */}
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setShowSettings(true)}
            >
              Settings
            </Button>
          </Box>
        </Box>

        {/* Bus Information Card */}
        <Card sx={{ ...CARD_STYLES.standard, mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900, mb: 1 }}>
                    Bus {busInfo.busNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                    {busInfo.model} ({busInfo.year})
                  </Typography>
                  <Chip
                    label={isOnTrip ? 'On Trip' : 'Available'}
                    color={isOnTrip ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 1 }}>
                    <strong>Route:</strong> {busInfo.routeId?.routeName || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                    <strong>Capacity:</strong> {busInfo.capacity} seats
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 1, display: 'inline' }}>
                      <strong>Tracking:</strong>
                    </Typography>
                    <Chip
                      label={isTracking ? 'Active' : 'Inactive'}
                      color={isTracking ? 'success' : 'default'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  {locationAccuracy && (
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                      <strong>Accuracy:</strong> {locationAccuracy.toFixed(0)}m
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box display="flex" flexDirection="column" gap={1}>
                  {isOnTrip ? (
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<Stop />}
                      onClick={stopTrip}
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        px: 3,
                        fontWeight: 600
                      }}
                    >
                      End Trip
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<PlayArrow />}
                      onClick={startTrip}
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        px: 3,
                        fontWeight: 600
                      }}
                    >
                      Start Trip
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<MyLocation />}
                    onClick={updateLocationManually}
                    disabled={!isOnTrip || loading}
                    sx={{ py: 1 }}
                  >
                    Update Location
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Trip Status Panel */}
      {isOnTrip && (
        <Card sx={{ ...CARD_STYLES.standard, mb: 3, border: `2px solid ${BRAND_COLORS.successGreen}` }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: BORDER_RADIUS.xl,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <LocationOn sx={{ color: BRAND_COLORS.white, fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                  Trip in Progress
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                  Duration: {getTripDuration()}
                </Typography>
              </Box>
            </Box>
            
            <LinearProgress
              variant="indeterminate"
              sx={{
                height: 6,
                borderRadius: BORDER_RADIUS.md,
                bgcolor: 'rgba(16, 185, 129, 0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: BRAND_COLORS.successGreen,
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Location Information */}
      {currentLocation && (
        <Card sx={{ ...CARD_STYLES.standard, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Current Location
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 0.5 }}>
                  Latitude:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {currentLocation.latitude.toFixed(6)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 0.5 }}>
                  Longitude:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {currentLocation.longitude.toFixed(6)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 0.5 }}>
                  <Speed sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  Speed:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {currentLocation.speed ? `${(currentLocation.speed * 3.6).toFixed(1)} km/h` : '0 km/h'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 0.5 }}>
                  <AccessTime sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  Updated:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Main Map */}
      <Card sx={{ ...CARD_STYLES.standard, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <RealTimeBusMap
            busLocations={currentLocation ? [{ 
              ...busInfo, 
              busId: busInfo._id,
              location: {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                address: 'Current Location'
              },
              isOnTrip: isOnTrip
            }] : []}
            mode="driver"
            assignedBusId={busInfo._id}
            height={500}
            showControls={true}
          />
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ borderRadius: BORDER_RADIUS.md, mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tracking Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Update Interval (ms)"
              type="number"
              value={updateInterval}
              onChange={(e) => setUpdateInterval(Number(e.target.value))}
              helperText="How often to send location updates"
              sx={{ mb: 3 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={highAccuracy}
                  onChange={(e) => setHighAccuracy(e.target.checked)}
                />
              }
              label="High Accuracy Mode"
            />
            <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mt: 1 }}>
              Uses GPS for better accuracy but may drain battery faster
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Location Update */}
      {isOnTrip && (
        <Fab
          color="primary"
          aria-label="update location"
          onClick={updateLocationManually}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            bgcolor: BRAND_COLORS.primary,
            '&:hover': { bgcolor: BRAND_COLORS.primaryDark }
          }}
        >
          <MyLocation />
        </Fab>
      )}
    </Container>
  );
};

export default EnhancedDriverTracking;