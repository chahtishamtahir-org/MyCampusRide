import api from './api';
import { makeApiRequest } from '../utils/apiUtils';

export const trackingService = {
  startTrip: () => makeApiRequest(() => api.post('/api/tracking/start-trip')),
  stopTrip: () => makeApiRequest(() => api.post('/api/tracking/stop-trip')),
  updateLocation: (data) => makeApiRequest(() => api.put('/api/tracking/update-location', data)),
  getBusLocation: (busId) => makeApiRequest(() => api.get(`/api/tracking/bus/${busId}`)),
  getActiveBusLocations: () => makeApiRequest(() => api.get('/api/tracking/active-buses')),
  getSimulatedLocations: (params) => makeApiRequest(() => api.get('/api/tracking/simulate', { params })),
  getMyTripStatus: () => makeApiRequest(() => api.get('/api/tracking/my-trip')),
};