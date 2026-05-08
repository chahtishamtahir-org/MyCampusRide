import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  LocationOn,
  DirectionsBus,
  Refresh,
  Warning,
} from '@mui/icons-material';
import { trackingAPI } from '../api/api';

const BusMap = ({ routeId, height = 400 }) => {
  const theme = useTheme();
  const [busLocations, setBusLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasGoogleMaps, setHasGoogleMaps] = useState(false);

  useEffect(() => {
    checkGoogleMapsAvailability();
    loadBusLocations();
  }, [routeId]);

  const checkGoogleMapsAvailability = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    setHasGoogleMaps(!!apiKey && apiKey.trim() !== '');
  };

  const loadBusLocations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = routeId ? { routeId } : {};
      const response = await trackingAPI.getSimulatedLocations(params);
      setBusLocations(response.data.data);
    } catch (err) {
      setError('Failed to load bus locations');
      console.error('Bus map error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSimulatedMap = () => (
    <Box
      sx={{
        height,
        bgcolor: 'grey.100',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Simulation Mode Banner */}
      <Alert
        severity="info"
        icon={<Warning />}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 1,
        }}
      >
        Live tracking is currently under maintenance. Simulation mode active.
      </Alert>

      {/* Bus Icons on Simulated Map */}
      {busLocations.map((bus, index) => (
        <Box
          key={bus.busId}
          sx={{
            position: 'absolute',
            left: `${20 + (index * 20)}%`,
            top: `${30 + (index * 15)}%`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          <DirectionsBus
            sx={{
              fontSize: 32,
              color: bus.isOnTrip ? 'success.main' : 'primary.main',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              bgcolor: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 600,
              fontSize: '0.75rem',
              boxShadow: theme.shadows[2],
            }}
          >
            {bus.busNumber}
          </Typography>
        </Box>
      ))}

      {/* Map Grid Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Center Message */}
      <Box sx={{ textAlign: 'center', zIndex: 2 }}>
        <LocationOn sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="grey.600" sx={{ fontWeight: 600 }}>
          Campus Transport Map
        </Typography>
        <Typography variant="body2" color="grey.500">
          {busLocations.length} bus{busLocations.length !== 1 ? 'es' : ''} active
        </Typography>
      </Box>
    </Box>
  );

  const renderGoogleMaps = () => (
    <Box
      sx={{
        height,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Placeholder for Google Maps integration */}
      <Box
        sx={{
          height: '100%',
          bgcolor: 'primary.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <Typography variant="h6">
          Google Maps Integration
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Bus Tracking Map
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={loadBusLocations}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box
          sx={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {hasGoogleMaps ? renderGoogleMaps() : renderSimulatedMap()}
          
          {/* Bus Information Cards */}
          {busLocations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Active Buses ({busLocations.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {busLocations.map((bus) => (
                  <Card key={bus.busId} sx={{ minWidth: 200 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <DirectionsBus
                          sx={{
                            fontSize: 20,
                            color: bus.isOnTrip ? 'success.main' : 'primary.main',
                          }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {bus.busNumber}
                        </Typography>
                        <Chip
                          label={bus.isOnTrip ? 'On Trip' : 'Available'}
                          color={bus.isOnTrip ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Driver: {bus.driver?.name || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Route: {bus.route?.routeName || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Location: {bus.location?.address || 'Not available'}
                      </Typography>
                      {bus.isSimulated && (
                        <Chip
                          label="Simulated"
                          color="info"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default BusMap;




