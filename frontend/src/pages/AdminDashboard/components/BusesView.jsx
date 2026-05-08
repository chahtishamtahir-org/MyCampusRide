import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Skeleton, Chip
} from '@mui/material';
import {
  DirectionsBus, Add, Edit, Delete, Visibility
} from '@mui/icons-material';
import BusProfileDialog from './BusProfileDialog';
import { busService, userService, routeService } from '../../../services';
import { toast } from '../../../utils/toast';
import ConfirmDialog from '../../../components/ConfirmDialog';

const BusesView = () => {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProfileBus, setSelectedProfileBus] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [busesResponse, usersResponse, routesResponse] = await Promise.all([
        busService.getBuses({ limit: 100 }),
        userService.getUsers({ limit: 100 }),
        routeService.getRoutes({ limit: 100 })
      ]);

      setBuses((busesResponse.data && busesResponse.data.data) || []);

      const driversList = (usersResponse.data && usersResponse.data.data) || [];
      setDrivers(driversList.filter(user => user.role === 'driver'));

      setRoutes((routesResponse.data && routesResponse.data.data) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setDialogMode('add');
    setFormData({ capacity: 30, status: 'available' });
    setSelectedBus(null);
    setOpenDialog(true);
  };

  const openEditDialog = (bus) => {
    setDialogMode('edit');
    setSelectedBus(bus);

    const busData = { ...bus };

    if (bus.driverId) {
      busData.driverId = typeof bus.driverId === 'object' ? bus.driverId._id : bus.driverId;
    } else {
      busData.driverId = '';
    }

    if (bus.routeId) {
      busData.routeId = typeof bus.routeId === 'object' ? bus.routeId._id : bus.routeId;
    } else {
      busData.routeId = '';
    }

    setFormData(busData);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setDialogMode('');
    setSelectedBus(null);
    setFormData({});
  };

  const handleSubmit = async () => {
    try {
      const submissionData = { ...formData };
      
      // Ensure unassigned values are sent as null
      if (submissionData.driverId === '') submissionData.driverId = null;
      if (submissionData.routeId === '') submissionData.routeId = null;

      if (dialogMode === 'add') {
        await busService.createBus(submissionData);
        toast.success('Bus created successfully!');
      } else if (dialogMode === 'edit') {
        if (!submissionData.status) {
          submissionData.status = 'inactive';
        }

        await busService.updateBus(selectedBus._id, submissionData);
        toast.success('Bus updated successfully!');
      }

      closeDialog();
      loadData();
    } catch (error) {
      console.error('Error saving bus:', error);
      const errorMessage = error.response?.data?.message || 'Operation failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openDeleteDialog = (busId) => {
    setConfirmDialog({ open: true, id: busId });
  };

  const openProfileDialog = (bus) => {
    setSelectedProfileBus(bus);
    setProfileOpen(true);
  };

  const handleDeleteBus = async () => {
    try {
      await busService.deleteBus(confirmDialog.id);
      toast.success('Bus deleted successfully!');
      setConfirmDialog({ open: false, id: null });
      loadData();
    } catch (error) {
      console.error('Error deleting bus:', error);
      toast.error('Failed to delete bus. Please try again.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ p: 4 }}>
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Buses ({buses.length})</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
                Add Bus
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bus Number</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Year</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton variant="rectangular" height={40} /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="text" /></TableCell>
                        <TableCell><Skeleton variant="rectangular" height={20} width={60} /></TableCell>
                        <TableCell><Skeleton variant="rectangular" height={30} width={80} /></TableCell>
                      </TableRow>
                    ))
                  ) : buses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                          <DirectionsBus sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No buses found
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Add your first bus to get started with campus transportation management
                          </Typography>
                          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
                            Add Bus
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    buses.map(bus => {
                      let driverName = 'No driver';
                      if (bus.driverId) {
                        if (typeof bus.driverId === 'object') {
                          driverName = bus.driverId.name;
                        } else {
                          const driver = drivers.find(d => d._id === bus.driverId);
                          driverName = driver ? driver.name : 'Unknown Driver';
                        }
                      }

                      let routeName = 'No route';
                      if (bus.routeId) {
                        if (typeof bus.routeId === 'object') {
                          routeName = bus.routeId.routeName;
                        } else {
                          const route = routes.find(r => r._id === bus.routeId);
                          routeName = route ? route.routeName : 'Unknown Route';
                        }
                      }

                      return (
                        <TableRow key={bus._id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <DirectionsBus color="primary" />
                              <Typography sx={{ fontWeight: 600 }}>{bus.busNumber}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{driverName}</TableCell>
                          <TableCell>{routeName}</TableCell>
                          <TableCell>{bus.model || 'N/A'}</TableCell>
                          <TableCell>{bus.year || 'N/A'}</TableCell>
                          <TableCell>{bus.capacity || 'N/A'}</TableCell>
                          <TableCell><Chip label={bus.status || 'inactive'} size="small" /></TableCell>
                          <TableCell>
                            <IconButton onClick={() => openProfileDialog(bus)} color="primary">
                              <Visibility />
                            </IconButton>
                            <IconButton onClick={() => openEditDialog(bus)}>
                              <Edit />
                            </IconButton>
                            <IconButton onClick={() => openDeleteDialog(bus._id)} color="error">
                              <Delete />
                            </IconButton>
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

      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add Bus' : 'Edit Bus'}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={2} mt={1}>
            <TextField
              label="Bus Number"
              value={formData.busNumber || ''}
              onChange={(e) => handleFormChange('busNumber', e.target.value)}
              required
              helperText="Enter the bus number or identifier"
            />
            <TextField
              label="Model"
              value={formData.model || ''}
              onChange={(e) => handleFormChange('model', e.target.value)}
              required
              helperText="Bus model (e.g., Mercedes-Benz, Toyota)"
            />
            <TextField
              label="Year"
              type="number"
              value={formData.year || ''}
              onChange={(e) => handleFormChange('year', Number(e.target.value))}
              required
              helperText="Manufacturing year"
            />
            <TextField
              label="Capacity"
              type="number"
              value={formData.capacity || ''}
              onChange={(e) => handleFormChange('capacity', Number(e.target.value))}
              required
              helperText="Maximum passenger capacity"
            />
            <FormControl fullWidth>
              <InputLabel>Driver</InputLabel>
              <Select
                value={formData.driverId || ''}
                label="Driver"
                onChange={(e) => handleFormChange('driverId', e.target.value)}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {drivers.map(driver => (
                  <MenuItem key={driver._id} value={driver._id}>
                    {driver.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Route</InputLabel>
              <Select
                value={formData.routeId || ''}
                label="Route"
                onChange={(e) => handleFormChange('routeId', e.target.value)}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {routes.map(route => (
                  <MenuItem key={route._id} value={route._id}>
                    {route.routeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status || 'available'}
                label="Status"
                onChange={(e) => handleFormChange('status', e.target.value)}
              >
                <MenuItem value="available">Available (Active)</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="out_of_service">Out of Service</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Bus"
        message="Are you sure you want to delete this bus? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteBus}
        onCancel={() => setConfirmDialog({ open: false, id: null })}
        variant="danger"
      />

      <BusProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        bus={selectedProfileBus}
      />
    </Container>
  );
};

export default BusesView;
