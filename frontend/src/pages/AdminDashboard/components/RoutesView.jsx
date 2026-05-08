import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Divider, Snackbar, Alert as MuiAlert
} from '@mui/material';
import {
  Route as RouteIcon, Add, Edit, Delete, LocationOn, AccessTime
} from '@mui/icons-material';
import { routeService, busService } from '../../../services';

const RoutesView = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState(''); // 'add' or 'edit'
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [formData, setFormData] = useState({});
  const [stops, setStops] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesResponse, busesResponse] = await Promise.all([
        routeService.getRoutes({ limit: 100 }),
        busService.getBuses({ limit: 100 })
      ]);
      
      const routesData = (routesResponse.data && routesResponse.data.data) || [];
      const busesData = (busesResponse.data && busesResponse.data.data) || [];
      
      // Add related buses information to routes
      const routesWithBusCount = routesData.map(route => {
        const relatedBuses = busesData.filter(bus => {
          if (bus.routeId) {
            return typeof bus.routeId === 'object' 
              ? bus.routeId._id === route._id 
              : bus.routeId === route._id;
          }
          return false;
        });
        
        return {
          ...route,
          relatedBusesCount: relatedBuses.length,
          relatedBuses: relatedBuses
        };
      });
      
      setRoutes(routesWithBusCount);
    } catch (error) {
      console.error('Error loading routes:', error);
      showSnack('Error loading routes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const openAddDialog = () => {
    setDialogMode('add');
    setFormData({ isActive: true, distance: 1, estimatedDuration: 15 });
    setSelectedRoute(null);
    setStops([]);
    setOpenDialog(true);
  };

  const openEditDialog = (route) => {
    setDialogMode('edit');
    setSelectedRoute(route);
    setFormData(route);
    
    // Set stops for editing
    const routeStops = route.stops || [];
    const resequencedStops = routeStops.map((stop, idx) => ({ ...stop, sequence: idx + 1 }));
    setStops(resequencedStops);
    
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setDialogMode('');
    setSelectedRoute(null);
    setFormData({});
    setStops([]);
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.routeNo || !formData.routeName || !formData.departureTime) {
        throw new Error('Route number, name, and departure time are required');
      }
      
      if (typeof formData.distance !== 'number' || formData.distance < 0.1) {
        throw new Error('Distance must be at least 0.1 km');
      }
      
      if (typeof formData.estimatedDuration !== 'number' || formData.estimatedDuration < 5) {
        throw new Error('Estimated duration must be at least 5 minutes');
      }
      
      // Prepare route data with stops
      const validStops = stops.filter(s => s.name && s.pickupTime);
      const resequencedStops = validStops.map((stop, idx) => ({ ...stop, sequence: idx + 1 }));
      const routeData = { ...formData, stops: resequencedStops };
      
      if (dialogMode === 'add') {
        await routeService.createRoute(routeData);
        showSnack('Route created');
      } else if (dialogMode === 'edit') {
        await routeService.updateRoute(selectedRoute._id, routeData);
        showSnack('Route updated');
      }
      
      closeDialog();
      loadData(); // Reload data
    } catch (error) {
      console.error('Error saving route:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Operation failed';
      showSnack(errorMessage, 'error');
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openDeleteDialog = (routeId) => {
    setConfirmDialog({ open: true, id: routeId });
  };

  const handleDeleteRoute = async () => {
    if (confirmDialog.id) {
      try {
        await routeService.deleteRoute(confirmDialog.id);
        showSnack('Route deleted');
        setConfirmDialog({ open: false, id: null });
        loadData(); // Reload data
      } catch (error) {
        console.error('Error deleting route:', error);
        showSnack('Failed to delete route', 'error');
        setConfirmDialog({ open: false, id: null });
      }
    }
  };

  // Handle stops management
  const handleStopChange = (index, field, value) => {
    const newStops = [...stops];
    newStops[index][field] = value;
    setStops(newStops);
  };

  const addStop = () => {
    const newStop = { 
      name: '', 
      address: '', 
      sequence: stops.length + 1, 
      pickupTime: '', 
      fee: 0 
    };
    setStops([...stops, newStop]);
  };

  const removeStop = (index) => {
    const updatedStops = stops.filter((_, i) => i !== index);
    // Re-sequence the stops
    const resequencedStops = updatedStops.map((stop, newIdx) => ({
      ...stop,
      sequence: newIdx + 1
    }));
    setStops(resequencedStops);
  };

  return (
    <Container maxWidth="xl" sx={{ p: 4 }}>
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Routes ({routes.length})</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
                Add Route
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Route No</TableCell>
                    <TableCell>Route Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Stops</TableCell>
                    <TableCell>Buses</TableCell>
                    <TableCell>Distance (km)</TableCell>
                    <TableCell>Duration (min)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {routes.map(route => (
                    <TableRow key={route._id}>
                      <TableCell sx={{ fontWeight: 600 }}>{route.routeNo || 'N/A'}</TableCell>
                      <TableCell>{route.routeName}</TableCell>
                      <TableCell>{route.description || '---'}</TableCell>
                      <TableCell>{(route.stops && route.stops.length) || 0}</TableCell>
                      <TableCell>{route.relatedBusesCount || 0}</TableCell>
                      <TableCell>{route.distance || 0}</TableCell>
                      <TableCell>{route.estimatedDuration || 0}</TableCell>
                      <TableCell><Chip label={route.isActive ? 'Active' : 'Inactive'} size="small" /></TableCell>
                      <TableCell>
                        <IconButton onClick={() => openEditDialog(route)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => openDeleteDialog(route._id)} color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Add/Edit Route Dialog */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add Route' : 'Edit Route'}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={2} mt={1}>
            <TextField 
              label="Route Number" 
              value={formData.routeNo || ''} 
              onChange={(e) => handleFormChange('routeNo', e.target.value)} 
              helperText="e.g., R001, R002"
            />
            <TextField 
              label="Route Name" 
              value={formData.routeName || ''} 
              onChange={(e) => handleFormChange('routeName', e.target.value)} 
              required
            />
            <TextField 
              label="Description" 
              value={formData.description || ''} 
              multiline 
              rows={2} 
              onChange={(e) => handleFormChange('description', e.target.value)} 
            />
            <TextField 
              label="Departure Time" 
              type="time" 
              value={formData.departureTime || ''} 
              onChange={(e) => handleFormChange('departureTime', e.target.value)} 
              InputLabelProps={{ shrink: true }}
              helperText="When bus leaves university"
            />
            <TextField 
              label="Distance (km)" 
              type="number" 
              value={formData.distance || ''} 
              onChange={(e) => handleFormChange('distance', Number(e.target.value))} 
            />
            <TextField 
              label="Estimated Duration (minutes)" 
              type="number" 
              value={formData.estimatedDuration || ''} 
              onChange={(e) => handleFormChange('estimatedDuration', Number(e.target.value))} 
            />
            <FormControl fullWidth>
              <InputLabel>Active</InputLabel>
              <Select 
                value={formData.isActive === undefined ? true : formData.isActive} 
                label="Active" 
                onChange={(e) => handleFormChange('isActive', e.target.value)}
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>

            {/* Stops Management */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Stops</Typography>
            
            {/* Current Stop Form */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField 
                    label="Stop Name" 
                    size="small"
                    fullWidth
                    value={(stops[stops.length - 1]?.name || '')}
                    onChange={(e) => {
                      if (stops.length === 0) {
                        // If no stops exist, create the first one
                        const newStop = { 
                          name: e.target.value, 
                          address: '', 
                          sequence: 1, 
                          pickupTime: '', 
                          fee: 0 
                        };
                        setStops([newStop]);
                      } else {
                        // Update the last stop
                        const newStops = [...stops];
                        const lastIdx = newStops.length - 1;
                        newStops[lastIdx].name = e.target.value;
                        setStops(newStops);
                      }
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
                      if (stops.length === 0) {
                        // If no stops exist, create the first one
                        const newStop = { 
                          name: '', 
                          address: '', 
                          sequence: 1, 
                          pickupTime: e.target.value, 
                          fee: 0 
                        };
                        setStops([newStop]);
                      } else {
                        // Update the last stop
                        const newStops = [...stops];
                        const lastIdx = newStops.length - 1;
                        newStops[lastIdx].pickupTime = e.target.value;
                        setStops(newStops);
                      }
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
                      if (stops.length === 0) {
                        // If no stops exist, create the first one
                        const newStop = { 
                          name: '', 
                          address: '', 
                          sequence: 1, 
                          pickupTime: '', 
                          fee: Number(e.target.value) 
                        };
                        setStops([newStop]);
                      } else {
                        // Update the last stop
                        const newStops = [...stops];
                        const lastIdx = newStops.length - 1;
                        newStops[lastIdx].fee = Number(e.target.value);
                        setStops(newStops);
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={addStop}
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
                            onClick={() => removeStop(idx)}
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

            {stops.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No stops added yet. Add stops where the bus will pick up students.
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to delete this route? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, id: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteRoute}>Delete</Button>
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

export default RoutesView;