/**
 * AdminDashboard Component
 *
 * Main container for the Admin Portal with modern brand styling.
 * Uses URL-based nested routing for each section.
 * Features:
 * - Sidebar navigation with gradient active states
 * - Top header with notifications
 * - URL-based routing for each view
 * - Responsive layout (drawer on mobile)
 * - Brand-consistent background gradient
 */

import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import OverviewView from './components/OverviewView';
import UsersView from './components/UsersView';
import BusesView from './components/BusesView';
import RoutesView from './components/RoutesView';
import FeeManagementView from './components/FeeManagementView';
import BusAssignmentView from './components/BusAssignmentView';
import DisplacedStudentsView from './components/DisplacedStudentsView';
import NotificationsView from './components/NotificationsView';
import AdminProfileView from './components/AdminProfileView';
import LiveTrackingView from './components/LiveTrackingView';
import { BACKGROUND_GRADIENTS } from '../../styles/brandStyles';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Toggle mobile drawer open/close
   */
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  /**
   * Authorization check - redirect if not admin
   */
  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  return (
    // Main layout container with brand background gradient
    <Box sx={{
      display: 'flex',
      background: BACKGROUND_GRADIENTS.page,
      minHeight: '100vh',
    }}>
      {/* Left Sidebar - Navigation menu with brand styling */}
      <AdminSidebar
        user={user}
        logout={logout}
        navigate={navigate}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
      />

      {/* Main Content Area */}
      <Box component="main" sx={{
        flexGrow: 1,
        overflow: 'auto',
        transition: 'all 0.3s ease',
      }}>
        {/* Top Header */}
        <AdminHeader handleDrawerToggle={handleDrawerToggle} onRefresh={handleRefresh} />

        {/* URL-based nested routes */}
        <React.Fragment key={refreshKey}>
          <Routes>
            <Route index element={<OverviewView />} />
            <Route path="live-tracking" element={<LiveTrackingView />} />
            <Route path="users" element={<UsersView />} />
            <Route path="buses" element={<BusesView />} />
            <Route path="routes" element={<RoutesView />} />
            <Route path="fees" element={<FeeManagementView />} />
            <Route path="bus-assignment" element={<BusAssignmentView />} />
            <Route path="displaced" element={<DisplacedStudentsView />} />
            <Route path="notifications" element={<NotificationsView />} />
            <Route path="profile" element={<AdminProfileView />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </React.Fragment>
      </Box>
    </Box>
  );
};

export default AdminDashboard;