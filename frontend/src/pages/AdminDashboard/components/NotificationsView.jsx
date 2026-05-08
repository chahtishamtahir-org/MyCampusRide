import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, List,
  ListItem, ListItemText, Divider, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Alert, Snackbar, Alert as MuiAlert
} from '@mui/material';
import {
  Notifications, Add
} from '@mui/icons-material';
import { notificationService } from '../../../services';

const NotificationsView = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const notificationsResponse = await notificationService.getNotifications({ limit: 50 });
      setNotifications((notificationsResponse.data && notificationsResponse.data.data) || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      showSnack('Error loading notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const openAddDialog = () => {
    setFormData({ type: 'info', receiverRole: 'all' });
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setFormData({});
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.message) {
        showSnack('Title and message are required', 'error');
        return;
      }

      let notificationData = {
        title: formData.title,
        message: formData.message,
        type: formData.type || 'info',
        priority: formData.priority || 'medium'
      };

      if (formData.receiverRole === 'all') {
        notificationData.targetType = 'all';
      } else {
        notificationData.targetType = 'role';
        notificationData.targetRole = formData.receiverRole;
      }

      await notificationService.sendNotification(notificationData);
      showSnack('Notification sent successfully');
      closeDialog();
      loadData();
    } catch (error) {
      console.error('Error sending notification:', error);
      showSnack('Failed to send notification', 'error');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Container maxWidth="xl" sx={{ p: 4 }}>
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Recent Notifications</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
                Send Notification
              </Button>
            </Box>

            {notifications.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Notifications sx={{ fontSize: 64, color: 'grey.400' }} />
                <Typography>No recent notifications</Typography>
              </Box>
            ) : (
              <List>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography sx={{ fontWeight: 600 }}>{notification.title}</Typography>
                            {notification.senderRole && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  bgcolor: 'grey.100', 
                                  px: 1, 
                                  py: 0.2, 
                                  borderRadius: 1,
                                  fontSize: '0.65rem',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                  color: 'text.secondary'
                                }}
                              >
                                {notification.senderRole}
                              </Typography>
                            )}

                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              backgroundColor: notification.type === 'info' ? '#e3f2fd' : 
                                              notification.type === 'warning' ? '#fff8e1' : 
                                              notification.type === 'error' ? '#ffebee' : 
                                              notification.type === 'success' ? '#e8f5e8' : '#f3e5f5',
                              color: notification.type === 'info' ? '#1976d2' : 
                                     notification.type === 'warning' ? '#f57c00' : 
                                     notification.type === 'error' ? '#d32f2f' : 
                                     notification.type === 'success' ? '#388e3c' : '#7b1fa2'
                            }}>
                              {notification.type}
                            </span>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">{notification.message}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(notification.createdAt).toLocaleString()}
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
          </CardContent>
        </Card>
      </Grid>

      {/* Send Notification Dialog */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={2} mt={1}>
            <TextField 
              label="Title" 
              value={formData.title || ''} 
              onChange={(e) => handleFormChange('title', e.target.value)} 
              required
            />
            <TextField 
              label="Message" 
              value={formData.message || ''} 
              multiline 
              rows={3} 
              onChange={(e) => handleFormChange('message', e.target.value)} 
              required
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select 
                value={formData.type || 'info'} 
                label="Type" 
                onChange={(e) => handleFormChange('type', e.target.value)}
              >
                <MenuItem value="info">info</MenuItem>
                <MenuItem value="warning">warning</MenuItem>
                <MenuItem value="error">error</MenuItem>
                <MenuItem value="success">success</MenuItem>
                <MenuItem value="emergency">emergency</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Receiver Role</InputLabel>
              <Select 
                value={formData.receiverRole || 'all'} 
                label="Receiver Role" 
                onChange={(e) => handleFormChange('receiverRole', e.target.value)}
              >
                <MenuItem value="all">all</MenuItem>
                <MenuItem value="admin">admin</MenuItem>
                <MenuItem value="driver">driver</MenuItem>
                <MenuItem value="student">student</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Send</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar 
        open={snack.open} 
        autoHideDuration={4000} 
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert 
          onClose={() => setSnack(prev => ({ ...prev, open: false }))} 
          severity={snack.severity} 
          sx={{ width: '100%' }}
        >
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default NotificationsView;