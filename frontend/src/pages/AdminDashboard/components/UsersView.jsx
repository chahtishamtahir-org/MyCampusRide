import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Chip, IconButton,
  Button, Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, FormControl, InputLabel, Select,
  InputAdornment, Stack, Alert, Skeleton
} from '@mui/material';
import {
  Add, Edit, Delete, CheckCircle, Cancel, AdminPanelSettings,
  School, DirectionsBus, Search, FilterList, Refresh, PictureAsPdf,
  MoreVert, Close, Person, Email, Clear, People, Visibility, VisibilityOff
} from '@mui/icons-material';
import { userService, busService, routeService } from '../../../services';
import { toast } from '../../../utils/toast';
import ConfirmDialog from '../../../components/ConfirmDialog';
import UserDetailDialog from './UserDetailDialog';
import { useAuth } from '../../../context/AuthContext';

const UsersView = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, id: null, message: '' });
  const [detailUser, setDetailUser] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, pendingResponse, busesResponse, routesResponse] = await Promise.all([
        userService.getUsers({ limit: 100 }), // In a real app, we might need pagination/server-side search
        userService.getPendingDrivers(),
        busService.getBuses({ limit: 100 }),
        routeService.getActiveRoutes()
      ]);

      setUsers((usersResponse.data && usersResponse.data.data) || []);
      setPendingDrivers((pendingResponse.data && pendingResponse.data.data) || []);
      setBuses((busesResponse.data && busesResponse.data.data) || []);
      setRoutes((routesResponse.data && routesResponse.data.data) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDriver = async (driverId) => {
    try {
      await userService.approveDriver(driverId);
      toast.success('Driver approved successfully!');
      setPendingDrivers(prev => prev.filter(d => d._id !== driverId));
      loadData(); // Reload all users
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve driver');
    }
  };

  const openRejectDialog = (driverId) => {
    setConfirmDialog({
      open: true,
      action: 'reject',
      id: driverId,
      message: 'Are you sure you want to reject this driver application?'
    });
  };

  const handleRejectDriver = async () => {
    try {
      await userService.deleteUser(confirmDialog.id);
      toast.success('Driver application rejected');
      setPendingDrivers(prev => prev.filter(d => d._id !== confirmDialog.id));
      setUsers(prev => prev.filter(u => u._id !== confirmDialog.id));
      setConfirmDialog({ open: false, action: null, id: null, message: '' });
    } catch (error) {
      toast.error('Failed to reject application');
    }
  };

  const openAddDialog = () => {
    setDialogMode('add');
    setFormData({ role: 'student', status: 'active' });
    setOpenDialog(true);
  };

  const openEditDialog = (user) => {
    setDialogMode('edit');
    setSelectedUser(user);

    // Format data for form
    const data = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status
    };

    if (user.role === 'student') {
      data.studentId = user.studentId || '';
      data.feeStatus = user.feeStatus || 'pending';
      // Handle populated bus/route objects
      if (user.assignedBus) {
        data.assignedBusId = typeof user.assignedBus === 'object' ? user.assignedBus._id : user.assignedBus;
      }
      if (user.assignedRoute) {
        data.assignedRouteId = typeof user.assignedRoute === 'object' ? user.assignedRoute._id : user.assignedRoute;
      }
    } else if (user.role === 'driver') {
      data.licenseNumber = user.licenseNumber || '';
      data.salary = user.salary || '';
      // Find known bus
      const driverBus = buses.find(bus => {
        if (bus.driverId) {
          return typeof bus.driverId === 'object'
            ? bus.driverId._id === user._id
            : bus.driverId === user._id;
        }
        return false;
      });
      data.assignedBusId = driverBus ? driverBus._id : '';
    }

    setFormData(data);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({});
    setShowPassword(false);
  };

  const validateStudentId = (id) => {
    // Basic validation: must be alphanumeric
    return /^[a-zA-Z0-9]+$/.test(id);
  };

  const handleSubmit = async () => {
    try {
      // Basic validation
      if (!formData.name || !formData.email || !formData.role) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.role === 'student' && !formData.studentId) {
        toast.error('Student ID is required');
        return;
      }

      if (formData.role === 'driver' && !formData.licenseNumber) {
        toast.error('License Number is required');
        return;
      }

      if (formData.role === 'driver' && !formData.salary) {
        toast.error('Salary is required');
        return;
      }

      if (dialogMode === 'add' && formData.role === 'driver' && !formData.drivingLicense) {
        toast.error('Driving License Document is required');
        return;
      }

      let submissionData;
      let isFormData = false;

      if (dialogMode === 'add' && formData.role === 'driver') {
        isFormData = true;
        submissionData = new FormData();
        submissionData.append('name', formData.name);
        submissionData.append('email', formData.email);
        submissionData.append('password', formData.password);
        submissionData.append('role', formData.role);
        if (formData.phone) submissionData.append('phone', formData.phone);
        submissionData.append('licenseNumber', formData.licenseNumber);
        if (formData.assignedBusId) submissionData.append('assignedBusId', formData.assignedBusId);
        if (formData.drivingLicense) submissionData.append('drivingLicense', formData.drivingLicense);
        submissionData.append('salary', formData.salary);
      } else {
        submissionData = { ...formData };
        if (submissionData.role === 'student') {
          if (submissionData.assignedBusId) submissionData.assignedBus = submissionData.assignedBusId;
          if (submissionData.assignedRouteId) submissionData.assignedRoute = submissionData.assignedRouteId;
          delete submissionData.assignedBusId;
          delete submissionData.assignedRouteId;
        }
      }

      if (dialogMode === 'add') {
        // Need to use authService.register or adjust userService to handle multipart/form-data headers
        // Since userService.createUser uses axios, axios automatically sets Content-Type for FormData
        const newUser = await userService.createUser(submissionData);
        toast.success('User created successfully');

        // If driver and has bus assignment
        const assignedBusId = isFormData ? formData.assignedBusId : submissionData.assignedBusId;
        if (formData.role === 'driver' && assignedBusId) {
          await busService.updateBus(assignedBusId, { driverId: newUser.data.data.user._id || newUser.data.data._id });
        }
      } else {
        await userService.updateUser(selectedUser._id, submissionData);
        toast.success('User updated successfully');

        // Handle driver bus assignment changes
        if (formData.role === 'driver' && formData.assignedBusId !== undefined) {
          // Find old bus
          const oldAssignedBus = buses.find(bus => {
            if (bus.driverId) {
              return typeof bus.driverId === 'object'
                ? bus.driverId._id === selectedUser._id
                : bus.driverId === selectedUser._id;
            }
            return false;
          });

          // If changed
          if (oldAssignedBus && oldAssignedBus._id !== formData.assignedBusId) {
            await busService.updateBus(oldAssignedBus._id, { driverId: null });
          }
          if (formData.assignedBusId && (!oldAssignedBus || oldAssignedBus._id !== formData.assignedBusId)) {
            await busService.updateBus(formData.assignedBusId, { driverId: selectedUser._id });
          }
        }
      }

      closeDialog();
      loadData();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openDeleteDialog = (userId) => {
    setConfirmDialog({
      open: true,
      action: 'delete',
      id: userId,
      message: 'Are you sure you want to delete this user? This action cannot be undone.'
    });
  };

  const handleDeleteUser = async () => {
    try {
      await userService.deleteUser(confirmDialog.id);
      toast.success('User deleted successfully');
      setUsers(prev => prev.filter(u => u._id !== confirmDialog.id));
      setPendingDrivers(prev => prev.filter(d => d._id !== confirmDialog.id));
      setConfirmDialog({ open: false, action: null, id: null, message: '' });
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.action === 'reject') {
      handleRejectDriver();
    } else if (confirmDialog.action === 'delete') {
      handleDeleteUser();
    }
  };

  // Filtering Logic
  const filteredUsers = users.filter(user => {
    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = user.name?.toLowerCase().includes(term);
      const matchesEmail = user.email?.toLowerCase().includes(term);
      const matchesPhone = user.phone?.toLowerCase().includes(term);
      const matchesStudentId = user.studentId?.toLowerCase().includes(term);
      const matchesLicense = user.licenseNumber?.toLowerCase().includes(term);

      return matchesName || matchesEmail || matchesPhone || matchesStudentId || matchesLicense;
    }

    return true;
  });

  return (
    <Container maxWidth="xl" sx={{ p: 4 }}>
      <Grid container spacing={3}>
        {/* Pending Approvals */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Pending Driver Approvals</Typography>
              {pendingDrivers.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <People sx={{ fontSize: 64, color: 'grey.400' }} />
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
                      {pendingDrivers.map(driver => (
                        <TableRow key={driver._id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar
                                src={driver.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${driver.profilePicture}` : undefined}
                              >{driver.name?.charAt(0)}</Avatar>
                              <Typography>{driver.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{driver.email}</TableCell>
                          <TableCell>{driver.licenseNumber}</TableCell>
                          <TableCell>{driver.phone}</TableCell>
                          <TableCell>
                            {driver.drivingLicenseFile && (
                              <Button
                                startIcon={<PictureAsPdf />}
                                size="small"
                                sx={{ mr: 1, color: '#EF4444', textTransform: 'none', fontWeight: 600 }}
                                onClick={() => {
                                  setDetailUser(driver);
                                  setDetailDialogOpen(true);
                                }}
                              >
                                View License
                              </Button>
                            )}
                            <Button
                              startIcon={<CheckCircle />}
                              color="success"
                              onClick={() => handleApproveDriver(driver._id)}
                              size="small"
                            >
                              Approve
                            </Button>
                            <Button
                              startIcon={<Cancel />}
                              color="error"
                              onClick={() => openRejectDialog(driver._id)}
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              Reject
                            </Button>
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

        {/* All Users */}
        <Grid item xs={12}>
          {/* User List with Filters */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6">All Users</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openAddDialog}
                  sx={{
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Add New User
                </Button>
              </Box>

              {/* Filters Toolbar */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                              <Clear fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={roleFilter}
                        label="Role"
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <MenuItem value="all">All Roles</MenuItem>
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="driver">Driver</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="suspended">Suspended</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={() => {
                        setSearchTerm('');
                        setRoleFilter('all');
                        setStatusFilter('all');
                      }}
                      sx={{ height: 40, textTransform: 'none' }}
                    >
                      Reset
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <TableContainer sx={{ maxHeight: '65vh', overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 1, fontWeight: 700 }}>User</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 700 }}>Contact</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 700 }}>Details</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      [...Array(5)].map((_, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ py: 1 }}><Skeleton variant="rectangular" height={28} /></TableCell>
                          <TableCell sx={{ py: 1 }}><Skeleton variant="rectangular" height={20} width={50} /></TableCell>
                          <TableCell sx={{ py: 1 }}><Skeleton variant="rectangular" height={20} width={50} /></TableCell>
                          <TableCell sx={{ py: 1 }}><Skeleton variant="text" /></TableCell>
                          <TableCell sx={{ py: 1 }}><Skeleton variant="rectangular" height={24} width={70} /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 6, textAlign: 'center' }}>
                            <People sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                              No users found matching your filters
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map(user => {
                        // Find if this user (if driver) is assigned to a bus
                        let relatedInfo = '';
                        if (user.role === 'driver') {
                          const driverBus = buses.find(bus => {
                            if (bus.driverId) {
                              return typeof bus.driverId === 'object'
                                ? bus.driverId._id === user._id
                                : bus.driverId === user._id;
                            }
                            return false;
                          });
                          relatedInfo = driverBus ? `Bus: ${driverBus.busNumber}` : 'No bus assigned';
                          if (user.salary) {
                            relatedInfo += `, Salary: ${user.salary.toLocaleString()} PKR`;
                          }
                        } else if (user.role === 'student') {
                          if (user.assignedRoute) {
                            const routeName = typeof user.assignedRoute === 'object'
                              ? user.assignedRoute.routeName
                              : user.assignedRoute;
                            relatedInfo = `Route: ${routeName}`;

                            if (user.assignedBus) {
                              const busNumber = typeof user.assignedBus === 'object'
                                ? user.assignedBus.busNumber
                                : user.assignedBus;
                              relatedInfo += `, Bus: ${busNumber}`;
                            }
                          } else {
                            relatedInfo = 'No route/bus assigned';
                          }
                        }

                        return (
                          <TableRow key={user._id} hover sx={{ '& td': { py: 1 } }}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar
                                  src={user.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.profilePicture}` : undefined}
                                  sx={{ width: 32, height: 32, fontSize: 14 }}
                                >{user.name?.charAt(0)}</Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{user.name}</Typography>
                                  {user.role !== 'admin' && (
                                    <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1 }}>{user.studentId || user.licenseNumber || 'N/A'}</Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{user.email}</Typography>
                                <Typography variant="caption" sx={{ color: '#64748B' }}>{user.phone || 'No phone'}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={user.role} size="small" color={user.role === 'admin' ? 'secondary' : user.role === 'driver' ? 'info' : 'default'} sx={{ height: 22, fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {relatedInfo}
                              </Typography>
                            </TableCell>
                            <TableCell><Chip label={user.status} size="small" color={user.status === 'active' ? 'success' : 'default'} sx={{ height: 22, fontSize: '0.7rem' }} /></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0 }}>
                                <IconButton size="small" onClick={() => {
                                  setDetailUser(user);
                                  setDetailDialogOpen(true);
                                }} color="primary" title="View Details">
                                  <Visibility fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => openEditDialog(user)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                                {currentUser && currentUser._id !== user._id && (
                                  <IconButton size="small" onClick={() => openDeleteDialog(user._id)} color="error">
                                    <Delete fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add User' : 'Edit User'}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={2} mt={1}>
            <TextField
              label="Name"
              value={formData.name || ''}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />
            <TextField
              label="Email"
              value={formData.email || ''}
              onChange={(e) => handleFormChange('email', e.target.value)}
              required
              disabled={dialogMode === 'edit'}
            />
            <TextField
              label="Phone"
              value={formData.phone || ''}
              onChange={(e) => handleFormChange('phone', e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role || 'student'}
                label="Role"
                onChange={(e) => handleFormChange('role', e.target.value)}
                disabled={dialogMode === 'edit'}
              >
                <MenuItem value="admin">admin</MenuItem>
                <MenuItem value="driver">driver</MenuItem>
                <MenuItem value="student">student</MenuItem>
              </Select>
            </FormControl>

            {formData.role === 'student' && (
              <TextField
                label="Student ID"
                value={formData.studentId || ''}
                onChange={(e) => handleFormChange('studentId', e.target.value)}
                required={dialogMode === 'add'}
                disabled={dialogMode === 'edit'}
                helperText={dialogMode === 'edit' ? 'Student ID cannot be changed' : 'Format: FA/SP + 2 digits - BCS/BBA/BSE - 3 digits (e.g., FA23-BCS-123)'}
              />
            )}

            {formData.role === 'student' && dialogMode === 'edit' && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Assigned Route</InputLabel>
                  <Select
                    value={formData.assignedRouteId || ''}
                    label="Assigned Route"
                    onChange={(e) => handleFormChange('assignedRouteId', e.target.value)}
                  >
                    <MenuItem value="">No Route Assigned</MenuItem>
                    {routes.map(route => (
                      <MenuItem key={route._id} value={route._id}>
                        {route.routeName} ({route.routeNo})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {formData.assignedRouteId && (
                  <FormControl fullWidth>
                    <InputLabel>Assigned Bus</InputLabel>
                    <Select
                      value={formData.assignedBusId || ''}
                      label="Assigned Bus"
                      onChange={(e) => handleFormChange('assignedBusId', e.target.value)}
                    >
                      <MenuItem value="">No Bus Assigned</MenuItem>
                      {/* Filter buses to only show those on the selected route (if we had that data) or just all buses for now */}
                      {buses.map(bus => (
                        <MenuItem key={bus._id} value={bus._id}>
                          {bus.busNumber} ({bus.model})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}

            {formData.role === 'driver' && (
              <>
                <TextField
                  label="License Number"
                  value={formData.licenseNumber || ''}
                  onChange={(e) => handleFormChange('licenseNumber', e.target.value)}
                  disabled={dialogMode === 'edit'}
                  helperText={dialogMode === 'edit' ? 'License Number cannot be changed' : ''}
                />
                <TextField
                  label="Salary (PKR)"
                  type="number"
                  value={formData.salary || ''}
                  onChange={(e) => handleFormChange('salary', e.target.value)}
                  required
                />
                {dialogMode === 'add' && (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PictureAsPdf />}
                    sx={{ mt: 1, mb: 1, textTransform: 'none', justifyContent: 'flex-start' }}
                  >
                    {formData.drivingLicense ? formData.drivingLicense.name : "Upload Driving License (PDF)"}
                    <input
                      type="file"
                      hidden
                      accept=".pdf"
                      onChange={(e) => handleFormChange('drivingLicense', e.target.files[0])}
                    />
                  </Button>
                )}
              </>
            )}

            {formData.role === 'driver' && dialogMode === 'edit' && (
              <FormControl fullWidth>
                <InputLabel>Assigned Bus</InputLabel>
                <Select
                  value={formData.assignedBusId || ''}
                  label="Assigned Bus"
                  onChange={(e) => handleFormChange('assignedBusId', e.target.value)}
                >
                  <MenuItem value="">No Bus Assigned</MenuItem>
                  {buses.filter(bus => !bus.driverId ||
                    (typeof bus.driverId === 'object' ? bus.driverId._id : bus.driverId) === selectedUser?._id
                  ).map(bus => (
                    <MenuItem key={bus._id} value={bus._id}>
                      {bus.busNumber} ({bus.model})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label={dialogMode === 'add' ? "Password" : "New Password (leave blank to keep current)"}
              type={showPassword ? "text" : "password"}
              value={formData.password || ''}
              onChange={(e) => handleFormChange('password', e.target.value)}
              required={dialogMode === 'add'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.action === 'delete' ? 'Delete User' : 'Reject Driver'}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === 'delete' ? 'Delete' : 'Reject'}
        cancelText="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ open: false, action: null, id: null, message: '' })}
        variant="danger"
      />

      {/* User Detail Dialog */}
      <UserDetailDialog
        open={detailDialogOpen}
        onClose={() => { setDetailDialogOpen(false); setDetailUser(null); }}
        user={detailUser}
        buses={buses}
      />
    </Container>
  );
};

export default UsersView;