/**
 * StudentOverviewView Component
 *
 * Main dashboard overview for students showing:
 * - Student information and fee status
 * - Assigned bus and route details
 * - Fee summary with payment status
 * - Route information with stops
 * - Virtual transport card tab
 *
 * Features brand styling with gradient cards and modern design.
 */

import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Avatar, Chip,
  CircularProgress, Alert, Tab, Tabs, FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import {
  DirectionsBus, Route, AccessTime, Receipt, Timeline, CheckCircle
} from '@mui/icons-material';
import { authService, busService, routeService } from '../../../services';
import VirtualTransportCard from './VirtualTransportCard';
import {
  BRAND_COLORS,
  CARD_STYLES,
  BORDER_RADIUS,
  SHADOWS,
  TYPOGRAPHY,
} from '../../../styles/brandStyles';

const StudentOverviewView = () => {
  const [user, setUser] = useState(null);
  const [assignedBus, setAssignedBus] = useState(null);
  const [assignedRoute, setAssignedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStopName, setSelectedStopName] = useState('');
  const [selectingRoute, setSelectingRoute] = useState(false);

  // Load student data on component mount
  useEffect(() => {
    loadStudentData();
  }, []);

  /**
   * Load student profile data, assigned bus, and route information
   * Handles both populated and non-populated data from backend
   */
  const loadStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user data
      const userResponse = await authService.getMe();
      const currentUser = userResponse.data.data || userResponse.data;
      setUser(currentUser);

      // Load assigned bus and route data from the populated user data
      if (currentUser?.assignedBus) {
        if (typeof currentUser.assignedBus === 'object' && currentUser.assignedBus._id) {
          setAssignedBus(currentUser.assignedBus);

          // Set route from populated bus data
          if (currentUser.assignedBus.routeId) {
            if (typeof currentUser.assignedBus.routeId === 'object') {
              setAssignedRoute(currentUser.assignedBus.routeId);
            } else {
              try {
                const routeResponse = await routeService.getRoute(currentUser.assignedBus.routeId);
                setAssignedRoute(routeResponse.data.data || routeResponse.data);
              } catch (routeErr) {
                console.error('Failed to load route info:', routeErr);
              }
            }
          }
        }
      }

      // If student has a selected route but no bus yet, load the route info
      if (currentUser?.assignedRoute && !currentUser?.assignedBus) {
        if (typeof currentUser.assignedRoute === 'object') {
          setAssignedRoute(currentUser.assignedRoute);
        } else {
          try {
            const routeResponse = await routeService.getRoute(currentUser.assignedRoute);
            setAssignedRoute(routeResponse.data.data || routeResponse.data);
          } catch (routeErr) {
            console.error('Failed to load route info:', routeErr);
          }
        }
      }

      // Load available routes if no route is assigned yet
      if (!currentUser?.assignedRoute) {
        try {
          const routesResponse = await routeService.getActiveRoutes();
          setAvailableRoutes(routesResponse.data.data || routesResponse.data || []);
        } catch (routeErr) {
          console.error('Failed to load active routes:', routeErr);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner with brand color
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} sx={{ color: BRAND_COLORS.skyBlue }} />
      </Container>
    );
  }

  // Show error message if data loading fails
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ p: 4 }}>
        <Alert severity="error" sx={{ borderRadius: BORDER_RADIUS.md }}>{error}</Alert>
      </Container>
    );
  }

  /**
   * Calculate monthly transport fee based on student's assigned route and stop
   * Returns fee from specific stop or first stop as fallback
   */
  const getMonthlyFee = () => {
    if (assignedRoute?.stops && user?.stopName) {
      const stop = assignedRoute.stops.find(s => s.name === user.stopName);
      if (stop) return stop.fee;
    }
    if (assignedRoute?.stops?.length > 0) {
      return assignedRoute.stops[0].fee;
    }
    return 0;
  };

  // Calculate fee information based on monthly fee and payment status
  const monthlyFee = getMonthlyFee();
  const feeStatus = user?.feeStatus || 'pending';
  let paidAmount = 0;
  let dueAmount = monthlyFee;

  if (feeStatus === 'paid') {
    paidAmount = monthlyFee;
    dueAmount = 0;
  } else if (feeStatus === 'partially_paid') {
    paidAmount = monthlyFee * 0.5;
    dueAmount = monthlyFee * 0.5;
  }

  const feeInfo = {
    monthlyFee,
    paidAmount,
    dueAmount,
    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  return (
    <Container maxWidth="xl" sx={{ p: 4 }}>
      {/* Tab Navigation with brand styling */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            color: BRAND_COLORS.slate600,
            '&.Mui-selected': {
              color: BRAND_COLORS.skyBlue,
            },
          },
          '& .MuiTabs-indicator': {
            background: BRAND_COLORS.primaryGradient,
            height: 3,
          },
        }}
      >
        <Tab label="Dashboard Overview" />
        <Tab label="Transport Card" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Student Info Card - Brand styled */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              ...CARD_STYLES.standard,
              border: `1px solid ${BRAND_COLORS.slate300}`,
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {/* Gradient Avatar */}
                  <Box sx={{
                    p: 0.35,
                    borderRadius: '50%',
                    background: BRAND_COLORS.primaryGradient,
                    display: 'flex',
                  }}>
                    <Avatar sx={{
                      bgcolor: BRAND_COLORS.white,
                      color: BRAND_COLORS.skyBlue,
                      fontWeight: 700,
                      width: 48,
                      height: 48,
                    }}>
                      {user?.name?.charAt(0).toUpperCase() || 'S'}
                    </Avatar>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                      {user?.name || 'Student'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                      ID: {user?.studentId || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Receipt fontSize="small" sx={{ color: BRAND_COLORS.slate600 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: BRAND_COLORS.slate700 }}>
                    Fee Status:
                  </Typography>
                  <Chip
                    label={feeStatus === 'paid' ? 'Paid' : feeStatus === 'partially_paid' ? 'Partially Paid' : 'Pending'}
                    size="small"
                    sx={{
                      bgcolor: feeStatus === 'paid' ? BRAND_COLORS.successGreen :
                        feeStatus === 'partially_paid' ? BRAND_COLORS.warningOrange :
                          BRAND_COLORS.slate400,
                      color: BRAND_COLORS.white,
                      fontWeight: 600,
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600, mb: 0.5 }}>
                  Email: {user?.email || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                  Phone: {user?.phone || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Bus Assignment Card - Brand styled */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              ...CARD_STYLES.standard,
              border: `1px solid ${BRAND_COLORS.slate300}`,
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {/* Gradient Icon Box */}
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: BORDER_RADIUS.xl,
                    background: BRAND_COLORS.primaryGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(14, 165, 233, 0.3)',
                  }}>
                    <DirectionsBus sx={{ color: BRAND_COLORS.white }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                      Bus Assignment
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                      {assignedBus ? 'Assigned' : 'Not Assigned'}
                    </Typography>
                  </Box>
                </Box>

                {assignedBus ? (
                  <>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                      {assignedBus.busNumber}
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                      {assignedBus.model} ({assignedBus.year})
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                      Capacity: {assignedBus.capacity} seats
                    </Typography>

                    {assignedRoute && (
                      <>
                        <Box mt={2}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                            Assigned Route
                          </Typography>
                          <Typography variant="body2" sx={{ color: BRAND_COLORS.slate900 }}>
                            {assignedRoute.routeName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                            {assignedRoute.description}
                          </Typography>
                        </Box>

                        {assignedRoute.departureTime && (
                          <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <AccessTime fontSize="small" sx={{ color: BRAND_COLORS.slate600 }} />
                            {user?.stopName && (
                              <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700 }}>
                                Stop: {user.stopName}
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700 }}>
                              Departure: {assignedRoute.departureTime}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </>
                ) : !user?.assignedRoute ? (
                  /* No route selected — show route selection card */
                  <Box>
                    <Alert
                      severity="info"
                      sx={{
                        borderRadius: BORDER_RADIUS.md,
                        bgcolor: 'rgba(14, 165, 233, 0.08)',
                        border: `1px solid ${BRAND_COLORS.skyBlue}`,
                        color: BRAND_COLORS.slate700,
                        mb: 2,
                      }}
                    >
                      Please select your route first. Once selected, admin will assign you a bus.
                    </Alert>

                    <FormControl fullWidth size="small">
                      <InputLabel>Select Your Route</InputLabel>
                      <Select
                        value={selectedRouteId}
                        label="Select Your Route"
                        onChange={(e) => {
                          setSelectedRouteId(e.target.value);
                          setSelectedStopName(''); // Reset stop when route changes
                        }}
                        sx={{ borderRadius: BORDER_RADIUS.md }}
                      >
                        {availableRoutes.map(route => (
                          <MenuItem key={route._id} value={route._id}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {route.routeName} ({route.routeNo})
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                Departure: {route.departureTime} • {route.distance} km • {route.estimatedDuration} min
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedRouteId && (
                      <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                        <InputLabel>Select Your Stop</InputLabel>
                        <Select
                          value={selectedStopName}
                          label="Select Your Stop"
                          onChange={(e) => setSelectedStopName(e.target.value)}
                          sx={{ borderRadius: BORDER_RADIUS.md }}
                        >
                          {availableRoutes
                            .find(r => r._id === selectedRouteId)?.stops
                            ?.sort((a, b) => a.sequence - b.sequence)
                            .map(stop => (
                              <MenuItem key={stop._id || stop.name} value={stop.name}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {stop.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                                    Fee: {stop.fee} PKR • Pickup: {stop.pickupTime}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    )}

                    <Button
                      variant="contained"
                      fullWidth
                      disabled={!selectedRouteId || selectingRoute || (availableRoutes.find(r => r._id === selectedRouteId)?.stops?.length > 0 && !selectedStopName)}
                      onClick={async () => {
                        setSelectingRoute(true);
                        try {
                          await authService.selectRoute(selectedRouteId, selectedStopName);
                          await loadStudentData();
                        } catch (err) {
                          console.error('Failed to select route:', err);
                        } finally {
                          setSelectingRoute(false);
                        }
                      }}
                      sx={{
                        mt: 2,
                        background: BRAND_COLORS.primaryGradient,
                        borderRadius: BORDER_RADIUS.md,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1,
                      }}
                    >
                      {selectingRoute ? <CircularProgress size={20} color="inherit" /> : 'Confirm Route Selection'}
                    </Button>
                  </Box>
                ) : (
                  /* Route selected but no bus yet */
                  <Alert
                    severity="success"
                    icon={<CheckCircle />}
                    sx={{
                      borderRadius: BORDER_RADIUS.md,
                      bgcolor: 'rgba(16, 185, 129, 0.08)',
                      border: `1px solid ${BRAND_COLORS.successGreen}`,
                      color: BRAND_COLORS.slate700,
                    }}
                  >
                    Route selected: <strong>{assignedRoute?.routeName || 'Selected'}</strong>.
                    Waiting for admin to assign a bus.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Fee Summary Card - Brand styled */}
          <Grid item xs={12} md={6}>
            <Card sx={{
              ...CARD_STYLES.standard,
              border: `1px solid ${BRAND_COLORS.slate300}`,
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {/* Gradient Icon Box */}
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: BORDER_RADIUS.xl,
                    background: `linear-gradient(135deg, ${BRAND_COLORS.successGreen} 0%, ${BRAND_COLORS.teal} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                  }}>
                    <Receipt sx={{ color: BRAND_COLORS.white }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                      Fee Summary
                    </Typography>
                    <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                      Monthly Transport Fee
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700 }}>
                    Monthly Fee:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                    PKR {feeInfo.monthlyFee}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700 }}>
                    Paid Amount:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: BRAND_COLORS.successGreen }}>
                    PKR {feeInfo.paidAmount}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700 }}>
                    Due Amount:
                  </Typography>
                  <Typography variant="body2" sx={{
                    fontWeight: 700,
                    color: feeInfo.dueAmount > 0 ? BRAND_COLORS.errorRed : BRAND_COLORS.successGreen
                  }}>
                    PKR {feeInfo.dueAmount}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                  Next Due Date: {feeInfo.nextDueDate}
                </Typography>

                {user?.feeNotes && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${BRAND_COLORS.slate300}` }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900, mb: 1 }}>
                      Fee History & Notes:
                    </Typography>
                    <Typography variant="caption" sx={{
                      display: 'block',
                      whiteSpace: 'pre-wrap',
                      color: BRAND_COLORS.slate600,
                      maxHeight: 120,
                      overflowY: 'auto',
                      bgcolor: BRAND_COLORS.slate100,
                      p: 1.5,
                      borderRadius: BORDER_RADIUS.md,
                      border: `1px solid ${BRAND_COLORS.slate200}`,
                      fontFamily: 'inherit'
                    }}>
                      {user.feeNotes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Route Information Card - Brand styled */}
          {assignedRoute && (
            <Grid item xs={12} md={6}>
              <Card sx={{
                ...CARD_STYLES.standard,
                border: `1px solid ${BRAND_COLORS.slate300}`,
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    {/* Gradient Icon Box */}
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: BORDER_RADIUS.xl,
                      background: `linear-gradient(135deg, ${BRAND_COLORS.teal} 0%, ${BRAND_COLORS.skyBlue} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(20, 184, 166, 0.3)',
                    }}>
                      <Route sx={{ color: BRAND_COLORS.white }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                        Route Information
                      </Typography>
                      <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                        {assignedRoute.routeName}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700, mb: 0.5 }}>
                    Route Number: {assignedRoute.routeNo || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700, mb: 0.5 }}>
                    Distance: {assignedRoute.distance} km
                  </Typography>
                  <Typography variant="body2" sx={{ color: BRAND_COLORS.slate700 }}>
                    Estimated Duration: {assignedRoute.estimatedDuration} minutes
                  </Typography>

                  {assignedRoute.stops && assignedRoute.stops.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                        Route Stops
                      </Typography>
                      <Box mt={1}>
                        {assignedRoute.stops.slice(0, 3).map((stop, index) => (
                          <Typography key={index} variant="body2" sx={{ color: BRAND_COLORS.slate700, mb: 0.5 }}>
                            {index + 1}. {stop.name} - {stop.pickupTime} (Fee: PKR {stop.fee})
                          </Typography>
                        ))}
                        {assignedRoute.stops.length > 3 && (
                          <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                            + {assignedRoute.stops.length - 3} more stops...
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 1 && (
        <Box display="flex" justifyContent="center" py={3}>
          <VirtualTransportCard user={user} assignedBus={assignedBus} assignedRoute={assignedRoute} />
        </Box>
      )}
    </Container>
  );
};

export default StudentOverviewView;