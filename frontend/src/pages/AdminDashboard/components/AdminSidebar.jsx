/**
 * AdminSidebar Component
 *
 * Left navigation sidebar for the Admin Portal with brand styling.
 * Features:
 * - Brand logo with gradient text
 * - Navigation menu with gradient active states
 * - User profile section at bottom
 * - Logout functionality with confirmation
 * - Responsive drawer for mobile
 *
 * The design matches the landing page aesthetic with gradient colors,
 * smooth transitions, and modern styling.
 */

import React, { useState } from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Drawer, Avatar, Typography, IconButton, useTheme, useMediaQuery
} from '@mui/material';
import {
  People, DirectionsBus, Route as RouteIcon, Notifications,
  Security, Logout, Dashboard, Payment, Person, AirportShuttle, Warning,
  LocationOn
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LogoutConfirmDialog from '../../../components/LogoutConfirmDialog';
import { BRAND_COLORS, SIDEBAR_STYLES, gradientText, BORDER_RADIUS } from '../../../styles/brandStyles';

// Sidebar width constant (matches design system)
const drawerWidth = SIDEBAR_STYLES.width;

const menuItems = [
  { path: '/admin', label: 'Overview', icon: <Dashboard /> },
  { path: '/admin/live-tracking', label: 'Live Tracking', icon: <LocationOn /> },
  { path: '/admin/users', label: 'Users', icon: <People /> },
  { path: '/admin/buses', label: 'Buses', icon: <DirectionsBus /> },
  { path: '/admin/routes', label: 'Routes', icon: <RouteIcon /> },
  { path: '/admin/fees', label: 'Fee Management', icon: <Payment /> },
  { path: '/admin/bus-assignment', label: 'Bus Assignment', icon: <AirportShuttle /> },
  { path: '/admin/displaced', label: 'Displaced Students', icon: <Warning /> },
  { path: '/admin/notifications', label: 'Notifications', icon: <Notifications /> },
  { path: '/admin/profile', label: 'Profile', icon: <Person /> },
];

const AdminSidebar = ({ user, logout, navigate, mobileOpen, handleDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const nav = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Determine active menu item from current URL
  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    toast.success("You have been logged out successfully.");
    navigate('/');
    setShowLogoutDialog(false);
    setIsLoggingOut(false);
  };

  const handleMenuItemClick = (path) => {
    nav(path);
    if (isMobile && handleDrawerToggle) {
      handleDrawerToggle();
    }
  };

  // ========================================================================
  // DRAWER CONTENT - Brand styled sidebar navigation
  // ========================================================================
  const drawerContent = (
    <>
      {/* Brand Logo Section - Matches landing page style */}
      <Box sx={{
        p: 2,
        borderBottom: `1px solid ${BRAND_COLORS.slate300}`,
      }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          {/* Gradient icon box - matching landing page icon boxes */}
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: BORDER_RADIUS.xl,
            background: BRAND_COLORS.primaryGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
          }}>
            <Security sx={{ color: BRAND_COLORS.white, fontSize: 24 }} />
          </Box>
          <Box>
            {/* Brand name with gradient text - matching landing page */}
            <Typography
              variant="h6"
              sx={{
                ...SIDEBAR_STYLES.logo,
                fontSize: '1.1rem',
              }}
            >
              MyCampusRide
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: BRAND_COLORS.slate600,
                fontWeight: 600,
              }}
            >
              Admin Portal
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu - Brand styled with gradient active states */}
      <List sx={{ px: 2, pt: 1 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleMenuItemClick(item.path)}
                sx={{
                  mb: 0.25,
                  borderRadius: BORDER_RADIUS.md,
                  background: active ? BRAND_COLORS.primaryGradient : 'transparent',
                  color: active ? BRAND_COLORS.white : BRAND_COLORS.slate700,
                  boxShadow: active ? '0 4px 12px rgba(14, 165, 233, 0.25)' : 'none',
                  py: 1,
                  '&:hover': {
                    bgcolor: active ? undefined : 'rgba(14, 165, 233, 0.08)',
                    background: active ? BRAND_COLORS.primaryGradientHover : undefined,
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 40,
                  color: 'inherit',
                  transition: 'transform 0.2s ease',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: active ? 700 : 600,
                    fontSize: '0.95rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Profile Section - Brand styled at bottom */}
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        borderTop: `1px solid ${BRAND_COLORS.slate300}`,
        bgcolor: BRAND_COLORS.slate100,
      }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          {/* User avatar with gradient border */}
          <Box sx={{
            position: 'relative',
            padding: '2px',
            borderRadius: '50%',
            background: BRAND_COLORS.primaryGradient,
          }}>
            <Avatar
              src={user?.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.profilePicture}` : undefined}
              sx={{
                bgcolor: BRAND_COLORS.white,
                color: BRAND_COLORS.skyBlue,
                fontWeight: 700,
                border: `2px solid ${BRAND_COLORS.white}`,
              }}
            >
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
          </Box>
          {/* User info */}
          <Box flex={1} minWidth={0}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: BRAND_COLORS.slate900,
              }}
              noWrap
            >
              {user?.name || 'Admin'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: BRAND_COLORS.slate600,
              }}
              noWrap
            >
              {user?.email || 'N/A'}
            </Typography>
          </Box>
          {/* Logout button with brand hover effect */}
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{
              color: BRAND_COLORS.errorRed,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: BRAND_COLORS.errorRed,
                color: BRAND_COLORS.white,
                transform: 'scale(1.1)',
              },
            }}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </>
  );

  // ========================================================================
  // RENDER - Responsive drawer with brand styling
  // ========================================================================
  return (
    <>
      {/* Mobile Drawer - Temporary overlay */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: BRAND_COLORS.white,
              // Add subtle shadow when open
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        // Desktop Drawer - Permanent sidebar
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: BRAND_COLORS.white,
              // Subtle border with brand color
              borderRight: `1px solid ${BRAND_COLORS.slate300}`,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <LogoutConfirmDialog
        open={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        loading={isLoggingOut}
      />
    </>
  );
};

export default AdminSidebar;
