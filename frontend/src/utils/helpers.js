import React, { useState } from 'react';

// Format date for display
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'Unknown date';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };

  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown time';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(dateString);
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Deep clone object
export const deepClone = (obj) => {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj) => {
  if (!obj) return true;
  return Object.keys(obj).length === 0;
};

// Get error message from response
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';

  if (error.response && error.response.data && error.response.data.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Format phone number - COMPLETELY FIXED
export const formatPhoneNumber = (phone) => {
  // Comprehensive null/undefined check
  if (!phone || phone === 'undefined' || phone === 'null') {
    return 'Not provided';
  }

  // Convert to string and then clean
  const phoneString = String(phone);
  const cleaned = phoneString.replace(/\D/g, '');

  // Check if we have a valid phone number after cleaning
  if (cleaned.length === 0) {
    return 'Not provided';
  }

  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }

  // Return original if format doesn't match expected patterns
  return phoneString;
};

// ============================================================================
// GLOBAL DISTANCE HELPERS (0-45,000km)
// ============================================================================

// Conversion factors
const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1.60934;
const EARTH_CIRCUMFERENCE_KM = 40075;
const MAX_DISTANCE_KM = 45000;

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
 * Format distance for display with appropriate units (global support)
 * @param {number} distance - Distance value
 * @param {string} unit - Unit ('km' or 'miles')
 * @param {boolean} showUnit - Whether to show unit
 * @returns {string} Formatted distance string
 */
export const formatDistanceDisplay = (distance, unit = 'km', showUnit = true) => {
  if (distance === null || distance === undefined || isNaN(distance)) {
    return 'Unknown';
  }

  // Handle worldwide/anywhere
  if (distance === 0) {
    return 'Worldwide';
  }

  let value = distance;
  let displayUnit = unit;

  if (unit === 'miles') {
    displayUnit = 'mi';
  }

  if (value >= 1000) {
    // Large numbers: round to nearest integer with commas
    const formatted = Math.round(value).toLocaleString();
    return showUnit ? `${formatted} ${displayUnit}` : formatted;
  } else if (value >= 100) {
    const formatted = Math.round(value);
    return showUnit ? `${formatted} ${displayUnit}` : formatted.toString();
  } else if (value >= 10) {
    const formatted = value.toFixed(0);
    return showUnit ? `${formatted} ${displayUnit}` : formatted;
  } else {
    const formatted = value.toFixed(1);
    return showUnit ? `${formatted} ${displayUnit}` : formatted;
  }
};

/**
 * Get distance category based on distance value (global support)
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Distance category
 */
export const getDistanceCategory = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return 'unknown';
  }

  if (distanceKm === 0) return 'worldwide';
  if (distanceKm <= 5) return 'walking';
  if (distanceKm <= 10) return 'local';
  if (distanceKm <= 50) return 'city';
  if (distanceKm <= 200) return 'regional';
  if (distanceKm <= 1000) return 'national';
  if (distanceKm <= 5000) return 'continental';
  return 'global';
};

/**
 * Get distance icon based on distance value
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Icon/emoji for the distance
 */
export const getDistanceIcon = (distanceKm) => {
  const category = getDistanceCategory(distanceKm);

  const icons = {
    worldwide: '🌐',
    walking: '🚶',
    local: '🏘️',
    city: '🏙️',
    regional: '🗺️',
    national: '🇺🇸',
    continental: '🌎',
    global: '🌍',
    unknown: '📍'
  };

  return icons[category] || '📍';
};

/**
 * Get distance color based on distance value
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} CSS color for the distance
 */
export const getDistanceColor = (distanceKm) => {
  const category = getDistanceCategory(distanceKm);

  const colors = {
    worldwide: '#805ad5',
    walking: '#38a169',
    local: '#3182ce',
    city: '#3182ce',
    regional: '#d69e2e',
    national: '#d69e2e',
    continental: '#ed8936',
    global: '#4a5568',
    unknown: '#6c757d'
  };

  return colors[category] || '#6c757d';
};

/**
 * Get human-readable distance label
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Human-readable label
 */
export const getDistanceLabel = (distanceKm) => {
  const category = getDistanceCategory(distanceKm);

  const labels = {
    worldwide: 'Worldwide',
    walking: 'Walking distance',
    local: 'Local',
    city: 'City-wide',
    regional: 'Regional',
    national: 'National',
    continental: 'Continental',
    global: 'Global',
    unknown: 'Unknown'
  };

  return labels[category] || 'Unknown';
};

/**
 * Calculate distance between coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return null;
  }

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
 * Validate distance is within global range (0-45,000km)
 * @param {number} distanceKm - Distance in kilometers
 * @returns {boolean} True if valid
 */
export const validateDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return false;
  }

  return distanceKm >= 0 && distanceKm <= MAX_DISTANCE_KM;
};

/**
 * Get distance presets for global range
 * @returns {Array} Distance presets
 */
export const getDistancePresets = () => {
  return [
    { value: 0, label: 'Worldwide', icon: '🌐', description: 'Show posts from anywhere' },
    { value: 5, label: 'Walking', icon: '🚶', description: 'Within walking distance' },
    { value: 10, label: 'Local', icon: '🏘️', description: 'Your local area' },
    { value: 50, label: 'City', icon: '🏙️', description: 'Within your city' },
    { value: 200, label: 'Regional', icon: '🗺️', description: 'Regional area' },
    { value: 1000, label: 'National', icon: '🇺🇸', description: 'National level' },
    { value: 5000, label: 'Continental', icon: '🌎', description: 'Continental scale' },
    { value: 45000, label: 'Global', icon: '🌍', description: 'Worldwide coverage' }
  ];
};

// Extract hashtags from text
export const extractHashtags = (text) => {
  if (!text) return [];
  const hashtags = text.match(/#\w+/g) || [];
  return hashtags.map(tag => tag.substring(1).toLowerCase());
};

// Sanitize HTML
export const sanitizeHTML = (html) => {
  if (!html) return '';
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

// Media helper functions
export const mediaHelpers = {
  // Check if URL is an image
  isImage: (url) => {
    if (!url) return false;
    return /\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i.test(url);
  },

  // Check if URL is a video
  isVideo: (url) => {
    if (!url) return false;
    return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
  },

  // Get media type from URL
  getMediaType: (url) => {
    if (mediaHelpers.isImage(url)) return 'image';
    if (mediaHelpers.isVideo(url)) return 'video';
    return 'unknown';
  },

  // Generate thumbnail URL for videos (if your backend provides this)
  getVideoThumbnail: (videoUrl) => {
    if (!videoUrl) return null;
    // This would depend on your backend implementation
    // For now, return null and rely on browser-generated thumbnails
    return null;
  },

  // Validate file before upload
  validateFile: (file, options = {}) => {
    if (!file) {
      throw new Error('No file provided');
    }

    const {
      maxSize = 5 * 1024 * 1024,
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    } = options;

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type not supported. Please use: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    return true;
  }
};

// Fallback image component
export const FallbackImage = ({ src, alt, className, fallbackSrc = '/images/placeholder-image.jpg' }) => {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    setImgSrc(fallbackSrc);
  };

  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt || 'Image'}
      className={className}
      onError={handleError}
    />
  );
};

// Create object URL for file preview
export const createObjectURL = (file) => {
  if (!file) return '';
  return URL.createObjectURL(file);
};

// Revoke object URL to prevent memory leaks
export const revokeObjectURL = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

// Safe access to nested object properties
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj) return defaultValue;

  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined || !result.hasOwnProperty(key)) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
};

// Validate email format
export const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return 'N/A';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// ============== NEW FUNCTIONS ADDED FOR BACKGROUND PICTURE SUPPORT ==============

// Resolve media URLs (for both logo and background pictures)
export const resolveMediaUrl = (url) => {
  if (!url || url === 'null' || url === 'undefined' || url === '') {
    return null;
  }

  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Get base URL from environment or current location
  const apiBaseUrl = process.env.REACT_APP_API_URL || window.location.origin;
  const cleanBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  // If it starts with /media/, construct full URL
  if (url.startsWith('/media/')) {
    return `${cleanBaseUrl}${url}`;
  }

  // If it's a relative path without /media/, add it
  if (url.startsWith('media/')) {
    return `${cleanBaseUrl}/${url}`;
  }

  // Default: assume it's a relative path from media directory
  return `${cleanBaseUrl}/media/${url}`;
};

// Alternative function name for backward compatibility
export const makeAbsoluteUrl = (url) => {
  return resolveMediaUrl(url);
};

// Capitalize first letter of each word
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

// Check if value is a valid URL
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Get initials from name (for avatar fallbacks)
export const getInitials = (name) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Parse query parameters from URL
export const parseQueryParams = (search) => {
  if (!search) return {};
  const params = new URLSearchParams(search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

// Build query string from object
export const buildQueryString = (params) => {
  if (!params || isEmpty(params)) return '';
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
};

// ============================================================================
// GLOBAL PERSONALIZATION SCORE HELPERS
// ============================================================================

/**
 * Calculate relevance score based on multiple factors (global support)
 * @param {Object} factors - Score factors with weights
 * @param {number} factors.distance - Distance score (0-100)
 * @param {number} factors.category - Category match score (0-100)
 * @param {number} factors.engagement - Engagement score (0-100)
 * @param {number} factors.recency - Recency score (0-100)
 * @param {Object} weights - Weight distribution (should sum to 1)
 * @returns {number} Overall relevance score (0-100)
 */
export const calculateRelevanceScore = (factors, weights = {
  distance: 0.35,
  category: 0.30,
  engagement: 0.25,
  recency: 0.10
}) => {
  if (!factors) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  // Calculate weighted sum
  for (const [factor, weight] of Object.entries(weights)) {
    if (factors[factor] !== undefined && factors[factor] !== null) {
      totalScore += factors[factor] * weight;
      totalWeight += weight;
    }
  }

  // Normalize by total weight used
  if (totalWeight > 0) {
    return Math.round((totalScore / totalWeight) * 100) / 100;
  }

  return 0;
};

/**
 * Get score color based on value
 * @param {number} score - Score value (0-100)
 * @returns {string} CSS color class
 */
export const getScoreColor = (score) => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

/**
 * Get score label based on value
 * @param {number} score - Score value (0-100)
 * @returns {string} Human-readable label
 */
export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Very Low';
};

/**
 * Format score as percentage
 * @param {number} score - Score value (0-1 or 0-100)
 * @returns {number} Score as percentage (0-100)
 */
export const formatScorePercentage = (score) => {
  if (score === null || score === undefined || isNaN(score)) return 0;

  // If score is between 0 and 1, convert to percentage
  if (score >= 0 && score <= 1) {
    return Math.round(score * 100);
  }

  // If score is already percentage, ensure it's within 0-100
  return Math.min(100, Math.max(0, Math.round(score)));
};