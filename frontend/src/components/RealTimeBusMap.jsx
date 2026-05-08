/**
 * Real-time Bus Map Component
 * 
 * Interactive Leaflet map for displaying bus locations with real-time updates.
 * Supports different modes for admin (all buses), student (assigned bus), and driver (tracking).
 * Features smooth animations, custom markers, and responsive design.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
// ⚠️ CRITICAL: This CSS import is required for Leaflet tiles and panes to render correctly.
// Without it, the .leaflet-pane stacking, tile positioning, and z-index layering are broken.
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip, Card, CardContent, CircularProgress } from '@mui/material';
import {
  DirectionsBus,
  LocationOn,
  Person,
  AccessTime,
  Speed
} from '@mui/icons-material';
import { BRAND_COLORS, BORDER_RADIUS, SHADOWS } from '../styles/brandStyles';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus marker icons
const createBusIcon = (status = 'available', isAssigned = false) => {
  const color = status === 'on_trip' ? BRAND_COLORS.successGreen :
    status === 'maintenance' ? BRAND_COLORS.errorRed :
      isAssigned ? BRAND_COLORS.warningOrange : BRAND_COLORS.primary;

  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="white">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });
};

// Map controller component for dynamic updates
const MapController = ({ center, zoom, onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e);
      }
    }
  });

  return null;
};

/**
 * MapInvalidator — must be rendered *inside* <MapContainer> so it can
 * access the real Leaflet map instance via the useMap() hook.
 *
 * Calls map.invalidateSize() on:
 *  1. Initial mount (after sidebar animation settles — 300 ms delay)
 *  2. A second pass at 600 ms to catch slower CSS transitions
 *  3. Whenever `busLocations` changes (view switches / data arrives)
 *  4. Whenever the custom `map-should-resize` window event fires
 */
const MapInvalidator = ({ busLocations }) => {
  const map = useMap();

  const invalidate = useCallback(() => {
    // Two-pass approach covers both fast (300ms) and slow (600ms) transitions
    setTimeout(() => map.invalidateSize({ animate: false }), 300);
    setTimeout(() => map.invalidateSize({ animate: false }), 600);
  }, [map]);

  // Fire on mount
  useEffect(() => {
    invalidate();
  }, [invalidate]);

  // Fire whenever bus data changes (covers tab-switch scenario)
  useEffect(() => {
    invalidate();
  }, [busLocations, invalidate]);

  // Fire on custom event dispatched by EnhancedTrackingView
  useEffect(() => {
    window.addEventListener('map-should-resize', invalidate);
    return () => window.removeEventListener('map-should-resize', invalidate);
  }, [invalidate]);

  // Fire on window resize too
  useEffect(() => {
    window.addEventListener('resize', invalidate);
    return () => window.removeEventListener('resize', invalidate);
  }, [invalidate]);

  return null;
};

// Animated marker component
const AnimatedMarker = ({ position, icon, children, animate = true }) => {
  const markerRef = useRef(null);

  return (
    <Marker
      position={position}
      icon={icon}
      ref={markerRef}
    >
      {children}
    </Marker>
  );
};

// Bus information popup component
const BusPopup = ({ bus, location, isOnTrip, lastUpdate }) => (
  <Popup>
    <Card sx={{ minWidth: 250, maxWidth: 300 }}>
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <DirectionsBus sx={{ color: BRAND_COLORS.primary }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Bus {bus.busNumber}
          </Typography>
          <Chip
            label={isOnTrip ? 'On Trip' : 'Available'}
            color={isOnTrip ? 'success' : 'default'}
            size="small"
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Driver:</strong> {bus.driver?.name || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Route:</strong> {bus.route?.routeName || 'N/A'}
          </Typography>
        </Box>

        {location && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <LocationOn sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
              {location.address || `${location.latitude?.toFixed(6)}, ${location.longitude?.toFixed(6)}`}
            </Typography>
            {location.speed && (
              <Typography variant="body2" color="text.secondary">
                <Speed sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                {location.speed} km/h
              </Typography>
            )}
          </Box>
        )}

        {lastUpdate && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Updated: {new Date(lastUpdate).toLocaleTimeString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  </Popup>
);

/**
 * Real-time Bus Map Component
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.busLocations - Array of bus location data
 * @param {string} props.mode - Display mode: 'admin', 'student', 'driver'
 * @param {string} props.assignedBusId - For student mode, the assigned bus ID
 * @param {Array} props.routePoints - Route coordinates for line drawing
 * @param {number} props.height - Map container height
 * @param {boolean} props.showControls - Show map controls
 * @param {Function} props.onBusSelect - Callback when bus is selected
 * @param {Function} props.onMapClick - Callback for map clicks
 */
const RealTimeBusMap = ({
  busLocations = [],
  mode = 'admin',
  assignedBusId = null,
  routePoints = [],
  height = 500,
  showControls = true,
  onBusSelect,
  onMapClick
}) => {
  const [mapCenter, setMapCenter] = useState([33.6844, 73.0479]); // Default to Islamabad coordinates
  const [mapZoom, setMapZoom] = useState(13);
  const [loading, setLoading] = useState(true);

  // mapRef is no longer used for invalidateSize — that is now handled
  // by the <MapInvalidator> child component which uses useMap() internally.
  const mapRef = useRef(null);

  // Set map view based on bus locations
  useEffect(() => {
    if (busLocations.length > 0) {
      const validLocations = busLocations
        .filter(bus => bus.location?.latitude && bus.location?.longitude &&
          bus.location.latitude !== 0 && bus.location.longitude !== 0 &&
          Math.abs(bus.location.latitude) <= 90 && Math.abs(bus.location.longitude) <= 180)
        .map(bus => [bus.location.latitude, bus.location.longitude]);

      if (validLocations.length > 0) {
        // Calculate center point
        const avgLat = validLocations.reduce((sum, loc) => sum + loc[0], 0) / validLocations.length;
        const avgLng = validLocations.reduce((sum, loc) => sum + loc[1], 0) / validLocations.length;

        setMapCenter([avgLat, avgLng]);
        setMapZoom(mode === 'student' ? 15 : 13);
      }
    }
    setLoading(false);
  }, [busLocations, mode]);

  // invalidateSize is now handled inside <MapInvalidator> which uses useMap().
  // No external ref-based sizing logic needed here.

  // Filter buses based on mode
  const filteredBuses = busLocations.filter(bus => {
    if (mode === 'student' && assignedBusId) {
      return bus.busId?.toString() === assignedBusId.toString() ||
        bus._id?.toString() === assignedBusId.toString();
    }
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height,
        width: '100%',
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        position: 'relative',
        // NOTE: Do NOT spread CARD_STYLES.standard here — it adds a CSS transition+transform
        // on hover that interferes with Leaflet's internal canvas/pane positioning.
        boxShadow: SHADOWS.md,
      }}
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{
          height: '100%',
          width: '100%',
          minHeight: '400px'
        }}
        zoomControl={showControls}
      >
        {/* MapInvalidator MUST be inside MapContainer to access useMap() */}
        <MapInvalidator busLocations={busLocations} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          center={mapCenter}
          zoom={mapZoom}
          onMapClick={onMapClick}
        />

        {/* Route line */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            color={BRAND_COLORS.primary}
            weight={4}
            opacity={0.7}
          />
        )}

        {/* Bus markers */}
        {filteredBuses.map((bus) => {
          const location = bus.location || bus.currentLocation;
          // Check for valid coordinates that are not zero and within valid ranges
          if (!location?.latitude || !location?.longitude ||
            location.latitude === 0 || location.longitude === 0 ||
            Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
            console.log('Skipping bus with invalid location:', bus.busId || bus._id, location);
            return null; // Don't render marker if location is invalid
          }

          const position = [location.latitude, location.longitude];
          const isAssigned = mode === 'student' && assignedBusId &&
            (bus.busId?.toString() === assignedBusId.toString() ||
              bus._id?.toString() === assignedBusId.toString());

          const busIcon = createBusIcon(bus.status || (bus.isOnTrip ? 'on_trip' : 'available'), isAssigned);

          return (
            <AnimatedMarker
              key={bus.busId || bus._id}
              position={position}
              icon={busIcon}
              animate={true}
            >
              <BusPopup
                bus={bus}
                location={location}
                isOnTrip={bus.isOnTrip}
                lastUpdate={bus.lastUpdate || bus.lastLocationUpdate}
              />
            </AnimatedMarker>
          );
        })}

        {/* Map legend for admin mode */}
        {mode === 'admin' && filteredBuses.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 1000,
              bgcolor: 'white',
              p: 2,
              borderRadius: BORDER_RADIUS.md,
              boxShadow: 3,
              minWidth: 180
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Bus Status Legend
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: BRAND_COLORS.successGreen }} />
                <Typography variant="caption">On Trip</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: BRAND_COLORS.primary }} />
                <Typography variant="caption">Available</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: BRAND_COLORS.errorRed }} />
                <Typography variant="caption">Maintenance</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </MapContainer>

      {/* Status overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          bgcolor: 'rgba(255,255,255,0.9)',
          p: 1,
          borderRadius: BORDER_RADIUS.sm,
          boxShadow: 2
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {filteredBuses.length} bus{filteredBuses.length !== 1 ? 'es' : ''} tracked
        </Typography>
      </Box>
    </Box>
  );
};

export default RealTimeBusMap;