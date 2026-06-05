import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, Typography, Box, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Avatar,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert as MuiAlert
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { Payment, Edit, FilterList, PersonOff, CheckCircleOutline, ErrorOutline, Warning } from '@mui/icons-material';
import { userService } from '../../../services';
import { BRAND_COLORS, BUTTON_STYLES, BORDER_RADIUS } from '../../../styles/brandStyles';
import ConfirmDialog from '../../../components/ConfirmDialog';

const FeeManagementView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openFeeStatusDialog, setOpenFeeStatusDialog] = useState(false);
  const [feeStatus, setFeeStatus] = useState('pending');
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [isDisplacing, setIsDisplacing] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [openMarkDefaultersConfirm, setOpenMarkDefaultersConfirm] = useState(false);
  const [defaultersToMarkCount, setDefaultersToMarkCount] = useState(0);

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
      case 'defaulter': return 'Defaulter';
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


  const handleMarkDefaulters = async () => {
    const studentsToMark = filteredStudents.filter(s => s.feeStatus === 'partially_paid');
    if (studentsToMark.length === 0) {
      showSnack('No partially paid students found to mark as defaulters', 'info');
      return;
    }

    setDefaultersToMarkCount(studentsToMark.length);
    setOpenMarkDefaultersConfirm(true);
  };

  const confirmMarkDefaulters = async () => {
    try {
      setOpenMarkDefaultersConfirm(false);
      setIsDisplacing(true);
      await userService.markFeeDefaulters();
      showSnack(`Successfully updated students and unassigned them from buses`);
      loadData();
    } catch (error) {
      console.error('Error marking defaulters:', error);
      showSnack('Error marking defaulters. Please try again.', 'error');
    } finally {
      setIsDisplacing(false);
    }
  };

  const filteredStudents = users
    .filter(u => u.role === 'student')
    .filter(u => !unpaidOnly || u.feeStatus !== 'paid')
    .filter(u => !feeSearchQuery || u.studentId?.toLowerCase().includes(feeSearchQuery.toLowerCase()));

  return (
    <Container maxWidth="xl" sx={{ p: 3 }}>
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND_COLORS.slate900 }}>
                  Fee Management
                </Typography>
                <Button
                  size="small"
                  variant={unpaidOnly ? "contained" : "outlined"}
                  startIcon={<FilterList />}
                  onClick={() => setUnpaidOnly(!unpaidOnly)}
                  sx={{
                    borderRadius: BORDER_RADIUS.md,
                    textTransform: 'none',
                    fontWeight: 600,
                    ...(unpaidOnly ? {
                      bgcolor: BRAND_COLORS.errorRed,
                      '&:hover': { bgcolor: '#dc2626' }
                    } : {
                      color: BRAND_COLORS.slate700,
                      borderColor: BRAND_COLORS.slate300
                    })
                  }}
                >
                  {unpaidOnly ? "Showing Unpaid Only" : "Filter Unpaid"}
                </Button>
                {unpaidOnly && filteredStudents.some(s => s.feeStatus === 'partially_paid') && (
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<PersonOff />}
                    onClick={handleMarkDefaulters}
                    disabled={isDisplacing}
                    sx={{ borderRadius: BORDER_RADIUS.md, textTransform: 'none', fontWeight: 600 }}
                  >
                    Mark Defaulters
                  </Button>
                )}
              </Box>
              <Box
                component="input"
                placeholder="Search by Student ID..."
                value={feeSearchQuery}
                onChange={(e) => setFeeSearchQuery(e.target.value)}
                sx={{
                  px: 2, py: 1, borderRadius: BORDER_RADIUS.md,
                  border: `1px solid ${BRAND_COLORS.slate300}`,
                  outline: 'none',
                  fontSize: '0.875rem',
                  minWidth: 280,
                  transition: 'all 0.3s ease',
                  '&:focus': {
                    borderColor: BRAND_COLORS.skyBlue,
                    boxShadow: `0 0 0 2px rgba(14, 165, 233, 0.1)`
                  }
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
                              student.feeStatus === 'partially_paid' ? 'warning' :
                                student.feeStatus === 'defaulter' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                          <Tooltip title="Update Fee Status">
                            <IconButton
                              size="small"
                              onClick={() => openDialog(student)}
                              sx={{
                                color: BRAND_COLORS.skyBlue,
                                bgcolor: 'rgba(14, 165, 233, 0.08)',
                                '&:hover': { bgcolor: 'rgba(14, 165, 233, 0.15)' }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>

                        </Box>
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
                <MenuItem value="pending">
                  <Box display="flex" alignItems="center" gap={1}>
                    <ErrorOutline fontSize="small" color="error" /> Pending
                  </Box>
                </MenuItem>
                <MenuItem value="partially_paid">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Warning fontSize="small" sx={{ color: '#f59e0b' }} /> Partially Paid
                  </Box>
                </MenuItem>
                <MenuItem value="paid">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleOutline fontSize="small" color="success" /> Paid
                  </Box>
                </MenuItem>
                <MenuItem value="defaulter">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonOff fontSize="small" color="error" /> Defaulter
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {selectedStudent?.feeNotes && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#334155' }}>
                  Payment History / Audit Log:
                </Typography>
                <Typography variant="caption" sx={{
                  display: 'block',
                  whiteSpace: 'pre-wrap',
                  color: '#475569',
                  bgcolor: '#F8FAFC',
                  p: 1.5,
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  maxHeight: 150,
                  overflowY: 'auto',
                  fontFamily: 'inherit'
                }}>
                  {selectedStudent.feeNotes}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} sx={BUTTON_STYLES.primary}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Mark Defaulters Confirmation */}
      <ConfirmDialog
        open={openMarkDefaultersConfirm}
        title="Mark Fee Defaulters"
        message={`Are you sure you want to mark all ${defaultersToMarkCount} partially paid students as defaulters? They will be unassigned from their buses and their transport cards will be disabled.`}
        confirmText="Mark as Defaulter"
        variant="danger"
        onConfirm={confirmMarkDefaulters}
        onCancel={() => setOpenMarkDefaultersConfirm(false)}
        loading={isDisplacing}
      />

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