/**
 * Utility functions for Geocoding and Location services.
 */

/**
 * Perform a reverse geocoding lookup using OpenStreetMap Nominatim API.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} The formatted address or a fallback string
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'MyCampusRide/1.0 - Academic Project'
        }
      }
    );
    
    if (!response.ok) return 'Live GPS location';
    
    const data = await response.json();
    
    // Construct a cleaner address if possible
    if (data.address) {
      const { road, pedestrian, path, block, neighbourhood, suburb, town, city } = data.address;
      const parts = [road || pedestrian || path || block, neighbourhood || suburb, town || city].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
    
    return data.display_name || 'Live GPS location';
  } catch (err) {
    console.warn('Geocoding failed:', err);
    return 'Live GPS location';
  }
};
