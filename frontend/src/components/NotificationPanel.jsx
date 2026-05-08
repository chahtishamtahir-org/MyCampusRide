import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Button,
  Badge,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  CheckCircle,
  Error,
  Warning,
  Info,
  MoreVert,
  MarkEmailRead,
} from '@mui/icons-material';
import { notificationService } from '../services';

const NotificationPanel = ({ maxHeight = 400, onCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);
  
  useEffect(() => {
    // Update unread count when notifications change
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
    if (onCountChange) onCountChange(count);
  }, [notifications, onCountChange]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationService.getNotifications({ limit: 10 });
      const notificationData = response.data.data || [];
      setNotifications(notificationData);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Notification panel error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
      // Decrement the unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true, readAt: new Date() }))
      );
      // Reset the unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleMenuOpen = (event, notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'emergency':
        return <NotificationsActive color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };



  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <Notifications color="primary" />
          </Badge>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
        </Box>
        <Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllAsRead}
              sx={{ mr: 1 }}
            >
              Mark All Read
            </Button>
          )}
          <IconButton size="small" onClick={loadNotifications}>
            <CircularProgress size={16} />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Notifications sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            No notifications yet
          </Typography>
        </Box>
      ) : (
        <List
          sx={{
            maxHeight,
            overflow: 'auto',
            '& .MuiListItem-root': {
              bgcolor: 'transparent',
              borderRadius: 1,
              mb: 0.5,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            },
          }}
        >
          {notifications.map((notification, index) => (
            <React.Fragment key={notification._id}>
              <ListItem
                sx={{
                  bgcolor: notification.isRead ? 'transparent' : 'primary.50',
                  border: notification.isRead ? 'none' : '1px solid',
                  borderColor: 'primary.200',
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: notification.isRead ? 400 : 600,
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          {notification.title}
                          {notification.senderRole && (
                            <Typography 
                              component="span" 
                              variant="caption" 
                              sx={{ 
                                bgcolor: 'rgba(0,0,0,0.05)', 
                                px: 1, 
                                py: 0.2, 
                                borderRadius: 1,
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                color: 'text.secondary',
                                fontWeight: 700
                              }}
                            >
                              {notification.senderRole}
                            </Typography>
                          )}
                        </Typography>
                      <Chip
                        label={notification.priority}
                        color={getPriorityColor(notification.priority)}
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, notification)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 0.5,
                          fontWeight: notification.isRead ? 400 : 500,
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notification.createdAt)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedNotification && !selectedNotification.isRead && (
          <MenuItem
            onClick={() => {
              handleMarkAsRead(selectedNotification._id);
              handleMenuClose();
            }}
          >
            <CheckCircle sx={{ mr: 1 }} />
            Mark as Read
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <Info sx={{ mr: 1 }} />
          View Details
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default NotificationPanel;




