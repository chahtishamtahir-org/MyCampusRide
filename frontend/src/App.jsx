import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard/DriverDashboard';
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';

function App() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Hide footer on dashboard pages
  const isDashboard = location.pathname.includes('/admin') ||
    location.pathname.includes('/driver') ||
    location.pathname.includes('/student');

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Show navbar only on authenticated pages (not on dashboards as they have their own nav) */}
      {isAuthenticated && !isDashboard && <Navbar />}

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <LandingPage />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <RegisterPage />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/*"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Old routes - redirect to new ones */}
          <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/driver-dashboard" element={<Navigate to="/driver" replace />} />
          <Route path="/student-dashboard" element={<Navigate to="/student" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>

      {/* Show footer only on authenticated pages (not on dashboards) */}
      {isAuthenticated && !isDashboard && <Footer />}
    </Box>
  );
}

export default App;