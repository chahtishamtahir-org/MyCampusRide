/**
 * DriverTrackingView Component (Refactored)
 *
 * Composed from sub-components:
 * - BusStatusCard (bus info + tracking status)
 * - LocationCard (lat/lng/address)
 * - RouteInfoCard (route, times)
 * - RouteStopsTimeline (visual stepper)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Button,
  CircularProgress, Alert, Chip
} from '@mui/material';
import { MyLocation, AccessTime, GpsFixed, GpsOff } from '@mui/icons-material';
import { trackingService, busService, routeService } from '../../../services';
import { reverseGeocode } from '../../../utils/geocoding';
import BusStatusCard from './tracking/BusStatusCard';
import LocationCard from './tracking/LocationCard';
import RouteInfoCard from './tracking/RouteInfoCard';
import RouteStopsTimeline from './RouteStopsTimeline';
import {
  BRAND_COLORS,
  CARD_STYLES,
  BORDER_RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  BUTTON_STYLES,
  gradientIconBox,
} from '../../../styles/brandStyles';

const DriverTrackingView = () => {
  const [locationData, setLocationData] = useState(null);
  const [busInfo, setBusInfo] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [routeName, setRouteName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // 'idle' | 'acquiring' | 'live' | 'denied'
  const watchIdRef = useRef(null);
  const busInfoRef = useRef(null); // keep latest busInfo accessible inside watcher callback
  const lastUpdateRef = useRef(0); // for throttling GPS updates

  // Keep ref in sync with state
  useEffect(() => { busInfoRef.current = busInfo; }, [busInfo]);

  useEffect(() => {
    loadTrackingData();
    startLiveGeolocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  /**
   * Start watching the browser's GPS position.
   * Updates locationData in state AND pushes to backend so the map and
   * other components (and the DB) always have a real coordinate.
   */
  const startLiveGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('acquiring');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (latitude === 0 && longitude === 0) return; // ignore invalid coords

        // Throttle updates to once every 5 seconds to prevent UI flicker
        const now = Date.now();
        if (now - lastUpdateRef.current < 5000) return;
        lastUpdateRef.current = now;

        setGeoStatus(prev => prev !== 'live' ? 'live' : prev);
        setLocationData(prev => ({
          ...prev,
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          address: prev?.address && prev.address !== 'Address not available' && prev.address !== 'Fetching address...' && prev.address !== 'Live GPS location'
            ? prev.address
            : 'Fetching address...',
          isOnTrip: prev?.isOnTrip || false,
          lastUpdate: new Date().toISOString(),
        }));

        // Fetch actual address in background
        reverseGeocode(latitude, longitude).then(address => {
          setLocationData(prev => {
            // Only update if location hasn't changed while fetching
            if (prev?.latitude === latitude && prev?.longitude === longitude) {
               return { ...prev, address };
            }
            return prev;
          });
          
          // Persist to backend
          if (busInfoRef.current?._id) {
            trackingService.updateLocation({
              latitude,
              longitude,
              address
            }).catch(() => { });
          }
        });
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGeoStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const loadTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const busResponse = await busService.getDriverBuses();
      const buses = busResponse.data?.data || busResponse.data || [];
      if (buses && buses.length > 0) {
        const driverBus = buses[0];
        setBusInfo(driverBus);
        busInfoRef.current = driverBus;

        // Load route details for stops timeline
        if (driverBus.routeId) {
          try {
            const routeId = typeof driverBus.routeId === 'object' ? driverBus.routeId._id : driverBus.routeId;
            const routeResponse = await routeService.getRoute(routeId);
            const route = routeResponse.data?.data || routeResponse.data;
            setRouteStops(route?.stops || []);
            setRouteName(route?.routeName || '');
          } catch (err) {
            console.error('Could not load route stops:', err);
          }
        }

        // Fetch last known location from backend
        try {
          const trackingResponse = await trackingService.getBusLocation(driverBus._id);
          const trackData = trackingResponse.data?.data || trackingResponse.data;
          const lat = trackData?.location?.latitude;
          const lng = trackData?.location?.longitude;
          // Only use DB location if it has real non-zero coordinates
          if (lat && lng && lat !== 0 && lng !== 0) {
            setLocationData({
              latitude: lat,
              longitude: lng,
              address: trackData?.location?.address || 'Location not available',
              isOnTrip: trackData?.isOnTrip || false,
              lastUpdate: trackData?.lastUpdate || null,
            });
          }
          // If DB has zeros, geolocation watcher will populate locationData once GPS fires
        } catch (err) {
          // Geolocation watcher will populate locationData
        }
      }
    } catch (err) {
      console.error('Error loading tracking data:', err);
      setError('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }
    setGeoStatus('acquiring');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGeoStatus('live');
        setLocationData(prev => ({
          ...prev,
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          address: 'Fetching address...',
          lastUpdate: new Date().toISOString(),
        }));
        
        reverseGeocode(latitude, longitude).then(address => {
          setLocationData(prev => {
            if (prev?.latitude === latitude && prev?.longitude === longitude) {
               return { ...prev, address };
            }
            return prev;
          });
          
          if (busInfoRef.current?._id) {
            trackingService.updateLocation({ latitude, longitude, address }).catch(() => { });
          }
        });
      },
      (err) => {
        setGeoStatus('denied');
        setError('Location access denied. Please allow GPS in your browser.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress size={48} sx={{ color: BRAND_COLORS.skyBlue }} />
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card sx={{ ...CARD_STYLES.standard, border: `1px solid ${BRAND_COLORS.slate300}` }}>
        <CardContent>
          {/* Card Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={gradientIconBox(
                `linear-gradient(135deg, ${BRAND_COLORS.teal} 0%, ${BRAND_COLORS.skyBlue} 100%)`,
                '0 4px 16px rgba(20, 184, 166, 0.3)'
              )}>
                <MyLocation sx={{ color: BRAND_COLORS.white }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                  Bus Tracking
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                  Real-time location and route info
                </Typography>
              </Box>
            </Box>
            {/* Refresh Button + GPS status */}
            <Box display="flex" alignItems="center" gap={1.5}>
              {geoStatus === 'live' && (
                <Chip
                  icon={<GpsFixed sx={{ fontSize: 16 }} />}
                  label="GPS Live"
                  size="small"
                  color="success"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {geoStatus === 'acquiring' && (
                <Chip
                  icon={<CircularProgress size={12} />}
                  label="Acquiring GPS…"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {geoStatus === 'denied' && (
                <Chip
                  icon={<GpsOff sx={{ fontSize: 16 }} />}
                  label="GPS denied"
                  size="small"
                  color="error"
                  sx={{ fontWeight: 600 }}
                />
              )}
              <Button
                variant="contained"
                startIcon={<MyLocation />}
                onClick={refreshLocation}
                sx={{ ...BUTTON_STYLES.primary, px: 3, py: 1 }}
              >
                Refresh Location
              </Button>
            </Box>
          </Box>

          {/* Sub-components */}
          {busInfo && (
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={6}>
                <BusStatusCard busInfo={busInfo} locationData={locationData} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocationCard locationData={locationData} />
              </Grid>
            </Grid>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <RouteInfoCard busInfo={busInfo} />
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Route Stops Timeline */}
              <Card sx={{
                ...CARD_STYLES.standard,
                border: `1px solid ${BRAND_COLORS.slate200}`,
                boxShadow: SHADOWS.sm,
              }}>
                <CardContent>
                  <RouteStopsTimeline stops={routeStops} routeName={routeName} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Footer Note */}
          <Box mt={3} textAlign="center" sx={{
            p: 2,
            borderRadius: BORDER_RADIUS.md,
            bgcolor: BRAND_COLORS.slate100,
          }}>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <MyLocation sx={{ fontSize: 18, color: BRAND_COLORS.skyBlue }} />
              <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, fontWeight: TYPOGRAPHY.weights.medium }}>
                Real-time bus tracking system — Location updates automatically during active trips
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default DriverTrackingView;