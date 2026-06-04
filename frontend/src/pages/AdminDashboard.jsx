// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Container, Grid, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Tabs, Tab, List, ListItem, ListItemText, Divider, Snackbar, Alert,
  CircularProgress, Fab, Drawer, AppBar, Toolbar, ListItemIcon, Badge
} from '@mui/material';
import {
  People, DirectionsBus, Route as RouteIcon, Notifications, CheckCircle,
  Cancel, Add, Refresh, Edit, Delete, Visibility, Security, Logout,
  Dashboard, Assessment, LocationOn, AccessTime, Payment
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { usersAPI, busesAPI, routesAPI, notificationsAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: { total: 0, active: 0, pending: 0 }, buses: { total: 0, active: 0, onTrip: 0 }, routes: { total: 0, active: 0 } });
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeView, setActiveView] = useState('overview');
  const [users, setUsers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState(''); // 'user-add','user-edit','bus-add','bus-edit','route-add','route-edit','notify'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, type: null });
  
  // Add new state for fee management search
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openFeeStatusDialog, setOpenFeeStatusDialog] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [refreshing, setRefreshing] = useState(false);
  
  // Stops management for routes
  const [stops, setStops] = useState([]);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [
        userStatsResponse,
        busStatsResponse,
        routeStatsResponse,
        pendingDriversResponse,
        notificationsResponse,
        usersResponse,
        busesResponse,
        routesResponse,
      ] = await Promise.all([
        usersAPI.getUserStats(),
        busesAPI.getBusStats(),
        routesAPI.getRouteStats(),
        usersAPI.getPendingDrivers(),
        notificationsAPI.getNotifications({ limit: 5 }),
        usersAPI.getUsers({ limit: 100 }),
        busesAPI.getBuses({ limit: 100 }),
        routesAPI.getRoutes({ limit: 100 }),
      ]);

      // adapt to your response shape; assuming response.data.data
      setStats({
        users: (userStatsResponse.data && userStatsResponse.data.data) || { total: 0, active: 0, pending: 0 },
        buses: (busStatsResponse.data && busStatsResponse.data.data) || { total: 0, active: 0, onTrip: 0 },
        routes: (routeStatsResponse.data && routeStatsResponse.data.data) || { total: 0, active: 0 },
      });

      setPendingDrivers((pendingDriversResponse.data && pendingDriversResponse.data.data) || []);
      setRecentNotifications((notificationsResponse.data && notificationsResponse.data.data) || []);
      setUsers((usersResponse.data && usersResponse.data.data) || []);
      setBuses((busesResponse.data && busesResponse.data.data) || []);
      setRoutes((routesResponse.data && routesResponse.data.data) || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- Pending driver actions ---------- */
  const handleApproveDriver = async (driverId) => {
    try {
      await usersAPI.approveDriver(driverId);
      setSnack({ open: true, message: 'Driver approved', severity: 'success' });
      setPendingDrivers(prev => prev.filter(d => d._id !== driverId));
      // Update stats
      setStats(prev => ({
        ...prev,
        users: { ...prev.users, pending: prev.users.pending - 1, active: prev.users.active + 1 }
      }));
      // Reload users list to show the approved driver
      const usersResponse = await usersAPI.getUsers({ limit: 100 });
      setUsers((usersResponse.data && usersResponse.data.data) || []);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: err?.response?.data?.message || 'Failed to approve driver', severity: 'error' });
    }
  };

  const handleRejectDriver = async (driverId) => {
    try {
      await usersAPI.rejectDriver(driverId, 'Rejected by admin');
      setSnack({ open: true, message: 'Driver rejected', severity: 'info' });
      setPendingDrivers(prev => prev.filter(d => d._id !== driverId));
      // Update stats
      setStats(prev => ({
        ...prev,
        users: { ...prev.users, pending: prev.users.pending - 1 }
      }));
      // Reload users list to show the rejected driver
      const usersResponse = await usersAPI.getUsers({ limit: 100 });
      setUsers((usersResponse.data && usersResponse.data.data) || []);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: err?.response?.data?.message || 'Failed to reject driver', severity: 'error' });
    }
  };

  /* ---------- Generic CRUD operations ---------- */
  // Open add/edit dialogs
  const openAddDialog = (type) => { setFormData({}); setDialogMode(type); setSelectedItem(null); setOpenDialog(true); setStops([]); };
  const openEditDialog = (type, item) => { 
    setSelectedItem(item); 
    setFormData(item || {}); 
    setDialogMode(type); 
    setOpenDialog(true); 
    // Re-sequence stops to ensure they're sequential
    const stops = item?.stops || [];
    const resequencedStops = stops.map((stop, idx) => ({ ...stop, sequence: idx + 1 }));
    setStops(resequencedStops); 
  };

  // Add new function to open fee status dialog
  const openFeeStatusDialogHandler = (student) => {
    setSelectedStudent(student);
    setFormData({
      feeStatus: student.feeStatus || 'pending',
      assignedRoute: student.assignedRoute?._id || '',
      assignedBus: student.assignedBus?._id || ''
    });
    setOpenFeeStatusDialog(true);
  };

  const closeDialog = () => { setOpenDialog(false); setDialogMode(''); setSelectedItem(null); setFormData({}); setStops([]); };
  
  // Add new function to close fee status dialog
  const closeFeeStatusDialog = () => {
    setOpenFeeStatusDialog(false);
    setSelectedStudent(null);
    setFormData({});
  };

  // Delete
  const confirmDeleteItem = (type, id) => setConfirmDelete({ open: true, id, type });

  const handleDelete = async () => {
    const { id, type } = confirmDelete;
    try {
      if (type === 'user') await usersAPI.deleteUser(id);
      if (type === 'bus') await busesAPI.deleteBus(id);
      if (type === 'route') await routesAPI.deleteRoute(id);

      setSnack({ open: true, message: `${type} deleted`, severity: 'success' });
      setConfirmDelete({ open: false, id: null, type: null });
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: `Failed to delete ${type}`, severity: 'error' });
      setConfirmDelete({ open: false, id: null, type: null });
    }
  };

  /* ---------- Form submitters ---------- */
  

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'user-add') {
        await usersAPI.createUser(formData);
        setSnack({ open: true, message: 'User created', severity: 'success' });
      } else if (dialogMode === 'user-edit') {
        await usersAPI.updateUser(selectedItem._id, formData);
        setSnack({ open: true, message: 'User updated', severity: 'success' });
      } else if (dialogMode === 'bus-add') {
        await busesAPI.createBus(formData);
        setSnack({ open: true, message: 'Bus created', severity: 'success' });
      } else if (dialogMode === 'bus-edit') {
        await busesAPI.updateBus(selectedItem._id, formData);
        setSnack({ open: true, message: 'Bus updated', severity: 'success' });
      } else if (dialogMode === 'route-add') {
        // Validate departure time
        if (!formData.departureTime) {
          setSnack({ open: true, message: 'Departure time is required', severity: 'error' });
          return;
        }
        // Attach stops to formData - filter out empty stops and re-sequence them
        const validStops = stops.filter(s => s.name && s.pickupTime);
        const resequencedStops = validStops.map((stop, idx) => ({ ...stop, sequence: idx + 1 }));
        const routeData = { ...formData, stops: resequencedStops };
        await routesAPI.createRoute(routeData);
        setSnack({ open: true, message: 'Route created', severity: 'success' });
      } else if (dialogMode === 'route-edit') {
        // Attach stops to formData - filter out empty stops and re-sequence them
        const validStops = stops.filter(s => s.name && s.pickupTime);
        const resequencedStops = validStops.map((stop, idx) => ({ ...stop, sequence: idx + 1 }));
        const routeData = { ...formData, stops: resequencedStops };
        await routesAPI.updateRoute(selectedItem._id, routeData);
        setSnack({ open: true, message: 'Route updated', severity: 'success' });
      } else if (dialogMode === 'notify') {
        const notificationData = {
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

        await notificationsAPI.sendNotification(notificationData);
        setSnack({ open: true, message: 'Notification sent', severity: 'success' });
        const notificationsResponse = await notificationsAPI.getNotifications({ limit: 5 });
        setRecentNotifications((notificationsResponse.data && notificationsResponse.data.data) || []);
      }

      closeDialog();
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || 'Operation failed';
      setSnack({ open: true, message, severity: 'error' });
    }
  };

  // Add new function to handle fee status submission
  const handleFeeStatusSubmit = async () => {
    try {
      const updateData = {
        feeStatus: formData.feeStatus,
        assignedRoute: formData.assignedRoute || null,
        assignedBus: formData.assignedBus || null
      };

      // If fee status is paid or partially paid, we should assign a route and bus
      if ((formData.feeStatus === 'paid' || formData.feeStatus === 'partially_paid') && 
          (!formData.assignedRoute || !formData.assignedBus)) {
        setSnack({ open: true, message: 'Please assign both route and bus for paid/partially paid students', severity: 'error' });
        return;
      }

      // If fee status is pending, we should remove route and bus assignments
      if (formData.feeStatus === 'pending') {
        updateData.assignedRoute = null;
        updateData.assignedBus = null;
      }

      await usersAPI.updateUser(selectedStudent._id, updateData);
      setSnack({ open: true, message: 'Student fee status updated successfully', severity: 'success' });
      closeFeeStatusDialog();
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || 'Failed to update fee status';
      setSnack({ open: true, message, severity: 'error' });
    }
  };

  /* ---------- small helpers ---------- */
  const openViewUser = (u) => {
    // for demo: open user-edit but readonly? keep edit
    openEditDialog('user-edit', u);
  };

  // Add new function to format fee status
  const formatFeeStatus = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'partially_paid': return 'Partially Paid';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  const drawerWidth = 280;

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <Dashboard /> },
    { id: 'users', label: 'Users', icon: <People /> },
    { id: 'buses', label: 'Buses', icon: <DirectionsBus /> },
    { id: 'routes', label: 'Routes', icon: <RouteIcon /> },
    { id: 'fee-management', label: 'Fee Management', icon: <Payment /> },
    { id: 'notifications', label: 'Notifications', icon: <Notifications /> },
    { id: 'reports', label: 'Reports', icon: <Assessment /> },
  ];

  // Add new function to get available buses for a route
  const getBusesForRoute = (routeId) => {
    return buses.filter(bus => bus.routeId?._id === routeId || bus.routeId === routeId);
  };

  

  // Add new function to handle fee status form change
  const handleFeeStatusFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Auto-populate buses when route is selected
    if (key === 'assignedRoute' && value) {
      const routeBuses = getBusesForRoute(value);
      if (routeBuses.length > 0 && !prev.assignedBus) {
        setFormData(prevState => ({ ...prevState, assignedBus: routeBuses[0]._id }));
      }
    }
  };

  // Add generic form change handler
  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Left Sidebar Navigation */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'white',
            borderRight: '1px solid rgba(0,0,0,0.08)',
          },
        }}
      >
        {/* Logo/Top section */}
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
              <Security />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                MyCampusRide
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Admin Portal
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Navigation Menu */}
        <List sx={{ px: 2, pt: 2 }}>
          {menuItems.map((item) => (
            <ListItem
              key={item.id}
              button
              onClick={() => setActiveView(item.id)}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                bgcolor: activeView === item.id ? 'primary.main' : 'transparent',
                color: activeView === item.id ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: activeView === item.id ? 'primary.dark' : 'action.hover',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
              />
              {item.id === 'notifications' && stats.users.pending > 0 && (
                <Badge badgeContent={stats.users.pending} color="error" />
              )}
            </ListItem>
          ))}
        </List>

        {/* User Profile Section */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          p: 2,
          borderTop: '1px solid rgba(0,0,0,0.08)',
          bgcolor: 'grey.50'
        }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {user?.name || 'Admin'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email || 'N/A'}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleLogout}
              sx={{
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'white'
                }
              }}
            >
              <Logout fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Top Bar */}
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            bgcolor: 'white',
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1, color: 'text.primary' }}>
              {menuItems.find(item => item.id === activeView)?.label || 'Admin Dashboard'}
            </Typography>
            <Button
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ p: 4 }}>
          {/* Overview View */}
          {activeView === 'overview' && (
            <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2">Total Users</Typography>
                    <Typography variant="h4">{stats.users.total}</Typography>
                    <Typography variant="body2">{stats.users.active} active</Typography>
                  </Box>
                  <Avatar><People /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2">Total Buses</Typography>
                    <Typography variant="h4">{stats.buses.total}</Typography>
                    <Typography variant="body2">{stats.buses.active} active</Typography>
                  </Box>
                  <Avatar><DirectionsBus /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2">Total Routes</Typography>
                    <Typography variant="h4">{stats.routes.total}</Typography>
                    <Typography variant="body2">{stats.routes.active} active</Typography>
                  </Box>
                  <Avatar><RouteIcon /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg,#fa709a 0%,#fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2">Pending Drivers</Typography>
                    <Typography variant="h4">{stats.users.pending}</Typography>
                    <Typography variant="body2">Awaiting approval</Typography>
                  </Box>
                  <Avatar><Notifications /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
            </Grid>
          )}

          {/* Pending Approvals / Users View */}
          {activeView === 'users' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Pending Driver Approvals</Typography>
                    {pendingDrivers.length === 0 ? (
                      <Box textAlign="center" py={6}>
                        <Security sx={{ fontSize: 64, color: 'grey.400' }} />
                        <Typography>No pending approvals</Typography>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>License</TableCell>
                              <TableCell>Phone</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {pendingDrivers.map(d => (
                              <TableRow key={d._id}>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar>{d.name?.charAt(0)}</Avatar>
                                    <Typography>{d.name}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>{d.email}</TableCell>
                                <TableCell>{d.licenseNumber}</TableCell>
                                <TableCell>{d.phone}</TableCell>
                                <TableCell>
                                  <Button startIcon={<CheckCircle />} color="success" onClick={() => handleApproveDriver(d._id)}>Approve</Button>
                                  <Button startIcon={<Cancel />} color="error" onClick={() => handleRejectDriver(d._id)}>Reject</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6">All Users ({users.length})</Typography>
                      <Box>
                        <Button variant="contained" startIcon={<Add />} onClick={() => openAddDialog('user-add')}>Add User</Button>
                      </Box>
                    </Box>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {users.map(u => (
                            <TableRow key={u._id}>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar>{u.name?.charAt(0)}</Avatar>
                                  <Box>
                                    <Typography sx={{ fontWeight: 600 }}>{u.name}</Typography>
                                    <Typography variant="caption">ID: {u.studentId || u.licenseNumber || 'N/A'}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip label={u.role} size="small" />
                              </TableCell>
                              <TableCell><Chip label={u.status} size="small" /></TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>{u.phone}</TableCell>
                              <TableCell>
                                <IconButton onClick={() => openViewUser(u)}><Visibility /></IconButton>
                                <IconButton onClick={() => openEditDialog('user-edit', u)}><Edit /></IconButton>
                                <IconButton onClick={() => confirmDeleteItem('user', u._id)} color="error"><Delete /></IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Buses View */}
          {activeView === 'buses' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6">Buses ({buses.length})</Typography>
                      <Button variant="contained" startIcon={<Add />} onClick={() => openAddDialog('bus-add')}>Add Bus</Button>
                    </Box>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Bus Number</TableCell>
                            <TableCell>Driver</TableCell>
                            <TableCell>Route</TableCell>
                            <TableCell>Capacity</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {buses.map(b => (
                            <TableRow key={b._id}>
                              <TableCell>
                                <Typography sx={{ fontWeight: 600 }}>{b.busNumber}</Typography>
                                <Typography variant="caption">{b.model} ({b.year})</Typography>
                              </TableCell>
                              <TableCell>{b.driverId?.name || 'No driver'}</TableCell>
                              <TableCell>{b.routeId?.routeName || 'No route'}</TableCell>
                              <TableCell>{b.capacity}</TableCell>
                              <TableCell><Chip label={b.status} size="small" /></TableCell>
                              <TableCell>
                                <IconButton onClick={() => openEditDialog('bus-edit', b)}><Edit /></IconButton>
                                <IconButton onClick={() => confirmDeleteItem('bus', b._id)} color="error"><Delete /></IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Routes View */}
          {activeView === 'routes' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6">Routes ({routes.length})</Typography>
                      <Button variant="contained" startIcon={<Add />} onClick={() => openAddDialog('route-add')}>Add Route</Button>
                    </Box>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Route No</TableCell>
                            <TableCell>Route Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Stops</TableCell>
                            <TableCell>Distance (km)</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {routes.map(r => (
                            <TableRow key={r._id}>
                              <TableCell sx={{ fontWeight: 600 }}>{r.routeNo || 'N/A'}</TableCell>
                              <TableCell>{r.routeName}</TableCell>
                              <TableCell>{r.description || '???'}</TableCell>
                              <TableCell>{(r.stops && r.stops.length) || 0}</TableCell>
                              <TableCell>{r.distance}</TableCell>
                              <TableCell><Chip label={r.isActive ? 'Active' : 'Inactive'} size="small" /></TableCell>
                              <TableCell>
                                <IconButton onClick={() => openEditDialog('route-edit', r)}><Edit /></IconButton>
                                <IconButton onClick={() => confirmDeleteItem('route', r._id)} color="error"><Delete /></IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Fee Management View */}
          {activeView === 'fee-management' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Typography variant="h6">Fee Management</Typography>
                      <TextField
                        size="small"
                        placeholder="Search by Student ID"
                        value={feeSearchQuery}
                        onChange={(e) => setFeeSearchQuery(e.target.value)}
                        sx={{ minWidth: 300 }}
                      />
                    </Box>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Student ID</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Fee Status</TableCell>
                            <TableCell>Assigned Route</TableCell>
                            <TableCell>Assigned Bus</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {users
                            .filter(u => u.role === 'student')
                            .filter(u => !feeSearchQuery || u.studentId?.toLowerCase().includes(feeSearchQuery.toLowerCase()))
                            .map(student => (
                            <TableRow key={student._id}>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar>{student.name?.charAt(0)}</Avatar>
                                  <Typography sx={{ fontWeight: 600 }}>{student.name}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{student.studentId || 'N/A'}</Typography>
                              </TableCell>
                              <TableCell>{student.email}</TableCell>
                              <TableCell>{student.phone}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={formatFeeStatus(student.feeStatus)} 
                                  size="small"
                                  color={
                                    student.feeStatus === 'paid' ? 'success' :
                                    student.feeStatus === 'partially_paid' ? 'warning' : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                {student.assignedRoute ? (
                                  <Typography variant="body2">
                                    {typeof student.assignedRoute === 'object' 
                                      ? student.assignedRoute.routeName 
                                      : routes.find(r => r._id === student.assignedRoute)?.routeName || 'Unknown'}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">Not Assigned</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {student.assignedBus ? (
                                  <Typography variant="body2">
                                    {typeof student.assignedBus === 'object' 
                                      ? student.assignedBus.busNumber 
                                      : buses.find(b => b._id === student.assignedBus)?.busNumber || 'Unknown'}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">Not Assigned</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  onClick={() => openFeeStatusDialogHandler(student)}
                                >
                                  Update Fee
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {users.filter(u => u.role === 'student').filter(u => !feeSearchQuery || u.studentId?.toLowerCase().includes(feeSearchQuery.toLowerCase())).length === 0 && (
                      <Box textAlign="center" py={6}>
                        <Payment sx={{ fontSize: 64, color: 'grey.400' }} />
                        <Typography color="text.secondary">No students found</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Notifications View */}
          {activeView === 'notifications' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6">Recent Notifications</Typography>
                      <Button variant="contained" startIcon={<Add />} onClick={() => openAddDialog('notify')}>Send Notification</Button>
                    </Box>

                    {recentNotifications.length === 0 ? (
                      <Box textAlign="center" py={6}>
                        <Notifications sx={{ fontSize: 64, color: 'grey.400' }} />
                        <Typography>No recent notifications</Typography>
                      </Box>
                    ) : (
                      <List>
                        {recentNotifications.map((n, i) => (
                          <React.Fragment key={n._id}>
                            <ListItem alignItems="flex-start">
                              <ListItemText
                                primary={<Box display="flex" alignItems="center" gap={2}><Typography sx={{ fontWeight: 600 }}>{n.title}</Typography><Chip label={n.type} size="small" /></Box>}
                                secondary={<Box><Typography variant="body2">{n.message}</Typography><Typography variant="caption">{new Date(n.createdAt).toLocaleString()}</Typography></Box>}
                              />
                            </ListItem>
                            {i < recentNotifications.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Reports View */}
          {activeView === 'reports' && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Reports & Analytics</Typography>
                    <Alert severity="info">
                      Reports feature coming soon. This will include detailed analytics and insights about the transport system.
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>

      {/* ---------- Dialog: Add/Edit (Users/Buses/Routes/Notify) ---------- */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'user-add' && 'Add User'}
          {dialogMode === 'user-edit' && 'Edit User'}
          {dialogMode === 'bus-add' && 'Add Bus'}
          {dialogMode === 'bus-edit' && 'Edit Bus'}
          {dialogMode === 'route-add' && 'Add Route'}
          {dialogMode === 'route-edit' && 'Edit Route'}
          {dialogMode === 'notify' && 'Send Notification'}
        </DialogTitle>
        <DialogContent dividers>
          {/* USER FORM */}
          {(dialogMode === 'user-add' || dialogMode === 'user-edit') && (
            <Box display="grid" gap={2} mt={1}>
              <TextField label="Name" value={formData.name || ''} onChange={(e) => handleFormChange('name', e.target.value)} />
              <TextField label="Email" value={formData.email || ''} onChange={(e) => handleFormChange('email', e.target.value)} />
              <TextField label="Phone" value={formData.phone || ''} onChange={(e) => handleFormChange('phone', e.target.value)} />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select value={formData.role || 'student'} label="Role" onChange={(e) => handleFormChange('role', e.target.value)} disabled={dialogMode === 'user-edit'}>
                  <MenuItem value="admin">admin</MenuItem>
                  <MenuItem value="driver">driver</MenuItem>
                  <MenuItem value="student">student</MenuItem>
                </Select>
              </FormControl>
              {formData.role === 'student' && <TextField label="Student ID" value={formData.studentId || ''} onChange={(e) => handleFormChange('studentId', e.target.value)} disabled={dialogMode === 'user-edit'} helperText={dialogMode === 'user-edit' ? 'Student ID cannot be changed' : ''} />}
              {formData.role === 'driver' && <TextField label="License Number" value={formData.licenseNumber || ''} onChange={(e) => handleFormChange('licenseNumber', e.target.value)} disabled={dialogMode === 'user-edit'} helperText={dialogMode === 'user-edit' ? 'License Number cannot be changed' : ''} />}
              {formData.role === 'driver' && <TextField label="Salary (PKR)" type="number" value={formData.salary || ''} onChange={(e) => handleFormChange('salary', Number(e.target.value))} />}
              {dialogMode === 'user-add' && <TextField label="Password" type="password" value={formData.password || ''} onChange={(e) => handleFormChange('password', e.target.value)} />}
            </Box>
          )}

          {/* BUS FORM */}
          {(dialogMode === 'bus-add' || dialogMode === 'bus-edit') && (
            <Box display="grid" gap={2} mt={1}>
              <TextField label="Bus Number" value={formData.busNumber || ''} onChange={(e) => handleFormChange('busNumber', e.target.value)} />
              <TextField label="Model" value={formData.model || ''} onChange={(e) => handleFormChange('model', e.target.value)} />
              <TextField label="Year" type="number" value={formData.year || ''} onChange={(e) => handleFormChange('year', Number(e.target.value))} />
              <TextField label="Capacity" type="number" value={formData.capacity || ''} onChange={(e) => handleFormChange('capacity', Number(e.target.value))} />
              <FormControl fullWidth>
                <InputLabel>Driver</InputLabel>
                <Select value={formData.driverId || ''} label="Driver" onChange={(e) => handleFormChange('driverId', e.target.value)}>
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.filter(u => u.role === 'driver' && u.status === 'active').map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Route</InputLabel>
                <Select value={formData.routeId || ''} label="Route" onChange={(e) => handleFormChange('routeId', e.target.value)}>
                  <MenuItem value="">Unassigned</MenuItem>
                  {routes.map(r => <MenuItem key={r._id} value={r._id}>{r.routeName}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* ROUTE FORM */}
          {(dialogMode === 'route-add' || dialogMode === 'route-edit') && (
            <Box display="grid" gap={2} mt={1}>
              <TextField label="Route Number" value={formData.routeNo || ''} onChange={(e) => handleFormChange('routeNo', e.target.value)} helperText="e.g., R001, R002" />
              <TextField label="Route Name" value={formData.routeName || ''} onChange={(e) => handleFormChange('routeName', e.target.value)} />
              <TextField label="Description" value={formData.description || ''} multiline rows={2} onChange={(e) => handleFormChange('description', e.target.value)} />
              
              <TextField 
                label="Departure Time" 
                type="time" 
                value={formData.departureTime || ''} 
                onChange={(e) => handleFormChange('departureTime', e.target.value)} 
                InputLabelProps={{ shrink: true }}
                helperText="When bus leaves university"
              />

              <TextField label="Distance (km)" type="number" value={formData.distance || ''} onChange={(e) => handleFormChange('distance', Number(e.target.value))} />
              <TextField label="Estimated Duration (minutes)" type="number" value={formData.estimatedDuration || ''} onChange={(e) => handleFormChange('estimatedDuration', Number(e.target.value))} />
              <FormControl fullWidth>
                <InputLabel>Active</InputLabel>
                <Select value={formData.isActive === undefined ? true : formData.isActive} label="Active" onChange={(e) => handleFormChange('isActive', e.target.value)}>
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>

              {/* Stops Management */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Stops</Typography>
              
              {/* Stop form */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      label="Stop Name" 
                      size="small"
                      fullWidth
                      value={(stops[stops.length - 1]?.name || '')}
                      onChange={(e) => {
                        const newStops = [...stops];
                        const lastIdx = newStops.length - 1;
                        if (lastIdx >= 0) {
                          newStops[lastIdx].name = e.target.value;
                        } else {
                          newStops.push({ name: e.target.value, address: '', sequence: 1, pickupTime: '', fee: 0 });
                        }
                        setStops(newStops);
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      label="Pickup Time" 
                      type="time"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={(stops[stops.length - 1]?.pickupTime || '')}
                      onChange={(e) => {
                        const newStops = [...stops];
                        const lastIdx = newStops.length - 1;
                        if (lastIdx >= 0) {
                          newStops[lastIdx].pickupTime = e.target.value;
                        } else {
                          newStops.push({ name: '', address: '', sequence: 1, pickupTime: e.target.value, fee: 0 });
                        }
                        setStops(newStops);
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      label="Fee (PKR)" 
                      type="number"
                      size="small"
                      fullWidth
                      value={(stops[stops.length - 1]?.fee || '')}
                      onChange={(e) => {
                        const newStops = [...stops];
                        const lastIdx = newStops.length - 1;
                        if (lastIdx >= 0) {
                          newStops[lastIdx].fee = Number(e.target.value);
                        } else {
                          newStops.push({ name: '', address: '', sequence: 1, pickupTime: '', fee: Number(e.target.value) });
                        }
                        setStops(newStops);
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      startIcon={<Add />}
                      onClick={() => {
                        const newStop = { name: '', address: '', sequence: stops.length + 1, pickupTime: '', fee: 0 };
                        setStops([...stops, newStop]);
                      }}
                    >
                      Add Stop
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Display added stops */}
              {stops.length > 0 && (
                <Box>
                  {stops.map((stop, idx) => (
                    stop.name && (
                      <Card key={idx} sx={{ mb: 1, bgcolor: 'grey.50' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={1}>
                              <LocationOn fontSize="small" color="primary" />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{stop.name}</Typography>
                              <AccessTime fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">{stop.pickupTime || 'No time'}</Typography>
                              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>PKR {stop.fee || 0}</Typography>
                            </Box>
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                const updatedStops = stops.filter((_, i) => i !== idx);
                                // Re-sequence the stops to ensure they're sequential
                                const resequencedStops = updatedStops.map((stop, newIdx) => ({
                                  ...stop,
                                  sequence: newIdx + 1
                                }));
                                setStops(resequencedStops);
                              }}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </Box>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                Add stops where the bus will pick up students. Each stop needs a name and pickup time.
              </Alert>
            </Box>
          )}

          {/* NOTIFICATION FORM */}
          {dialogMode === 'notify' && (
            <Box display="grid" gap={2} mt={1}>
              <TextField label="Title" value={formData.title || ''} onChange={(e) => handleFormChange('title', e.target.value)} />
              <TextField label="Message" value={formData.message || ''} multiline rows={3} onChange={(e) => handleFormChange('message', e.target.value)} />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={formData.type || 'info'} label="Type" onChange={(e) => handleFormChange('type', e.target.value)}>
                  <MenuItem value="info">info</MenuItem>
                  <MenuItem value="warning">warning</MenuItem>
                  <MenuItem value="error">error</MenuItem>
                  <MenuItem value="success">success</MenuItem>
                  <MenuItem value="emergency">emergency</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Receiver Role</InputLabel>
                <Select value={formData.receiverRole || 'all'} label="Receiver Role" onChange={(e) => handleFormChange('receiverRole', e.target.value)}>
                  <MenuItem value="all">all</MenuItem>
                  <MenuItem value="admin">admin</MenuItem>
                  <MenuItem value="driver">driver</MenuItem>
                  <MenuItem value="student">student</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null, type: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this {confirmDelete.type}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, id: null, type: null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Fee Status Dialog */}
      <Dialog open={openFeeStatusDialog} onClose={closeFeeStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Fee Status - {selectedStudent?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={3} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Fee Status</InputLabel>
              <Select 
                value={formData.feeStatus || 'pending'} 
                label="Fee Status" 
                onChange={(e) => handleFeeStatusFormChange('feeStatus', e.target.value)}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="partially_paid">Partially Paid</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>

            {(formData.feeStatus === 'paid' || formData.feeStatus === 'partially_paid') && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Assign Route</InputLabel>
                  <Select 
                    value={formData.assignedRoute || ''} 
                    label="Assign Route" 
                    onChange={(e) => handleFeeStatusFormChange('assignedRoute', e.target.value)}
                  >
                    <MenuItem value="">Select Route</MenuItem>
                    {routes.map(route => (
                      <MenuItem key={route._id} value={route._id}>
                        {route.routeName} ({route.routeNo})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Assign Bus</InputLabel>
                  <Select 
                    value={formData.assignedBus || ''} 
                    label="Assign Bus" 
                    onChange={(e) => handleFeeStatusFormChange('assignedBus', e.target.value)}
                    disabled={!formData.assignedRoute}
                  >
                    <MenuItem value="">Select Bus</MenuItem>
                    {formData.assignedRoute && getBusesForRoute(formData.assignedRoute).map(bus => (
                      <MenuItem key={bus._id} value={bus._id}>
                        {bus.busNumber} - {bus.model} ({bus.year})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {formData.assignedRoute && getBusesForRoute(formData.assignedRoute).length === 0 && (
                  <Alert severity="warning">
                    No buses assigned to this route. Please assign a bus to the route first.
                  </Alert>
                )}
              </>
            )}

            {formData.feeStatus === 'pending' && (
              <Alert severity="info">
                Setting fee status to pending will remove any assigned route and bus.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFeeStatusDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleFeeStatusSubmit}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(prev => ({ ...prev, open: false }))}>
        <Alert onClose={() => setSnack(prev => ({ ...prev, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
