/**
 * BusStatusCard - Tracking sub-component
 * Displays bus number, capacity, and tracking status.
 * Uses busInfo for bus details and locationData for tracking status.
 */

import React from 'react';
import {
    Card, CardContent, Typography, Box, Chip
} from '@mui/material';
import { DirectionsBus } from '@mui/icons-material';
import {
    BRAND_COLORS, CARD_STYLES, BORDER_RADIUS, SHADOWS, TYPOGRAPHY
} from '../../../../styles/brandStyles';

const BusStatusCard = ({ busInfo, locationData }) => {
    // Determine tracking status from locationData and busInfo
    const isOnTrip = locationData?.isOnTrip || busInfo?.isOnTrip || false;
    const statusLabel = isOnTrip ? 'On Trip' : (busInfo?.status === 'available' ? 'Available' : busInfo?.status || 'Offline');
    const statusColor = isOnTrip ? BRAND_COLORS.successGreen : BRAND_COLORS.slate400;

    return (
        <Card sx={{
            ...CARD_STYLES.standard,
            border: `1px solid ${BRAND_COLORS.slate200}`,
            boxShadow: SHADOWS.sm,
            transition: 'all 0.3s ease',
            '&:hover': {
                boxShadow: SHADOWS.md,
                transform: 'translateY(-2px)',
            },
        }}>
            <CardContent>
                <Typography variant="subtitle2" sx={{
                    color: BRAND_COLORS.slate500,
                    fontWeight: TYPOGRAPHY.weights.semibold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '0.75rem',
                    mb: 1.5,
                }}>
                    Current Bus
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                    <Box sx={{
                        width: 36, height: 36,
                        borderRadius: BORDER_RADIUS.sm,
                        background: BRAND_COLORS.primaryGradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <DirectionsBus sx={{ color: BRAND_COLORS.white, fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: TYPOGRAPHY.weights.bold, color: BRAND_COLORS.slate900 }}>
                            {busInfo?.busNumber || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                            Capacity: {busInfo?.currentCapacity || 0}/{busInfo?.capacity || 0}
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="subtitle2" sx={{
                    color: BRAND_COLORS.slate500,
                    fontWeight: TYPOGRAPHY.weights.semibold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '0.75rem',
                    mb: 1,
                }}>
                    Tracking Status
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <Chip
                        label={statusLabel}
                        sx={{
                            bgcolor: statusColor,
                            color: BRAND_COLORS.white,
                            fontWeight: TYPOGRAPHY.weights.semibold,
                            textTransform: 'capitalize',
                        }}
                    />
                </Box>
                <Typography variant="body2" sx={{ color: BRAND_COLORS.slate600 }}>
                    Last Updated: {locationData?.lastUpdate
                        ? new Date(locationData.lastUpdate).toLocaleString()
                        : busInfo?.lastLocationUpdate
                            ? new Date(busInfo.lastLocationUpdate).toLocaleString()
                            : 'Never'}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default BusStatusCard;
