import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery, Container, Paper, Avatar, Button, Typography } from '@mui/material';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HourglassEmpty, Logout } from '@mui/icons-material';
import DriverSidebar from './components/DriverSidebar';
import DriverHeader from './components/DriverHeader';
import DriverOverviewView from './components/DriverOverviewView';
import DriverTripsView from './components/DriverTripsView';
import DriverTrackingView from './components/DriverTrackingView';
import EnhancedTrackingView from './components/EnhancedTrackingView';
import DriverProfileView from './components/DriverProfileView';
import DriverPassengersView from './components/DriverPassengersView';
import DriverNotificationsView from './components/DriverNotificationsView';
import { BACKGROUND_GRADIENTS, SIDEBAR_STYLES, BRAND_COLORS, SHADOWS, BUTTON_STYLES, BORDER_RADIUS } from '../../styles/brandStyles';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user || user.role !== 'driver') {
    navigate('/');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (user.status === 'pending') {
    return (
      <Box sx={{
        background: BACKGROUND_GRADIENTS.driverPage || BACKGROUND_GRADIENTS.page,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: BORDER_RADIUS['2xl'],
            boxShadow: SHADOWS.lg,
            border: `1px solid ${BRAND_COLORS.slate300}`,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
              <Avatar sx={{
                width: 80,
                height: 80,
                background: BRAND_COLORS.driverGradient || BRAND_COLORS.primaryGradient,
                boxShadow: SHADOWS.driverButtonDefault,
              }}>
                <HourglassEmpty sx={{ fontSize: 48, color: 'white' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: BRAND_COLORS.slate900, mb: 2 }}>
                  Pending Approval
                </Typography>
                <Typography variant="body1" sx={{ color: BRAND_COLORS.slate700, fontWeight: 500, mb: 1 }}>
                  Your driver registration has been submitted successfully.
                </Typography>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                  The administrative team is currently reviewing your documents and driving license. You will receive an email/notification once your account is approved.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{
                  ...BUTTON_STYLES.driver,
                  px: 4,
                  py: 1.5,
                  mt: 2
                }}
              >
                Logout
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };



  return (
    <Box sx={{
      display: 'flex',
      background: BACKGROUND_GRADIENTS.page,
      minHeight: '100vh',
    }}>
      <DriverSidebar
        user={user}
        logout={logout}
        navigate={navigate}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          width: { md: `calc(100% - ${SIDEBAR_STYLES.width}px)` },
        }}
      >
        <DriverHeader
          user={user}
          handleDrawerToggle={handleDrawerToggle}
          onRefresh={handleRefresh}
        />
        {/* URL-based nested routes */}
        <React.Fragment key={refreshKey}>
          <Routes>
            <Route index element={<DriverOverviewView />} />
            <Route path="passengers" element={<DriverPassengersView />} />
            <Route path="trips" element={<DriverTripsView />} />
            <Route path="tracking" element={<DriverTrackingView />} />
            <Route path="enhanced-tracking" element={<EnhancedTrackingView />} />
            <Route path="profile" element={<DriverProfileView />} />
            <Route path="notifications" element={<DriverNotificationsView />} />
            <Route path="*" element={<Navigate to="/driver" replace />} />
          </Routes>
        </React.Fragment>
      </Box>
    </Box>
  );
};

export default DriverDashboard;