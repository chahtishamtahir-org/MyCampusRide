import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DriverSidebar from './components/DriverSidebar';
import DriverHeader from './components/DriverHeader';
import DriverOverviewView from './components/DriverOverviewView';
import DriverTripsView from './components/DriverTripsView';
import DriverTrackingView from './components/DriverTrackingView';
import EnhancedTrackingView from './components/EnhancedTrackingView';
import DriverProfileView from './components/DriverProfileView';
import DriverPassengersView from './components/DriverPassengersView';
import DriverNotificationsView from './components/DriverNotificationsView';
import { BACKGROUND_GRADIENTS, SIDEBAR_STYLES, BRAND_COLORS } from '../../styles/brandStyles';

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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Update sidebar to use URL-based navigation
  const updateSidebarForRouting = () => {
    // The sidebar will now use react-router-dom for navigation
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