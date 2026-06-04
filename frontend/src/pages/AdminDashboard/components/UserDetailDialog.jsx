import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
    Chip, Divider, Avatar, IconButton, CircularProgress, Alert
} from '@mui/material';
import {
    Close, Person, Email, Phone, Badge, DirectionsBus, Route as RouteIcon,
    Payment, PictureAsPdf, Download, OpenInNew, CalendarToday
} from '@mui/icons-material';
import { userService } from '../../../services';

const InfoRow = ({ icon, label, value, chip, chipColor }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
        <Box sx={{
            width: 36, height: 36, borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(20,184,166,0.1))'
        }}>
            {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>{label}</Typography>
            {chip ? (
                <Chip label={value} size="small" color={chipColor || 'default'} sx={{ mt: 0.5, display: 'block', width: 'fit-content' }} />
            ) : (
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>{value || 'N/A'}</Typography>
            )}
        </Box>
    </Box>
);

const UserDetailDialog = ({ open, onClose, user, buses = [] }) => {
    const [licenseLoading, setLicenseLoading] = useState(false);
    const [licenseError, setLicenseError] = useState('');

    if (!user) return null;

    const isStudent = user.role === 'student';
    const isDriver = user.role === 'driver';

    // Get assigned bus info for student
    const getStudentBus = () => {
        if (user.assignedBus) {
            if (typeof user.assignedBus === 'object') {
                return user.assignedBus.busNumber || 'Assigned';
            }
            return 'Assigned';
        }
        return 'Not assigned';
    };

    // Get assigned route info for student
    const getStudentRoute = () => {
        if (user.assignedRoute) {
            if (typeof user.assignedRoute === 'object') {
                return `${user.assignedRoute.routeName || ''} (${user.assignedRoute.routeNo || ''})`.trim();
            }
            return 'Assigned';
        }
        return 'Not assigned';
    };

    // Get fee status display
    const getFeeStatus = () => {
        const statusMap = {
            'paid': { label: 'Paid', color: 'success' },
            'partially_paid': { label: 'Partially Paid', color: 'warning' },
            'pending': { label: 'Pending', color: 'error' }
        };
        return statusMap[user.feeStatus] || { label: user.feeStatus || 'N/A', color: 'default' };
    };

    // Get driver bus assignment
    const getDriverBus = () => {
        const driverBus = buses.find(bus => {
            if (bus.driverId) {
                return typeof bus.driverId === 'object'
                    ? bus.driverId._id === user._id
                    : bus.driverId === user._id;
            }
            return false;
        });
        return driverBus ? `${driverBus.busNumber} (${driverBus.model || ''})` : 'No bus assigned';
    };

    const handleViewLicense = async () => {
        setLicenseLoading(true);
        setLicenseError('');
        try {
            const response = await userService.getDriverLicense(user._id);
            // Create a blob URL and open it
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error loading license:', error);
            setLicenseError(error.response?.data?.message || 'Failed to load driving license');
        } finally {
            setLicenseLoading(false);
        }
    };

    const feeInfo = getFeeStatus();
    const roleColor = user.role === 'admin' ? 'error' : user.role === 'driver' ? 'info' : 'success';
    const statusColor = user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'error';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{
            sx: { borderRadius: '16px', overflow: 'hidden' }
        }}>
            {/* Header with gradient */}
            <Box sx={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
                p: 3, color: 'white', position: 'relative'
            }}>
                <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}>
                    <Close />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        src={user.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.profilePicture}` : undefined}
                        sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 24, fontWeight: 700 }}
                    >
                        {user.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.name}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip label={user.role} size="small" sx={{
                                bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem'
                            }} />
                            <Chip label={user.status} size="small" sx={{
                                bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, fontSize: '0.7rem'
                            }} />
                        </Box>
                    </Box>
                </Box>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {/* Basic Info */}
                <Typography variant="subtitle2" sx={{ color: '#0EA5E9', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Basic Information
                </Typography>
                <InfoRow icon={<Person sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Full Name" value={user.name} />
                <InfoRow icon={<Email sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Email" value={user.email} />
                <InfoRow icon={<Phone sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Phone" value={user.phone} />
                <InfoRow icon={<CalendarToday sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Joined"
                    value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                />

                {/* Student-specific info */}
                {isStudent && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ color: '#0EA5E9', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Academic & Transport
                        </Typography>
                        <InfoRow icon={<Badge sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Student ID" value={user.studentId} />
                        <InfoRow icon={<DirectionsBus sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Assigned Bus" value={getStudentBus()} />
                        <InfoRow icon={<RouteIcon sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Assigned Route" value={getStudentRoute()} />

                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ color: '#0EA5E9', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Fee Information
                        </Typography>
                        <InfoRow icon={<Payment sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Fee Status" value={feeInfo.label} chip chipColor={feeInfo.color} />
                        {user.feePaymentType && (
                            <InfoRow icon={<Payment sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Payment Type" value={user.feePaymentType} />
                        )}
                        {user.feeNotes && (
                            <Box sx={{ mt: 1.5, p: 2, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', display: 'block', mb: 0.5 }}>
                                    Fee Notes / History
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#334155', fontSize: '0.8rem' }}>
                                    {user.feeNotes}
                                </Typography>
                            </Box>
                        )}
                    </>
                )}

                {/* Driver-specific info */}
                {isDriver && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ color: '#0EA5E9', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Driver Details
                        </Typography>
                        <InfoRow icon={<Badge sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="License Number" value={user.licenseNumber} />
                        <InfoRow icon={<DirectionsBus sx={{ fontSize: 18, color: '#0EA5E9' }} />} label="Assigned Bus" value={getDriverBus()} />
                        <InfoRow 
                            icon={<Payment sx={{ fontSize: 18, color: '#0EA5E9' }} />} 
                            label="Salary (PKR)" 
                            value={user.salary ? `${user.salary.toLocaleString()} PKR` : 'N/A'} 
                        />

                        {/* Driving License PDF */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', display: 'block', mb: 1 }}>
                                Driving License Document
                            </Typography>
                            {user.drivingLicenseFile ? (
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 2, p: 2,
                                    bgcolor: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA'
                                }}>
                                    <PictureAsPdf sx={{ fontSize: 36, color: '#EF4444' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                            {user.drivingLicenseFile}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                                            PDF Document
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={licenseLoading ? <CircularProgress size={16} color="inherit" /> : <OpenInNew />}
                                        onClick={handleViewLicense}
                                        disabled={licenseLoading}
                                        sx={{
                                            background: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
                                            borderRadius: '8px',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            '&:hover': { background: 'linear-gradient(135deg, #0284C7 0%, #0F766E 100%)' }
                                        }}
                                    >
                                        View
                                    </Button>
                                </Box>
                            ) : (
                                <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                                    No driving license file uploaded
                                </Alert>
                            )}
                            {licenseError && (
                                <Alert severity="error" sx={{ mt: 1, borderRadius: '10px' }}>
                                    {licenseError}
                                </Alert>
                            )}
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserDetailDialog;
