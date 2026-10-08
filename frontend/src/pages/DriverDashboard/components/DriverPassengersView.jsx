/**
 * DriverPassengersView Component
 *
 * Displays all students assigned to the driver's bus.
 * Shows avatar, name, student ID, phone, stop name, and fee status.
 * Leverages existing userService.getUsers({ assignedBus }) API.
 */

import React, { useState, useEffect } from 'react';
import {
    Container, Card, CardContent, Typography, Box, Avatar, Chip, Grid,
    CircularProgress, Alert, TextField, InputAdornment, Divider
} from '@mui/material';
import { People, Search, Phone, LocationOn, School, Person } from '@mui/icons-material';
import { userService, busService } from '../../../services';
import {
    BRAND_COLORS,
    CARD_STYLES,
    BORDER_RADIUS,
    SHADOWS,
    TYPOGRAPHY,
    INPUT_STYLES,
    gradientIconBox,
} from '../../../styles/brandStyles';
import { getAssetUrl } from '../../../utils/imageUrl';

const DriverPassengersView = () => {
    const [passengers, setPassengers] = useState([]);
    const [busInfo, setBusInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        loadPassengers();
    }, []);

    const loadPassengers = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get driver's bus
            const busResponse = await busService.getDriverBuses();
            const buses = busResponse.data?.data || busResponse.data || [];

            if (!buses || buses.length === 0) {
                setBusInfo(null);
                setPassengers([]);
                setLoading(false);
                return;
            }

            const driverBus = buses[0];
            setBusInfo(driverBus);

            // Get students assigned to this bus
            const usersResponse = await userService.getUsers({
                assignedBus: driverBus._id,
                role: 'student',
                limit: 100,
            });

            const students = usersResponse.data?.data || usersResponse.data || [];
            setPassengers(students);
        } catch (err) {
            console.error('Error loading passengers:', err);
            setError('Failed to load passenger information');
        } finally {
            setLoading(false);
        }
    };

    const filteredPassengers = passengers.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.stopName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFeeChip = (status) => {
        const config = {
            paid: { label: 'Paid', color: BRAND_COLORS.successGreen },
            partially_paid: { label: 'Partial', color: BRAND_COLORS.warningOrange },
            pending: { label: 'Pending', color: BRAND_COLORS.errorRed },
        };
        const { label, color } = config[status] || { label: 'Unknown', color: BRAND_COLORS.slate500 };
        return (
            <Chip
                label={label}
                size="small"
                sx={{
                    bgcolor: `${color}18`,
                    color: color,
                    fontWeight: TYPOGRAPHY.weights.semibold,
                    border: `1px solid ${color}40`,
                    fontSize: '0.72rem',
                }}
            />
        );
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <CircularProgress size={48} sx={{ color: BRAND_COLORS.skyBlue }} />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ borderRadius: BORDER_RADIUS.md }}>{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Card sx={{ ...CARD_STYLES.standard, border: `1px solid ${BRAND_COLORS.slate300}` }}>
                <CardContent>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Box sx={gradientIconBox(
                                `linear-gradient(135deg, ${BRAND_COLORS.skyBlue} 0%, ${BRAND_COLORS.teal} 100%)`,
                                '0 4px 16px rgba(14, 165, 233, 0.3)'
                            )}>
                                <People sx={{ color: BRAND_COLORS.white }} />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                                    My Passengers
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                                    {busInfo ? `Bus ${busInfo.busNumber} · ${filteredPassengers.length} students` : 'No bus assigned'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Search */}
                        <TextField
                            placeholder="Search by name, ID, or stop..."
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: BRAND_COLORS.slate400 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                ...INPUT_STYLES.standard,
                                minWidth: 280,
                            }}
                        />
                    </Box>

                    {/* No Bus State */}
                    {!busInfo && (
                        <Box textAlign="center" py={6}>
                            <Box sx={{
                                width: 72, height: 72, borderRadius: '50%',
                                background: BRAND_COLORS.slate100,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 2,
                            }}>
                                <People sx={{ fontSize: 36, color: BRAND_COLORS.slate400 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: TYPOGRAPHY.weights.semibold, color: BRAND_COLORS.slate700, mb: 0.5 }}>
                                No bus assigned
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.slate500 }}>
                                Contact admin to get a bus assigned to you.
                            </Typography>
                        </Box>
                    )}

                    {/* Passenger List */}
                    {busInfo && filteredPassengers.length === 0 && (
                        <Box textAlign="center" py={6}>
                            <Box sx={{
                                width: 72, height: 72, borderRadius: '50%',
                                background: BRAND_COLORS.slate100,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 2,
                            }}>
                                <Person sx={{ fontSize: 36, color: BRAND_COLORS.slate400 }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: TYPOGRAPHY.weights.semibold, color: BRAND_COLORS.slate700, mb: 0.5 }}>
                                {searchQuery ? 'No matching passengers' : 'No passengers yet'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.slate500 }}>
                                {searchQuery ? 'Try a different search term.' : 'Students will appear here once assigned to your bus.'}
                            </Typography>
                        </Box>
                    )}

                    {busInfo && filteredPassengers.length > 0 && (
                        <Grid container spacing={2}>
                            {filteredPassengers.map((passenger, index) => (
                                <Grid item xs={12} sm={6} lg={4} key={passenger._id || index}>
                                    <Card sx={{
                                        borderRadius: BORDER_RADIUS.md,
                                        border: `1px solid ${BRAND_COLORS.slate200}`,
                                        boxShadow: SHADOWS.sm,
                                        transition: 'all 0.25s ease',
                                        '&:hover': {
                                            boxShadow: SHADOWS.md,
                                            transform: 'translateY(-2px)',
                                            borderColor: BRAND_COLORS.skyBlue,
                                        },
                                    }}>
                                        <CardContent sx={{ p: 2 }}>
                                            <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                                                {/* Avatar with gradient border */}
                                                <Box sx={{
                                                    p: 0.3,
                                                    borderRadius: '50%',
                                                    background: BRAND_COLORS.primaryGradient,
                                                    display: 'flex',
                                                }}>
                                                    <Avatar
                                                        src={getAssetUrl(passenger.profilePicture)}
                                                        sx={{
                                                            width: 44, height: 44,
                                                            bgcolor: BRAND_COLORS.white,
                                                            color: BRAND_COLORS.skyBlue,
                                                            fontWeight: TYPOGRAPHY.weights.bold,
                                                            border: `2px solid ${BRAND_COLORS.white}`,
                                                            fontSize: '1rem',
                                                        }}
                                                    >
                                                        {passenger.name?.charAt(0).toUpperCase() || 'S'}
                                                    </Avatar>
                                                </Box>
                                                <Box flex={1} minWidth={0}>
                                                    <Typography variant="body2" sx={{
                                                        fontWeight: TYPOGRAPHY.weights.bold,
                                                        color: BRAND_COLORS.slate900,
                                                    }} noWrap>
                                                        {passenger.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.slate500 }} noWrap>
                                                        {passenger.studentId || 'No ID'}
                                                    </Typography>
                                                </Box>
                                                {getFeeChip(passenger.feeStatus)}
                                            </Box>

                                            <Divider sx={{ borderColor: BRAND_COLORS.slate200, mb: 1 }} />

                                            <Box display="flex" flexDirection="column" gap={0.5}>
                                                <Box display="flex" alignItems="center" gap={0.75}>
                                                    <Phone sx={{ fontSize: 14, color: BRAND_COLORS.slate400 }} />
                                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.slate600 }}>
                                                        {passenger.phone || 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" gap={0.75}>
                                                    <LocationOn sx={{ fontSize: 14, color: BRAND_COLORS.slate400 }} />
                                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.slate600 }}>
                                                        {passenger.stopName || 'No stop assigned'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
};

export default DriverPassengersView;
