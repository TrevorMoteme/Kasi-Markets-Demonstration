// utils/geolocation.js - COMPLETE UPDATED FILE

// Earth's circumference in kilometers
export const EARTH_CIRCUMFERENCE_KM = 40075;
export const MAX_DISTANCE_KM = 45000;

// Live Location - Returns simplified object (NOT GeolocationPosition)
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Return simplified object - direct latitude/longitude, NOT position.coords
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

/**
 * Simple location detection for modal use
 * @returns {Promise<Object>} Location coordinates with success status
 */
export const detectUserLocation = async () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocation not supported',
        latitude: null,
        longitude: null,
        accuracy: null
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch(error.code) {
          case 1:
            errorMessage = 'Location permission denied';
            break;
          case 2:
            errorMessage = 'Location unavailable';
            break;
          case 3:
            errorMessage = 'Location request timed out';
            break;
        }

        resolve({
          success: false,
          error: errorMessage,
          latitude: null,
          longitude: null,
          accuracy: null
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Address Geocoding - Using Backend Proxy
export const getCoordsFromAddress = async (address) => {
  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch coordinates from server');
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.display_name
    };
  } catch (error) {
    console.error('Address geocoding error:', error);
    throw error;
  }
};

// Reverse Geocoding - Using Backend Proxy
export const getAddressFromCoords = async (lat, lng) => {
  try {
    const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);

    if (!response.ok) {
      throw new Error('Failed to fetch address from server');
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      address: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country,
      postcode: data.address?.postcode
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
};

// ===================================================
// GEOCODING FUNCTIONS
// ===================================================

/**
 * Geocode an address to get coordinates
 * @param {string|object} address - Address string or {lat, lng} object
 * @returns {Promise<Object>} { lat, lng, address }
 */
export const geocodeAddress = async (address) => {
  try {
    // If address is an object with lat/lng (for reverse geocoding)
    if (typeof address === 'object' && address.lat !== undefined && address.lng !== undefined) {
      try {
        const addressInfo = await getAddressFromCoords(address.lat, address.lng);
        return {
          lat: address.lat,
          lng: address.lng,
          address: addressInfo.address,
          formattedAddress: `${addressInfo.city ? addressInfo.city + ', ' : ''}${addressInfo.state || ''}`
        };
      } catch (error) {
        return {
          lat: address.lat,
          lng: address.lng,
          address: address.address || `Location: ${address.lat.toFixed(4)}, ${address.lng.toFixed(4)}`
        };
      }
    }

    // If address is a string (forward geocoding)
    if (typeof address === 'string' && address.trim().length > 3) {
      try {
        const coords = await getCoordsFromAddress(address);
        return {
          lat: coords.latitude,
          lng: coords.longitude,
          address: coords.address
        };
      } catch (error) {
        console.error('Geocoding service error:', error);
        const coordsMatch = address.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
        if (coordsMatch) {
          return {
            lat: parseFloat(coordsMatch[1]),
            lng: parseFloat(coordsMatch[2]),
            address: `Coordinates: ${coordsMatch[1]}, ${coordsMatch[2]}`
          };
        }
        throw new Error(`Could not geocode address: ${address}`);
      }
    }

    throw new Error('Invalid address format');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Format distance for display
 */
export const formatDistance = (distance, useMiles = false) => {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return 'Unknown';
  }

  if (distance === 0) {
    return 'Worldwide';
  }

  let value = distance;
  let unit = 'km';

  if (useMiles) {
    value = kmToMiles(distance);
    unit = 'mi';
  }

  if (value >= 1000) {
    return `${Math.round(value).toLocaleString()} ${unit}`;
  } else if (value >= 100) {
    return `${Math.round(value)} ${unit}`;
  } else if (value >= 10) {
    return `${value.toFixed(0)} ${unit}`;
  } else if (value >= 1) {
    return `${value.toFixed(1)} ${unit}`;
  } else {
    if (useMiles) {
      const feet = value * 5280;
      return `${Math.round(feet)} ft`;
    } else {
      const meters = value * 1000;
      return `${Math.round(meters)} m`;
    }
  }
};

/**
 * Convert kilometers to miles
 */
export const kmToMiles = (km) => {
  return km * 0.621371;
};

/**
 * Convert miles to kilometers
 */
export const milesToKm = (miles) => {
  return miles / 0.621371;
};

/**
 * Get distance category for global range
 */
export const getDistanceCategory = (distanceKm) => {
  let category = 'global';
  let icon = '🌍';
  let color = '#4a5568';
  let label = 'Global';

  if (distanceKm === 0) {
    category = 'worldwide';
    icon = '🌐';
    color = '#805ad5';
    label = 'Worldwide';
  } else if (distanceKm <= 5) {
    category = 'walking';
    icon = '🚶';
    color = '#38a169';
    label = 'Walking';
  } else if (distanceKm <= 10) {
    category = 'local';
    icon = '🏘️';
    color = '#3182ce';
    label = 'Local';
  } else if (distanceKm <= 50) {
    category = 'city';
    icon = '🏙️';
    color = '#3182ce';
    label = 'City';
  } else if (distanceKm <= 200) {
    category = 'regional';
    icon = '🗺️';
    color = '#d69e2e';
    label = 'Regional';
  } else if (distanceKm <= 1000) {
    category = 'national';
    icon = '🇺🇸';
    color = '#d69e2e';
    label = 'National';
  } else if (distanceKm <= 5000) {
    category = 'continental';
    icon = '🌎';
    color = '#ed8936';
    label = 'Continental';
  }

  return {
    category,
    icon,
    color,
    label,
    min: distanceKm === 0 ? 0 : getCategoryMin(distanceKm),
    max: distanceKm === 0 ? 0 : getCategoryMax(distanceKm)
  };
};

const getCategoryMin = (distanceKm) => {
  if (distanceKm <= 5) return 0.1;
  if (distanceKm <= 10) return 5;
  if (distanceKm <= 50) return 10;
  if (distanceKm <= 200) return 50;
  if (distanceKm <= 1000) return 200;
  if (distanceKm <= 5000) return 1000;
  return 5000;
};

const getCategoryMax = (distanceKm) => {
  if (distanceKm <= 5) return 5;
  if (distanceKm <= 10) return 10;
  if (distanceKm <= 50) return 50;
  if (distanceKm <= 200) return 200;
  if (distanceKm <= 1000) return 1000;
  if (distanceKm <= 5000) return 5000;
  return MAX_DISTANCE_KM;
};

/**
 * Get user's current location with fallbacks
 */
export const getUserLocation = async () => {
  try {
    const position = await getCurrentPosition();
    const addressInfo = await getAddressFromCoords(position.latitude, position.longitude);

    return {
      lat: position.latitude,
      lng: position.longitude,
      accuracy: position.accuracy,
      address: addressInfo.address,
      city: addressInfo.city,
      country: addressInfo.country,
      source: 'browser'
    };
  } catch (error) {
    console.warn('Browser geolocation failed:', error.message);
    return {
      lat: null,
      lng: null,
      address: 'Location not available',
      source: 'none'
    };
  }
};

/**
 * Check if location is within distance range
 */
export const isWithinDistance = (location1, location2, maxDistance) => {
  if (!location1 || !location2 || !location1.lat || !location1.lng || !location2.lat || !location2.lng) {
    return false;
  }

  if (maxDistance === 0) {
    return true;
  }

  const distance = calculateDistance(location1.lat, location1.lng, location2.lat, location2.lng);
  return distance <= maxDistance;
};

/**
 * Calculate distance score for personalized feed
 */
export const calculateDistanceScore = (userLocation, businessLocation, maxDistance) => {
  if (!userLocation || !businessLocation) {
    return 50;
  }

  if (maxDistance === 0) {
    return 50;
  }

  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    businessLocation.lat,
    businessLocation.lng
  );

  if (distance <= maxDistance) {
    const proximityScore = 100 - (distance / maxDistance) * 50;
    return Math.max(50, Math.min(100, proximityScore));
  } else {
    const penalty = (distance - maxDistance) / maxDistance * 40;
    return Math.max(10, 50 - penalty);
  }
};

/**
 * Get location permission status
 */
export const getLocationPermissionStatus = async () => {
  if (!navigator.permissions || !navigator.permissions.query) {
    return 'prompt';
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    console.warn('Permission query failed:', error);
    return 'prompt';
  }
};

/**
 * Request location permission
 */
export const requestLocationPermission = async () => {
  try {
    const position = await getCurrentPosition();
    return !!position;
  } catch (error) {
    return false;
  }
};

/**
 * Sort items by distance from user location
 */
export const sortByDistance = (items, userLocation, latKey = 'latitude', lngKey = 'longitude') => {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    return items.map(item => ({ ...item, distance: null }));
  }

  return items
    .filter(item => item[latKey] && item[lngKey])
    .map(item => ({
      ...item,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        item[latKey],
        item[lngKey]
      )
    }))
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
};

/**
 * Filter items within distance range
 */
export const filterByDistance = (items, maxDistance) => {
  if (maxDistance === 0) {
    return items;
  }

  return items.filter(item =>
    item.distance !== null && item.distance <= maxDistance
  );
};

/**
 * Get nearby posts with distance info
 */
export const getNearbyPosts = (posts, userLocation, maxDistance) => {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    return posts.map(post => ({ ...post, distance: null, withinRange: true }));
  }

  return posts
    .map(post => {
      const distance = post.business_latitude && post.business_longitude
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            post.business_latitude,
            post.business_longitude
          )
        : null;

      const withinRange = maxDistance === 0 ? true : (distance !== null ? distance <= maxDistance : true);

      return {
        ...post,
        distance,
        withinRange,
        formattedDistance: distance !== null ? formatDistance(distance) : 'Unknown',
        distanceCategory: distance !== null ? getDistanceCategory(distance) : null
      };
    })
    .filter(post => post.withinRange)
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
};

/**
 * Calculate logarithmic value for slider
 */
export const toLogScale = (linearValue) => {
  if (linearValue <= 0) return 0;

  const logValue = Math.log10(linearValue + 1);
  const maxLog = Math.log10(MAX_DISTANCE_KM + 1);

  return (logValue / maxLog) * 100;
};

/**
 * Calculate linear value from logarithmic scale
 */
export const fromLogScale = (logValue) => {
  const maxLog = Math.log10(MAX_DISTANCE_KM + 1);
  const logResult = (logValue / 100) * maxLog;

  return Math.pow(10, logResult) - 1;
};

/**
 * Get distance presets for global range
 */
export const getDistancePresets = () => {
  return [
    { value: 0, label: 'Worldwide', icon: '🌐', color: '#805ad5', description: 'Show posts from anywhere' },
    { value: 5, label: 'Walking', icon: '🚶', color: '#38a169', description: 'Within walking distance (~5km)' },
    { value: 10, label: 'Local', icon: '🏘️', color: '#3182ce', description: 'Your local area (~10km)' },
    { value: 50, label: 'City', icon: '🏙️', color: '#3182ce', description: 'Within your city (~50km)' },
    { value: 200, label: 'Regional', icon: '🗺️', color: '#d69e2e', description: 'Regional area (~200km)' },
    { value: 1000, label: 'National', icon: '🇺🇸', color: '#d69e2e', description: 'National level (~1000km)' },
    { value: 5000, label: 'Continental', icon: '🌎', color: '#ed8936', description: 'Continental scale (~5000km)' },
    { value: 45000, label: 'Global', icon: '🌍', color: '#4a5568', description: 'Worldwide coverage (~45,000km)' }
  ];
};

export const isValidCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

// Alias for backward compatibility
export const getGeolocation = getCurrentPosition;