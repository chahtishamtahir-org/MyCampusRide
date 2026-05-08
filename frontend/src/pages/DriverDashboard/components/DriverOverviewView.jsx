/**
 * DriverOverviewView Component
 *
 * Main dashboard overview for drivers showing:
 * - Driver profile info card with profile picture
 * - Assigned bus details
 * - Current trip status
 * - Location tracking status
 *
 * All cards use brand styling with gradient icon boxes.
 */

import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Avatar, Chip,
  CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions
} from '@mui/material';
import {
  DirectionsBus, LocationOn, AccessTime, Timeline, Person, Email,
  Phone, Badge as BadgeIcon, CheckCircle, Cancel, PlayArrow, Stop
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { authService, busService, trackingService, routeService } from '../../../services';
import {
  BRAND_COLORS,
  CARD_STYLES,
  BORDER_RADIUS,
  SHADOWS,
  TYPOGRAPHY,
  BUTTON_STYLES,
  gradientIconBox,
} from '../../../styles/brandStyles';

const DriverOverviewView = () => {
  const [user, setUser] = useState(null);
  const [driverBus, setDriverBus] = useState(null);
  const [assignedRoute, setAssignedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripStatus, setTripStatus] = useState('idle');
  const [isOnTrip, setIsOnTrip] = useState(false);
  const [tripLoading, setTripLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userResponse = await authService.getMe();
      const currentUser = userResponse.data.data || userResponse.data;
      setUser(currentUser);

      const busesResponse = await busService.getBuses({ limit: 100 });
      const buses = busesResponse.data?.data || [];
      const myBus = buses.find(bus => {
        if (bus.driverId) {
          return typeof bus.driverId === 'object'
            ? bus.driverId._id === currentUser._id
            : bus.driverId === currentUser._id;
        }
        return false;
      });

      if (myBus) {
        setDriverBus(myBus);
        if (myBus.routeId) {
          try {
            const routeId = typeof myBus.routeId === 'object' ? myBus.routeId._id : myBus.routeId;
            const routeResponse = await routeService.getRoute(routeId);
            setAssignedRoute(routeResponse.data.data || routeResponse.data);
          } catch (routeErr) {
            console.error('Could not load route info:', routeErr);
          }
        }
      }

      try {
        const tripStatusResponse = await trackingService.getMyTripStatus();
        const tripData = tripStatusResponse.data?.data || tripStatusResponse.data;
        const isTripActive = tripData?.isOnTrip || tripData?.status === 'on_trip';
        setIsOnTrip(isTripActive);
        setTripStatus(isTripActive ? 'on_trip' : 'idle');
      } catch (err) {
        console.error('Failed to check trip status:', err);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTripAction = (action) => {
    setConfirmDialog({ open: true, action });
  };

  const confirmTripAction = async () => {
    const action = confirmDialog.action;
    setConfirmDialog({ open: false, action: null });
    setTripLoading(true);
    try {
      if (action === 'start') {
        await trackingService.startTrip();
        setIsOnTrip(true);
        setTripStatus('on_trip');
        setDriverBus(prev => prev ? { ...prev, status: 'on_trip' } : prev);
        toast.success('Trip started successfully! Location tracking is now active.');
      } else {
        await trackingService.stopTrip();
        setIsOnTrip(false);
        setTripStatus('idle');
        setDriverBus(prev => prev ? { ...prev, status: 'active' } : prev);
        toast.success('Trip ended successfully.');
      }
    } catch (err) {
      console.error(`Failed to ${action} trip:`, err);
      toast.error(err.response?.data?.message || `Failed to ${action} trip. Please try again.`);
    } finally {
      setTripLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ color: BRAND_COLORS.skyBlue }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ p: 4 }}>
        <Alert severity="error" sx={{ borderRadius: BORDER_RADIUS.md }}>{error}</Alert>
      </Container>
    );
  }

  const tripStatusConfig = {
    on_trip: { label: 'On Trip', color: BRAND_COLORS.warningOrange, icon: <Timeline /> },
    arrived: { label: 'Arrived', color: BRAND_COLORS.successGreen, icon: <CheckCircle /> },
    idle: { label: 'Not on Trip', color: BRAND_COLORS.slate500, icon: <Cancel /> },
  };
  const currentTripConfig = tripStatusConfig[tripStatus] || tripStatusConfig.idle;

  return (
    <Container maxWidth="xl" sx={{ p: 4 }}>
      <Grid container spacing={3}>

        {/* Driver Info Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...CARD_STYLES.standard, border: `1px solid ${BRAND_COLORS.slate300}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                {/* Profile picture with gradient border */}
                <Box sx={{
                  p: 0.35,
                  borderRadius: '50%',
                  background: BRAND_COLORS.primaryGradient,
                  display: 'flex',
                }}>
                  <Avatar
                    src={user?.profilePicture ? `${API_URL}/${user.profilePicture}` : undefined}
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: BRAND_COLORS.white,
                      color: BRAND_COLORS.skyBlue,
                      fontWeight: TYPOGRAPHY.weights.bold,
                      fontSize: '1.4rem',
                      border: `2px solid ${BRAND_COLORS.white}`,
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'D'}
                  </Avatar>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                    {user?.name || 'Driver'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                    License: {user?.licenseNumber || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              {/* Details grid */}
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Email fontSize="small" sx={{ color: BRAND_COLORS.slate500 }} />
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700 }}>
                    {user?.email || 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Phone fontSize="small" sx={{ color: BRAND_COLORS.slate500 }} />
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700 }}>
                    {user?.phone || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={1} mt={2}>
                <Chip
                  label={user?.status || 'Unknown'}
                  size="small"
                  sx={{
                    bgcolor: user?.status === 'active' ? BRAND_COLORS.successGreen : BRAND_COLORS.slate400,
                    color: BRAND_COLORS.white,
                    fontWeight: TYPOGRAPHY.weights.semibold,
                  }}
                />
                <Chip
                  label="Driver"
                  size="small"
                  sx={{
                    background: BRAND_COLORS.primaryGradient,
                    color: BRAND_COLORS.white,
                    fontWeight: TYPOGRAPHY.weights.semibold,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bus Assignment Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...CARD_STYLES.standard, border: `1px solid ${BRAND_COLORS.slate300}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                <Box sx={gradientIconBox(BRAND_COLORS.primaryGradient, '0 4px 16px rgba(14, 165, 233, 0.3)')}>
                  <DirectionsBus sx={{ color: BRAND_COLORS.white }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                    My Bus
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                    {driverBus ? 'Assigned' : 'Not Assigned'}
                  </Typography>
                </Box>
              </Box>

              {driverBus ? (
                <>
                  <Typography variant="body1" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                    {driverBus.busNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                    {driverBus.model} ({driverBus.year})
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 1.5 }}>
                    Capacity: {driverBus.capacity} seats
                  </Typography>

                  <Box display="flex" gap={1}>
                    <Chip
                      label={driverBus.status === 'on_trip' ? 'On Trip' : (driverBus.status || 'Unknown')}
                      size="small"
                      sx={{
                        bgcolor: ['active', 'on_trip'].includes(driverBus.status?.toLowerCase()) ? BRAND_COLORS.successGreen : BRAND_COLORS.slate400,
                        color: BRAND_COLORS.white,
                        fontWeight: TYPOGRAPHY.weights.semibold,
                        textTransform: 'capitalize'
                      }}
                    />
                    <Chip
                      label={driverBus.routeId ? 'Route Assigned' : 'No Route'}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: driverBus.routeId ? BRAND_COLORS.skyBlue : BRAND_COLORS.slate400,
                        color: driverBus.routeId ? BRAND_COLORS.skyBlue : BRAND_COLORS.slate500,
                        fontWeight: TYPOGRAPHY.weights.semibold,
                      }}
                    />
                  </Box>

                  {assignedRoute && (
                    <Box mt={2} pt={2} sx={{ borderTop: `1px solid ${BRAND_COLORS.slate200}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900, mb: 0.5 }}>
                        Route: {assignedRoute.routeName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                        {assignedRoute.description}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: BORDER_RADIUS.md,
                    bgcolor: 'rgba(14, 165, 233, 0.08)',
                    border: `1px solid ${BRAND_COLORS.skyBlue}`,
                    color: BRAND_COLORS.slate700,
                  }}
                >
                  No bus assigned to you yet. Contact admin to assign a bus.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Trip Status Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...CARD_STYLES.standard, border: `1px solid ${BRAND_COLORS.slate300}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                <Box sx={gradientIconBox(
                  `linear-gradient(135deg, ${BRAND_COLORS.successGreen} 0%, ${BRAND_COLORS.teal} 100%)`,
                  '0 4px 16px rgba(16, 185, 129, 0.3)'
                )}>
                  <Timeline sx={{ color: BRAND_COLORS.white }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                    Trip Status
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                    Current trip information
                  </Typography>
                </Box>
              </Box>

              {/* Trip status display */}
              <Box sx={{
                p: 2.5,
                borderRadius: BORDER_RADIUS.md,
                bgcolor: BRAND_COLORS.slate100,
                border: `1px solid ${BRAND_COLORS.slate200}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: `${currentTripConfig.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentTripConfig.color,
                }}>
                  {currentTripConfig.icon}
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                    {currentTripConfig.label}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <AccessTime fontSize="small" sx={{ color: BRAND_COLORS.slate500, fontSize: 14 }} />
                    <Typography variant="caption" sx={{ color: BRAND_COLORS.slate600 }}>
                      Updated just now
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={currentTripConfig.label}
                    size="small"
                    sx={{
                      bgcolor: `${currentTripConfig.color}20`,
                      color: currentTripConfig.color,
                      fontWeight: TYPOGRAPHY.weights.semibold,
                      border: `1px solid ${currentTripConfig.color}40`,
                    }}
                  />
                </Box>
              </Box>

              {/* Trip Control Buttons */}
              {driverBus && (
                <Box mt={2.5} display="flex" gap={1.5}>
                  {!isOnTrip ? (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={tripLoading ? <CircularProgress size={18} color="inherit" /> : <PlayArrow />}
                      disabled={tripLoading}
                      onClick={() => handleTripAction('start')}
                      sx={{
                        background: `linear-gradient(135deg, ${BRAND_COLORS.successGreen} 0%, ${BRAND_COLORS.teal} 100%)`,
                        color: BRAND_COLORS.white,
                        fontWeight: TYPOGRAPHY.weights.bold,
                        borderRadius: BORDER_RADIUS.md,
                        textTransform: 'none',
                        py: 1.2,
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 12px 32px rgba(16, 185, 129, 0.45)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      {tripLoading ? 'Starting...' : 'Start Trip'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={tripLoading ? <CircularProgress size={18} color="inherit" /> : <Stop />}
                      disabled={tripLoading}
                      onClick={() => handleTripAction('stop')}
                      sx={{
                        background: `linear-gradient(135deg, ${BRAND_COLORS.errorRed} 0%, #DC2626 100%)`,
                        color: BRAND_COLORS.white,
                        fontWeight: TYPOGRAPHY.weights.bold,
                        borderRadius: BORDER_RADIUS.md,
                        textTransform: 'none',
                        py: 1.2,
                        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.35)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 12px 32px rgba(239, 68, 68, 0.45)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      {tripLoading ? 'Stopping...' : 'End Trip'}
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Location Tracking Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...CARD_STYLES.standard, border: `1px solid ${BRAND_COLORS.slate300}` }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                <Box sx={gradientIconBox(
                  `linear-gradient(135deg, ${BRAND_COLORS.teal} 0%, ${BRAND_COLORS.skyBlue} 100%)`,
                  '0 4px 16px rgba(20, 184, 166, 0.3)'
                )}>
                  <LocationOn sx={{ color: BRAND_COLORS.white }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                    Location Tracking
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                    Real-time location updates
                  </Typography>
                </Box>
              </Box>

              {isOnTrip ? (
                <Alert
                  severity="success"
                  icon={<LocationOn />}
                  sx={{
                    borderRadius: BORDER_RADIUS.md,
                    bgcolor: 'rgba(16, 185, 129, 0.08)',
                    border: `1px solid ${BRAND_COLORS.successGreen}`,
                    color: BRAND_COLORS.slate900,
                    '& .MuiAlert-icon': {
                      color: BRAND_COLORS.successGreen,
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: TYPOGRAPHY.weights.bold, mb: 0.5 }}>
                    Live Tracking Active
                  </Typography>
                  <Typography variant="body2">
                    Your real-time position is currently being mapped and broadcasted to passengers.
                  </Typography>
                </Alert>
              ) : (
                <Alert
                  severity="info"
                  icon={<LocationOn />}
                  sx={{
                    borderRadius: BORDER_RADIUS.md,
                    bgcolor: 'rgba(14, 165, 233, 0.08)',
                    border: `1px solid ${BRAND_COLORS.skyBlue}`,
                    color: BRAND_COLORS.slate700,
                    '& .MuiAlert-icon': {
                      color: BRAND_COLORS.skyBlue,
                    },
                  }}
                >
                  Location tracking is enabled when you start a trip. The system will update your location automatically during trips.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Trip Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        PaperProps={{
          sx: {
            borderRadius: BORDER_RADIUS.lg,
            boxShadow: SHADOWS.xl,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
          {confirmDialog.action === 'start' ? 'Start Trip?' : 'End Trip?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: BRAND_COLORS.slate600 }}>
            {confirmDialog.action === 'start'
              ? 'This will mark your bus as on-trip and enable location tracking. Students will be notified.'
              : 'This will mark your trip as completed and stop location tracking. Students will be notified.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmDialog({ open: false, action: null })}
            sx={{
              color: BRAND_COLORS.slate600,
              fontWeight: TYPOGRAPHY.weights.semibold,
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmTripAction}
            sx={{
              ...(confirmDialog.action === 'start'
                ? {
                  background: `linear-gradient(135deg, ${BRAND_COLORS.successGreen} 0%, ${BRAND_COLORS.teal} 100%)`,
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                }
                : {
                  background: `linear-gradient(135deg, ${BRAND_COLORS.errorRed} 0%, #DC2626 100%)`,
                  boxShadow: '0 8px 24px rgba(239, 68, 68, 0.35)',
                }),
              color: BRAND_COLORS.white,
              fontWeight: TYPOGRAPHY.weights.bold,
              textTransform: 'none',
              borderRadius: BORDER_RADIUS.md,
            }}
          >
            {confirmDialog.action === 'start' ? 'Start Trip' : 'End Trip'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DriverOverviewView;