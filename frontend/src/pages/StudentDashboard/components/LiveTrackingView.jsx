/**
 * Student Live Tracking View
 * 
 * Personalized real-time tracking interface for students showing their assigned bus.
 * Features:
 * - Focused map view of assigned bus 
 * - Real-time location updates via Socket.IO
 * - Distance calculation from student's GPS position
 * - Trip status indicators and notifications
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Chip,
  Alert, CircularProgress, Button, LinearProgress
} from '@mui/material';
import {
  Refresh, DirectionsBus, LocationOn, AccessTime,
  SignalCellularAlt, SignalCellularOff, Notifications, GpsFixed, Explore
} from '@mui/icons-material';
import { authService, trackingService, busService } from '../../../services';
import socketService from '../../../services/socketService';
import RealTimeBusMap from '../../../components/RealTimeBusMap';
import {
  BRAND_COLORS, CARD_STYLES, BORDER_RADIUS, SHADOWS, TYPOGRAPHY
} from '../../../styles/brandStyles';

// Haversine distance formula (returns distance in km)
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const StudentLiveTrackingView = () => {
  const [user, setUser] = useState(null);
  const [assignedBus, setAssignedBus] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [studentLocation, setStudentLocation] = useState(null);
  const [distanceKm, setDistanceKm] = useState(null);
  const [tripStatus, setTripStatus] = useState('idle'); // idle, on_trip, arrived
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);

  // Refs for callbacks
  const assignedBusRef = useRef(null);
  const studentLocRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastGpsUpdateRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { assignedBusRef.current = assignedBus; }, [assignedBus]);
  useEffect(() => { studentLocRef.current = studentLocation; }, [studentLocation]);

  // Recalculate distance whenever either location changes
  useEffect(() => {
    if (studentLocation && busLocation && busLocation.latitude && busLocation.longitude
      && busLocation.latitude !== 0 && busLocation.longitude !== 0) {
      const dist = getDistanceInKm(
        studentLocation.latitude, studentLocation.longitude,
        busLocation.latitude, busLocation.longitude
      );
      setDistanceKm(dist);
    } else {
      setDistanceKm(null);
    }
  }, [studentLocation, busLocation]);

  useEffect(() => {
    loadStudentData();
    startStudentGeolocation();

    // Socket setup
    socketService.connect('student-user', 'student');
    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');
    const handleReconnect = () => setConnectionStatus('connected');

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('reconnect', handleReconnect);

    socketService.on('bus-location-update', (data) => {
      const bus = assignedBusRef.current;
      if (bus && data.busId?.toString() === bus._id?.toString()) {
        const lat = data.location?.latitude;
        const lng = data.location?.longitude;
        if (lat && lng && lat !== 0 && lng !== 0) {
          setBusLocation({
            ...data.location,
            lastUpdate: data.timestamp
          });
        }
      }
    });

    socketService.on('trip-notification', (data) => {
      addNotification(data);
      const bus = assignedBusRef.current;
      if (bus && data.busId?.toString() === bus._id?.toString()) {
        if (data.type === 'started') setTripStatus('on_trip');
        else if (data.type === 'ended') setTripStatus('idle');
      }
    });

    // Fallback polling
    const interval = setInterval(() => {
      const bus = assignedBusRef.current;
      if (bus) loadBusLocation(bus._id, true); // true = silent refresh
    }, 15000);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('reconnect', handleReconnect);
      socketService.off('bus-location-update');
      socketService.off('trip-notification');
      clearInterval(interval);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startStudentGeolocation = () => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Throttle rapid updates to prevent map flicker
        const now = Date.now();
        if (now - lastGpsUpdateRef.current < 5000) return;
        lastGpsUpdateRef.current = now;

        setStudentLocation({ latitude, longitude });
      },
      (err) => console.warn('Student Geolocation error:', err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userResponse = await authService.getMe();
      const currentUser = userResponse.data.data;
      setUser(currentUser);

      if (currentUser?.assignedBus) {
        let busData;
        if (typeof currentUser.assignedBus === 'object' && currentUser.assignedBus._id) {
          busData = currentUser.assignedBus;
        } else {
          const busResponse = await busService.getBus(currentUser.assignedBus);
          busData = busResponse.data.data;
        }

        setAssignedBus(busData);
        if (busData.routeId) {
          const routeId = typeof busData.routeId === 'object' ? busData.routeId._id : busData.routeId;
          socketService.joinRoom(`route-${routeId}`);
        }

        checkTripStatus(busData._id);
        loadBusLocation(busData._id, false);
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
      setError('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const checkTripStatus = async (busId) => {
    try {
      const response = await trackingService.getBusLocation(busId);
      const busData = response.data?.data;
      setTripStatus(busData?.isOnTrip ? 'on_trip' : 'idle');
      const lat = busData?.location?.latitude;
      const lng = busData?.location?.longitude;
      if (lat && lng && lat !== 0 && lng !== 0) {
        setBusLocation({ ...busData.location, lastUpdate: busData.lastUpdate });
      }
    } catch (err) {
      console.error('Failed to check trip status:', err);
    }
  };

  const loadBusLocation = async (busId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await trackingService.getBusLocation(busId);
      const busData = response.data?.data;
      const lat = busData?.location?.latitude;
      const lng = busData?.location?.longitude;
      if (lat && lng && lat !== 0 && lng !== 0) {
        setBusLocation({
          ...busData.location,
          lastUpdate: busData.lastUpdate
        });
      }
    } catch (err) {
      console.error('Failed to load bus location:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const addNotification = (notificationData) => {
    const newNotification = {
      id: Date.now(),
      ...notificationData,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 5));
  };

  const handleRefresh = () => {
    if (assignedBus) {
      checkTripStatus(assignedBus._id);
      loadBusLocation(assignedBus._id, false);
    }
  };

  if (loading && !assignedBus) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ color: BRAND_COLORS.skyBlue }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: BORDER_RADIUS.md }}>{error}</Alert>
      </Container>
    );
  }

  if (!assignedBus) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Card sx={{ ...CARD_STYLES.standard, textAlign: 'center', p: 6 }}>
          <DirectionsBus sx={{ fontSize: 80, color: BRAND_COLORS.slate400, mb: 3 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND_COLORS.slate700, mb: 2 }}>
            No Bus Assigned
          </Typography>
          <Typography variant="body1" sx={{ color: BRAND_COLORS.slate600, mb: 3 }}>
            You don't have a bus assigned yet. Please contact the admin.
          </Typography>
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
              Bus Tracking
            </Typography>
            <Typography variant="body1" sx={{ color: BRAND_COLORS.slate600 }}>
              Track your assigned bus in real-time
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {studentLocation && (
              <Chip
                icon={<GpsFixed sx={{ fontSize: 16 }} />}
                label="Your GPS Active"
                color="success"
                sx={{ fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
              />
            )}
            {/* Connection Status removed as requested */}
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{ bgcolor: BRAND_COLORS.primary, px: 3, py: 1.5 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Info Grid */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ ...CARD_STYLES.standard, height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: BORDER_RADIUS.xl,
                    background: BRAND_COLORS.primaryGradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <DirectionsBus sx={{ color: BRAND_COLORS.white, fontSize: 32 }} />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                      Bus {assignedBus.busNumber}
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 0.5 }}>
                      <strong>Route:</strong> {assignedBus.routeId?.routeName || 'N/A'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>Status:</Typography>
                      <Chip
                        label={tripStatus === 'on_trip' ? 'On Trip' : 'Available'}
                        color={tripStatus === 'on_trip' ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ ...CARD_STYLES.standard, height: '100%', border: tripStatus === 'on_trip' ? `2px solid ${BRAND_COLORS.successGreen}` : `1px solid ${BRAND_COLORS.slate200}` }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: BORDER_RADIUS.xl,
                    background: distanceKm !== null ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : BRAND_COLORS.slate300,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Explore sx={{ color: BRAND_COLORS.white, fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate500, fontWeight: 600, textTransform: 'uppercase' }}>
                      Distance to Bus
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: BRAND_COLORS.slate900 }}>
                      {distanceKm !== null ? `${distanceKm.toFixed(2)} km` : (tripStatus === 'on_trip' ? 'Calculating...' : '—')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate500, mt: 0.5 }}>
                      {distanceKm !== null ? `Straight-line dist from your GPS` : (tripStatus === 'on_trip' ? 'Acquiring location...' : 'Bus is not currently on trip')}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {tripStatus === 'on_trip' && (
        <LinearProgress
          variant="indeterminate"
          sx={{
            height: 4, borderRadius: BORDER_RADIUS.md, mb: 3,
            bgcolor: 'rgba(16, 185, 129, 0.2)',
            '& .MuiLinearProgress-bar': { bgcolor: BRAND_COLORS.successGreen },
          }}
        />
      )}

      {/* Main Map */}
      <Card sx={{ ...CARD_STYLES.standard, mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <RealTimeBusMap
            busLocations={busLocation ? [{
              ...assignedBus,
              busId: assignedBus._id,
              location: busLocation,
              isOnTrip: tripStatus === 'on_trip'
            }] : []}
            mode="student"
            assignedBusId={assignedBus._id}
            height={500}
            showControls={true}
          />
        </CardContent>
      </Card>

      {notifications.length > 0 && (
        <Card sx={{ ...CARD_STYLES.standard, mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Notifications sx={{ color: BRAND_COLORS.primary }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Trip Updates</Typography>
              </Box>
              <Button size="small" onClick={() => setNotifications([])}>Clear</Button>
            </Box>
            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {notifications.map((n) => (
                <Box key={n.id} sx={{ p: 2, mb: 1, bgcolor: BRAND_COLORS.slate100, borderRadius: BORDER_RADIUS.md, borderLeft: `4px solid ${BRAND_COLORS.primary}` }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{n.message}</Typography>
                    <Typography variant="caption" sx={{ color: BRAND_COLORS.slate400 }}>{n.timestamp.toLocaleTimeString()}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default StudentLiveTrackingView;