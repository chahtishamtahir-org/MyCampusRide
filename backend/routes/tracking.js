const express = require('express');
const router = express.Router();
const {
  startTrip,
  stopTrip,
  updateLocation,
  getBusLocation,
  getActiveBusLocations,
  getSimulatedLocations,
  getMyTripStatus
} = require('../controllers/trackingController');
const authMiddleware = require('../middleware/authMiddleware');
const { driverOnly, adminOrDriver } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Driver only routes
router.post('/start-trip', driverOnly, startTrip);
router.post('/stop-trip', driverOnly, stopTrip);
router.put('/update-location', driverOnly, updateLocation);
router.get('/my-trip', driverOnly, getMyTripStatus);

// Public routes (authenticated users)
router.get('/bus/:busId', getBusLocation);
router.get('/active-buses', getActiveBusLocations);
router.get('/simulate', getSimulatedLocations);

module.exports = router;




