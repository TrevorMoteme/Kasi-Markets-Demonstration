/**
 * Distance Utilities for Global Personalization (0-45,000km)
 * Includes unit conversion, formatting, and distance categorization
 */

// Earth's circumference in km (for reference)
export const EARTH_CIRCUMFERENCE_KM = 40075;
export const MAX_DISTANCE_KM = 45000;
export const MIN_DISTANCE_KM = 0;

// Distance presets for smart selection
export const DISTANCE_PRESETS = [
  { value: 0, label: 'Worldwide', icon: '🌐', color: '#805ad5', description: 'Show posts from anywhere' },
  { value: 5, label: 'Walking', icon: '🚶', color: '#38a169', description: 'Within walking distance (~5km)' },
  { value: 10, label: 'Local', icon: '🏘️', color: '#3182ce', description: 'Your local area (~10km)' },
  { value: 50, label: 'City', icon: '🏙️', color: '#3182ce', description: 'Within your city (~50km)' },
  { value: 200, label: 'Regional', icon: '🗺️', color: '#d69e2e', description: 'Regional area (~200km)' },
  { value: 1000, label: 'National', icon: '🇺🇸', color: '#d69e2e', description: 'National level (~1000km)' },
  { value: 5000, label: 'Continental', icon: '🌎', color: '#ed8936', description: 'Continental scale (~5000km)' },
  { value: 45000, label: 'Global', icon: '🌍', color: '#4a5568', description: 'Worldwide coverage (~45,000km)' }
];

// Distance categories for classification
export const DISTANCE_CATEGORIES = {
  WORLDWIDE: { min: 0, max: 0, label: 'Worldwide', icon: '🌐', color: '#805ad5' },
  WALKING: { min: 0.1, max: 5, label: 'Walking', icon: '🚶', color: '#38a169' },
  LOCAL: { min: 5, max: 10, label: 'Local', icon: '🏘️', color: '#3182ce' },
  CITY: { min: 10, max: 50, label: 'City', icon: '🏙️', color: '#3182ce' },
  REGIONAL: { min: 50, max: 200, label: 'Regional', icon: '🗺️', color: '#d69e2e' },
  NATIONAL: { min: 200, max: 1000, label: 'National', icon: '🇺🇸', color: '#d69e2e' },
  CONTINENTAL: { min: 1000, max: 5000, label: 'Continental', icon: '🌎', color: '#ed8936' },
  GLOBAL: { min: 5000, max: 45000, label: 'Global', icon: '🌍', color: '#4a5568' }
};

// Conversion factors
export const KM_TO_MILES = 0.621371;
export const MILES_TO_KM = 1.60934;

/**
 * Convert kilometers to miles
 * @param {number} km - Distance in kilometers
 * @returns {number} Distance in miles
 */
export const kmToMiles = (km) => {
  if (km === null || km === undefined || isNaN(km)) return 0;
  return km * KM_TO_MILES;
};

/**
 * Convert miles to kilometers
 * @param {number} miles - Distance in miles
 * @returns {number} Distance in kilometers
 */
export const milesToKm = (miles) => {
  if (miles === null || miles === undefined || isNaN(miles)) return 0;
  return miles * MILES_TO_KM;
};

/**
 * Convert distance between units
 * @param {number} distance - Distance value
 * @param {string} fromUnit - Original unit ('km' or 'miles')
 * @param {string} toUnit - Target unit ('km' or 'miles')
 * @returns {number} Converted distance
 */
export const convertDistance = (distance, fromUnit, toUnit) => {
  if (distance === null || distance === undefined || isNaN(distance)) return 0;

  if (fromUnit === toUnit) return distance;

  if (fromUnit === 'km' && toUnit === 'miles') {
    return kmToMiles(distance);
  } else if (fromUnit === 'miles' && toUnit === 'km') {
    return milesToKm(distance);
  }

  return distance;
};

/**
 * Format distance for display with appropriate units
 * @param {number} distance - Distance value
 * @param {string} unit - Unit ('km' or 'miles')
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance, unit = 'km', decimals = 1) => {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return 'Unknown';
  }

  let value = distance;
  let displayUnit = unit;

  // Handle worldwide/anywhere
  if (value === 0) {
    return 'Worldwide';
  }

  // Format based on magnitude
  if (unit === 'miles') {
    displayUnit = 'mi';
  }

  if (value >= 1000) {
    // Large numbers: round to nearest integer with commas
    return `${Math.round(value).toLocaleString()} ${displayUnit}`;
  } else if (value >= 100) {
    return `${Math.round(value)} ${displayUnit}`;
  } else if (value >= 10) {
    return `${value.toFixed(0)} ${displayUnit}`;
  } else {
    return `${value.toFixed(decimals)} ${displayUnit}`;
  }
};

/**
 * Get the appropriate distance category based on distance value
 * @param {number} distanceKm - Distance in kilometers
 * @returns {Object} Distance category info
 */
export const getDistanceCategory = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return DISTANCE_CATEGORIES.WORLDWIDE;
  }

  // Handle worldwide/anywhere
  if (distanceKm === 0) {
    return DISTANCE_CATEGORIES.WORLDWIDE;
  }

  // Find matching category
  for (const [key, category] of Object.entries(DISTANCE_CATEGORIES)) {
    if (key !== 'WORLDWIDE' && distanceKm >= category.min && distanceKm <= category.max) {
      return category;
    }
  }

  // Default to global if beyond all categories
  return DISTANCE_CATEGORIES.GLOBAL;
};

/**
 * Get distance label based on distance value
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Human-readable distance label
 */
export const getDistanceLabel = (distanceKm) => {
  const category = getDistanceCategory(distanceKm);
  return category.label;
};

/**
 * Get distance icon based on distance value
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Icon/emoji for the distance
 */
export const getDistanceIcon = (distanceKm) => {
  const category = getDistanceCategory(distanceKm);
  return category.icon;
};

/**
 * Get distance color based on distance value
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} CSS color for the distance
 */
export const getDistanceColor = (distanceKm) => {
  const category = getDistanceCategory(distanceKm);
  return category.color;
};

/**
 * Get nearest preset for a given distance
 * @param {number} distanceKm - Current distance in km
 * @returns {Object} Nearest preset
 */
export const getNearestPreset = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return DISTANCE_PRESETS[2]; // Default to Local
  }

  let nearestPreset = DISTANCE_PRESETS[0];
  let smallestDiff = Math.abs(distanceKm - nearestPreset.value);

  for (const preset of DISTANCE_PRESETS) {
    const diff = Math.abs(distanceKm - preset.value);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      nearestPreset = preset;
    }
  }

  return nearestPreset;
};

/**
 * Validate distance range (0-45,000km)
 * @param {number} distanceKm - Distance in kilometers
 * @returns {boolean} True if valid
 */
export const validateDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return false;
  }

  return distanceKm >= MIN_DISTANCE_KM && distanceKm <= MAX_DISTANCE_KM;
};

/**
 * Calculate logarithmic scale value for slider (0-45,000km range)
 * @param {number} value - Linear value (0-45000)
 * @returns {number} Logarithmic value for slider
 */
export const toLogScale = (value) => {
  if (value <= 0) return 0;

  // Add 1 to avoid log(0)
  const logValue = Math.log10(value + 1);
  const maxLog = Math.log10(MAX_DISTANCE_KM + 1);

  return (logValue / maxLog) * 100;
};

/**
 * Calculate linear value from logarithmic scale
 * @param {number} logValue - Logarithmic value (0-100)
 * @returns {number} Linear value (0-45000)
 */
export const fromLogScale = (logValue) => {
  const maxLog = Math.log10(MAX_DISTANCE_KM + 1);
  const logResult = (logValue / 100) * maxLog;

  return Math.pow(10, logResult) - 1;
};

/**
 * Get human-readable description of distance impact
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} unit - Display unit
 * @returns {string} Description
 */
export const getDistanceDescription = (distanceKm, unit = 'km') => {
  if (distanceKm === 0) {
    return 'Shows posts from anywhere in the world';
  }

  const formattedDistance = formatDistance(distanceKm, unit);

  if (distanceKm <= 5) {
    return `Shows posts within ${formattedDistance} (walking distance)`;
  } else if (distanceKm <= 10) {
    return `Shows posts within ${formattedDistance} (your local area)`;
  } else if (distanceKm <= 50) {
    return `Shows posts within ${formattedDistance} (city-wide)`;
  } else if (distanceKm <= 200) {
    return `Shows posts within ${formattedDistance} (regional area)`;
  } else if (distanceKm <= 1000) {
    return `Shows posts within ${formattedDistance} (national level)`;
  } else if (distanceKm <= 5000) {
    return `Shows posts within ${formattedDistance} (continental scale)`;
  } else {
    return `Shows posts within ${formattedDistance} (global coverage)`;
  }
};

/**
 * Calculate distance score (0-100) based on user preferences
 * @param {number} actualDistance - Actual distance in km
 * @param {number} maxDistance - Maximum allowed distance in km
 * @returns {number} Score from 0-100
 */
export const calculateDistanceScore = (actualDistance, maxDistance) => {
  if (actualDistance === null || actualDistance === undefined || maxDistance <= 0) {
    return 50; // Neutral score
  }

  if (actualDistance <= maxDistance) {
    // Within range: closer = higher score
    const proximity = 1 - (actualDistance / maxDistance);
    return 50 + (proximity * 50); // 50-100 range
  } else {
    // Outside range: penalize based on how far outside
    const overshoot = actualDistance - maxDistance;
    const penalty = Math.min(overshoot / maxDistance, 4); // Cap penalty at 4x
    return Math.max(0, 50 - (penalty * 40)); // Minimum 0, maximum 50
  }
};

/**
 * Check if location is within distance range
 * @param {Object} loc1 - First location {lat, lng}
 * @param {Object} loc2 - Second location {lat, lng}
 * @param {number} maxDistanceKm - Maximum distance in km
 * @returns {boolean} True if within range
 */
export const isWithinDistance = (loc1, loc2, maxDistanceKm) => {
  if (!loc1 || !loc2 || !loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) {
    return false;
  }

  const distance = calculateHaversineDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
  return distance <= maxDistanceKm;
};

/**
 * Calculate Haversine distance between two coordinates
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
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
 * Generate distance markers for slider (logarithmic scale)
 * @returns {Array} Array of {value, label} for slider markers
 */
export const getDistanceSliderMarkers = () => {
  return [
    { value: toLogScale(0), label: 'Worldwide' },
    { value: toLogScale(5), label: '5km' },
    { value: toLogScale(10), label: '10km' },
    { value: toLogScale(50), label: '50km' },
    { value: toLogScale(200), label: '200km' },
    { value: toLogScale(1000), label: '1000km' },
    { value: toLogScale(5000), label: '5000km' },
    { value: toLogScale(45000), label: '45,000km' }
  ];
};

/**
 * Format distance with context (e.g., "5km away", "Within 10km")
 * @param {number} distanceKm - Distance in km
 * @param {string} unit - Display unit
 * @param {string} context - 'away' or 'within'
 * @returns {string} Formatted distance with context
 */
export const formatDistanceWithContext = (distanceKm, unit = 'km', context = 'away') => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return 'Unknown distance';
  }

  const formatted = formatDistance(distanceKm, unit);

  if (distanceKm === 0) {
    return 'Worldwide';
  }

  if (context === 'within') {
    return `Within ${formatted}`;
  } else {
    return `${formatted} away`;
  }
};

export default {
  kmToMiles,
  milesToKm,
  convertDistance,
  formatDistance,
  getDistanceCategory,
  getDistanceLabel,
  getDistanceIcon,
  getDistanceColor,
  getNearestPreset,
  validateDistance,
  toLogScale,
  fromLogScale,
  getDistanceDescription,
  calculateDistanceScore,
  isWithinDistance,
  calculateHaversineDistance,
  getDistanceSliderMarkers,
  formatDistanceWithContext,

  // Constants
  EARTH_CIRCUMFERENCE_KM,
  MAX_DISTANCE_KM,
  MIN_DISTANCE_KM,
  DISTANCE_PRESETS,
  DISTANCE_CATEGORIES,
  KM_TO_MILES,
  MILES_TO_KM
};