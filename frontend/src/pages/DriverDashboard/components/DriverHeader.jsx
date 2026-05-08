/**
 * DriverHeader Component
 *
 * Top header bar for the Driver Portal with brand styling.
 * Features glassmorphism effect, gradient notification badge,
 * brand-styled buttons, and mobile drawer toggle.
 */

import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Badge, IconButton, Popover, Box, useTheme, useMediaQuery
} from '@mui/material';
import { Refresh, Notifications, Menu as MenuIcon, Campaign } from '@mui/icons-material';
import NotificationPanel from '../../../components/NotificationPanel';
import { notificationService, socketService } from '../../../services';

import {
  BRAND_COLORS,
  BUTTON_STYLES,
  glassmorphism,
  BORDER_RADIUS,
  SHADOWS,
} from '../../../styles/brandStyles';

const menuItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'passengers', label: 'Passengers' },
  { id: 'trips', label: 'My Route' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'profile', label: 'Profile' },
];

const DriverHeader = ({ user, handleDrawerToggle, onRefresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [refreshing, setRefreshing] = useState(false);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleRefresh = () => {
    setRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getNotificationStats();
      const stats = response.data;
      setUnreadCount(stats.data?.unread || 0);
    } catch (error) {
      console.error('Error loading notification stats:', error);
      try {
        const response = await notificationService.getNotifications({ limit: 50 });
        const notifications = response.data.data || [];
        const unread = notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Error loading notifications fallback:', err);
        setUnreadCount(0);
      }
    }
  };

  useEffect(() => {
    loadUnreadCount();

    // Listen for new notifications in real-time
    const handleNewNotification = (notification) => {
      console.log('New driver notification received:', notification);
      setUnreadCount(prev => prev + 1);
    };

    socketService.on('new-notification', handleNewNotification);

    return () => {
      socketService.off('new-notification', handleNewNotification);
    };
  }, []);

  return (
    <>
      {/* Header with glassmorphism */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          ...glassmorphism(10, 0.98),
          borderBottom: `1px solid ${BRAND_COLORS.slate300}`,
          boxShadow: SHADOWS.sm,
        }}
      >
        <Toolbar>
          {/* Mobile Menu Toggle */}
          {isMobile && (
            <IconButton
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                color: BRAND_COLORS.skyBlue,
                '&:hover': {
                  bgcolor: 'rgba(14, 165, 233, 0.08)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Page Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              flexGrow: 1,
              color: BRAND_COLORS.slate900,
            }}
          >
            Driver Dashboard
          </Typography>



          {/* Notification Badge */}
          <IconButton
            size="large"
            aria-label="show notifications"
            onClick={handleNotificationClick}
            sx={{
              mr: 1,
              color: BRAND_COLORS.slate700,
              transition: 'all 0.3s ease',
              '&:hover': {
                color: BRAND_COLORS.skyBlue,
                bgcolor: 'rgba(14, 165, 233, 0.08)',
                transform: 'scale(1.05)',
              },
            }}
          >
            <Badge
              badgeContent={unreadCount}
              sx={{
                '& .MuiBadge-badge': {
                  background: BRAND_COLORS.primaryGradient,
                  color: BRAND_COLORS.white,
                  fontWeight: 600,
                },
              }}
            >
              <Notifications />
            </Badge>
          </IconButton>

          {/* Refresh Button */}
          {!isMobile && (
            <Button
              variant="contained"
              sx={{
                ...BUTTON_STYLES.primary,
                px: 3,
                py: 1,
                minWidth: 120,
              }}
              startIcon={<Refresh sx={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }} />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Notification Popover */}
      <Popover
        open={Boolean(notificationAnchorEl)}
        anchorEl={notificationAnchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          mt: 1,
          '& .MuiPopover-paper': {
            borderRadius: BORDER_RADIUS.lg,
            boxShadow: SHADOWS.xl,
            overflow: 'hidden',
          },
        }}
      >
        <div style={{ width: 350 }}>
          <NotificationPanel 
            maxHeight={400} 
            onCountChange={setUnreadCount}
          />
        </div>
      </Popover>
    </>
  );
};

export default DriverHeader;
