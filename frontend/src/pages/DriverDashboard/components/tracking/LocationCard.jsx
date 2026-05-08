/**
 * LocationCard - Tracking sub-component
 * Displays current latitude, longitude, and address.
 */

import React from 'react';
import {
    Card, CardContent, Typography, Box, List, ListItem,
    ListItemAvatar, ListItemText, Avatar, Divider, Chip
} from '@mui/material';
import { LocationOn, Map, GpsFixed } from '@mui/icons-material';
import {
    BRAND_COLORS, CARD_STYLES, BORDER_RADIUS, SHADOWS, TYPOGRAPHY
} from '../../../../styles/brandStyles';

const LocationCard = ({ locationData }) => {
    // Determine if we actually have a real GPS fix
    const hasLocation = locationData &&
        locationData.latitude !== 0 &&
        locationData.longitude !== 0 &&
        locationData.latitude != null;

    const latDisplay = hasLocation
        ? locationData.latitude.toFixed(6)
        : 'Acquiring…';
    const lngDisplay = hasLocation
        ? locationData.longitude.toFixed(6)
        : 'Acquiring…';
    const addressDisplay = hasLocation
        ? (locationData.address || 'Address not available')
        : 'Waiting for GPS signal';

    return (
        <Card sx={{
            ...CARD_STYLES.standard,
            border: `1px solid ${BRAND_COLORS.slate200}`,
            boxShadow: SHADOWS.sm,
        }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="subtitle2" sx={{
                        color: BRAND_COLORS.slate500,
                        fontWeight: TYPOGRAPHY.weights.semibold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '0.75rem',
                    }}>
                        Current Location
                    </Typography>
                    {hasLocation && (
                        <Chip
                            icon={<GpsFixed sx={{ fontSize: 14 }} />}
                            label={locationData.accuracy ? `±${locationData.accuracy}m` : 'GPS'}
                            size="small"
                            color="success"
                            sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                    )}
                </Box>
                <List disablePadding>
                    <ListItem disableGutters>
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'rgba(14, 165, 233, 0.1)', color: BRAND_COLORS.skyBlue }}>
                                <LocationOn />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={latDisplay}
                            secondary="Latitude"
                            primaryTypographyProps={{
                                fontWeight: TYPOGRAPHY.weights.semibold,
                                color: hasLocation ? BRAND_COLORS.slate900 : BRAND_COLORS.slate500,
                                fontStyle: hasLocation ? 'normal' : 'italic',
                            }}
                            secondaryTypographyProps={{ color: BRAND_COLORS.slate500 }}
                        />
                    </ListItem>
                    <Divider sx={{ borderColor: BRAND_COLORS.slate200 }} />
                    <ListItem disableGutters>
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'rgba(14, 165, 233, 0.1)', color: BRAND_COLORS.skyBlue }}>
                                <LocationOn />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={lngDisplay}
                            secondary="Longitude"
                            primaryTypographyProps={{
                                fontWeight: TYPOGRAPHY.weights.semibold,
                                color: hasLocation ? BRAND_COLORS.slate900 : BRAND_COLORS.slate500,
                                fontStyle: hasLocation ? 'normal' : 'italic',
                            }}
                            secondaryTypographyProps={{ color: BRAND_COLORS.slate500 }}
                        />
                    </ListItem>
                    <Divider sx={{ borderColor: BRAND_COLORS.slate200 }} />
                    <ListItem disableGutters>
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'rgba(20, 184, 166, 0.1)', color: BRAND_COLORS.teal }}>
                                <Map />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={addressDisplay}
                            secondary="Full Address"
                            primaryTypographyProps={{
                                fontWeight: TYPOGRAPHY.weights.semibold,
                                color: hasLocation ? BRAND_COLORS.slate900 : BRAND_COLORS.slate500,
                                fontStyle: hasLocation ? 'normal' : 'italic',
                            }}
                            secondaryTypographyProps={{ color: BRAND_COLORS.slate500 }}
                        />
                    </ListItem>
                </List>
            </CardContent>
        </Card>
    );
};

export default LocationCard;
