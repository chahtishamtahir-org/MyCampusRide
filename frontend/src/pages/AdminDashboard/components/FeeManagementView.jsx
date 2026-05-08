import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Avatar,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert as MuiAlert
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { Payment, Edit } from '@mui/icons-material';
import { userService } from '../../../services';

const FeeManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openFeeStatusDialog, setOpenFeeStatusDialog] = useState(false);
  const [feeStatus, setFeeStatus] = useState('pending');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({ limit: 100 });
      setUsers((response.data && response.data.data) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showSnack('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const formatFeeStatus = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'partially_paid': return 'Partially Paid';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const openDialog = (student) => {
    setSelectedStudent(student);
    setFeeStatus(student.feeStatus || 'pending');
    setOpenFeeStatusDialog(true);
  };

  const closeDialog = () => {
    setOpenFeeStatusDialog(false);
    setSelectedStudent(null);
    setFeeStatus('pending');
  };

  const handleSubmit = async () => {
    try {
      await userService.updateUser(selectedStudent._id, { feeStatus });
      showSnack('Fee status updated successfully');
      closeDialog();
      loadData();
    } catch (error) {
      console.error('Error updating fee status:', error);
      showSnack('Failed to update fee status', 'error');
    }
  };

  const filteredStudents = users
    .filter(u => u.role === 'student')
    .filter(u => !feeSearchQuery || u.studentId?.toLowerCase().includes(feeSearchQuery.toLowerCase()));

  return (
    <Container maxWidth="xl" sx={{ p: 3 }}>
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Fee Management</Typography>
              <Box
                component="input"
                placeholder="Search by Student ID"
                value={feeSearchQuery}
                onChange={(e) => setFeeSearchQuery(e.target.value)}
                sx={{
                  px: 2, py: 1, borderRadius: 2,
                  border: '1px solid #ddd', outline: 'none',
                  fontSize: '0.875rem', minWidth: 250,
                  '&:focus': { borderColor: '#0ea5e9' }
                }}
              />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Fee Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student._id}>
                      <TableCell sx={{ py: 1 }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#e0e0e0', fontSize: '0.875rem' }}>
                            {student.name?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{student.studentId || 'N/A'}</Typography>
                      </TableCell>
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
                      <TableCell align="right">
                        <Tooltip title="Update Fee Status">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openDialog(student)}
                            sx={{ bgcolor: 'rgba(14, 165, 233, 0.1)', '&:hover': { bgcolor: 'rgba(14, 165, 233, 0.2)' } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredStudents.length === 0 && (
              <Box textAlign="center" py={6}>
                <Payment sx={{ fontSize: 64, color: 'grey.400' }} />
                <Typography color="text.secondary">No students found</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Fee Status Dialog — simple, fee-only */}
      <Dialog open={openFeeStatusDialog} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          Update Fee Status — {selectedStudent?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Fee Status</InputLabel>
              <Select
                value={feeStatus}
                label="Fee Status"
                onChange={(e) => setFeeStatus(e.target.value)}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="partially_paid">Partially Paid</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Update</Button>
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

export default FeeManagementView;