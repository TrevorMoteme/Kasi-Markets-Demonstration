// utils/constants.js

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// User Types
export const USER_TYPES = {
  CUSTOMER: 'customer',
  BUSINESS_OWNER: 'business_owner',
  ADMIN: 'admin'
};

// Post Types
export const POST_TYPES = {
  POST: 'post',
  OFFER: 'offer',
  EVENT: 'event',
  ANNOUNCEMENT: 'announcement',
  JOB: 'job',
  REVIEW: 'review'
};

// Event Types
export const EVENT_TYPES = {
  WORKSHOP: 'workshop',
  NETWORKING: 'networking',
  SALE: 'sale',
  OPEN_HOUSE: 'open_house',
  CONFERENCE: 'conference',
  CONCERT: 'concert',
  FESTIVAL: 'festival',
  SPORTS: 'sports',
  CHARITY: 'charity',
  OTHER: 'other'
};

// Promotion Types
export const PROMOTION_TYPES = {
  FEATURED: 'featured',
  TRENDING: 'trending',
  LOCAL_HIGHLIGHT: 'local_highlight',
  SPONSORED: 'sponsored',
  NEW_BUSINESS: 'new_business'
};

// ============================================================================
// COMPREHENSIVE BUSINESS CATEGORIES WITH SUBCATEGORIES
// ============================================================================

// Main business categories (compatible with existing code)
export const BUSINESS_CATEGORIES = [
  // Food & Beverage (Primary category for existing users)
  'Restaurants/Cafes',
  'Bars/Pubs',
  'Food Trucks',
  'Bakeries',
  'Grocery/Supermarkets',
  'Specialty Food',

  // Retail
  'Retail Stores',
  'Fashion/Apparel',
  'Electronics',
  'Home Goods',
  'Sports/Outdoor',
  'Beauty/Cosmetics',

  // Services
  'Professional Services',
  'Home Services',
  'Health/Wellness',
  'Automotive',
  'Education/Training',
  'Entertainment',

  // Additional Core Categories
  'Technology',
  'Real Estate',
  'Travel/Hospitality',
  'Arts/Crafts',
  'Finance/Insurance',
  'Construction'
];

// Enhanced category system with subcategories and metadata
export const BUSINESS_CATEGORIES_ENHANCED = {
  // Food & Beverage
  'food-beverage': {
    label: 'Food & Beverage',
    subcategories: [
      { id: 'restaurants', label: 'Restaurants', aliases: ['diner', 'bistro', 'eatery', 'steakhouse'] },
      { id: 'cafes', label: 'Cafés & Coffee Shops', aliases: ['coffee', 'tea house', 'espresso'] },
      { id: 'bars', label: 'Bars & Pubs', aliases: ['brewery', 'taproom', 'cocktail bar', 'wine bar'] },
      { id: 'food-trucks', label: 'Food Trucks', aliases: ['street food', 'food cart'] },
      { id: 'bakeries', label: 'Bakeries', aliases: ['patisserie', 'bakery', 'pastry shop'] },
      { id: 'ice-cream', label: 'Ice Cream & Desserts', aliases: ['gelato', 'dessert shop'] },
      { id: 'juice-bars', label: 'Juice & Smoothie Bars' },
      { id: 'specialty-food', label: 'Specialty Food Stores', aliases: ['butcher', 'cheese shop', 'fishmonger'] },
      { id: 'catering', label: 'Catering Services' },
      { id: 'farmers-markets', label: 'Farmers Markets' }
    ]
  },

  // Retail & Shopping
  'retail': {
    label: 'Retail & Shopping',
    subcategories: [
      { id: 'department-stores', label: 'Department Stores' },
      { id: 'grocery', label: 'Grocery & Supermarkets', aliases: ['supermarket', 'convenience store'] },
      { id: 'fashion', label: 'Fashion & Apparel', aliases: ['clothing', 'shoes', 'accessories'] },
      { id: 'electronics', label: 'Electronics', aliases: ['computers', 'phones', 'audio'] },
      { id: 'home-goods', label: 'Home Goods', aliases: ['furniture', 'decor', 'housewares'] },
      { id: 'sporting-goods', label: 'Sporting Goods', aliases: ['outdoor gear', 'fitness equipment'] },
      { id: 'beauty', label: 'Beauty & Cosmetics', aliases: ['makeup', 'skincare', 'perfume'] },
      { id: 'pharmacy', label: 'Pharmacies & Drugstores' },
      { id: 'pet-supplies', label: 'Pet Supplies' },
      { id: 'bookstores', label: 'Bookstores' },
      { id: 'jewelry', label: 'Jewelry & Luxury Goods' },
      { id: 'vintage', label: 'Vintage & Thrift Stores', aliases: ['consignment', 'secondhand'] }
    ]
  },

  // Services
  'services': {
    label: 'Services',
    subcategories: [
      { id: 'professional', label: 'Professional Services', aliases: ['legal', 'accounting', 'consulting'] },
      { id: 'home-services', label: 'Home Services', aliases: ['plumbing', 'electrical', 'cleaning', 'repair'] },
      { id: 'health-wellness', label: 'Health & Wellness', aliases: ['medical', 'dental', 'therapy'] },
      { id: 'automotive', label: 'Automotive Services', aliases: ['car repair', 'car wash', 'towing'] },
      { id: 'education', label: 'Education & Training', aliases: ['tutoring', 'schools', 'classes'] },
      { id: 'entertainment', label: 'Entertainment', aliases: ['movies', 'theaters', 'events'] },
      { id: 'beauty-services', label: 'Beauty Services', aliases: ['salon', 'barber', 'spa'] },
      { id: 'financial', label: 'Financial Services', aliases: ['banking', 'insurance', 'investing'] },
      { id: 'real-estate', label: 'Real Estate Services', aliases: ['agents', 'property management'] },
      { id: 'travel', label: 'Travel Services', aliases: ['agencies', 'tours', 'accommodation'] }
    ]
  },

  // Technology & Digital
  'technology': {
    label: 'Technology',
    subcategories: [
      { id: 'software', label: 'Software Development' },
      { id: 'web-dev', label: 'Web Development' },
      { id: 'mobile-apps', label: 'Mobile App Development' },
      { id: 'it-services', label: 'IT Services & Support' },
      { id: 'cybersecurity', label: 'Cybersecurity' },
      { id: 'digital-marketing', label: 'Digital Marketing' },
      { id: 'tech-repair', label: 'Tech Repair', aliases: ['phone repair', 'computer repair'] },
      { id: 'ecommerce', label: 'E-commerce Solutions' },
      { id: 'cloud-services', label: 'Cloud Services' },
      { id: 'data-analytics', label: 'Data Analytics' }
    ]
  },

  // Health & Wellness
  'health-wellness': {
    label: 'Health & Wellness',
    subcategories: [
      { id: 'medical', label: 'Medical Clinics' },
      { id: 'dental', label: 'Dental Care' },
      { id: 'mental-health', label: 'Mental Health Services' },
      { id: 'fitness', label: 'Fitness & Gyms', aliases: ['yoga', 'pilates', 'personal training'] },
      { id: 'spa', label: 'Spa & Massage' },
      { id: 'alternative-medicine', label: 'Alternative Medicine', aliases: ['acupuncture', 'chiropractic'] },
      { id: 'nutrition', label: 'Nutrition & Dietetics' },
      { id: 'senior-care', label: 'Senior Care' },
      { id: 'veterinary', label: 'Veterinary Services' },
      { id: 'pharmacies', label: 'Pharmacies' }
    ]
  },

  // Creative & Arts
  'creative-arts': {
    label: 'Creative & Arts',
    subcategories: [
      { id: 'graphic-design', label: 'Graphic Design' },
      { id: 'photography', label: 'Photography' },
      { id: 'music', label: 'Music & Audio', aliases: ['recording studios', 'music lessons'] },
      { id: 'art-galleries', label: 'Art Galleries' },
      { id: 'crafts', label: 'Arts & Crafts' },
      { id: 'performing-arts', label: 'Performing Arts', aliases: ['theater', 'dance'] },
      { id: 'writing-editing', label: 'Writing & Editing' },
      { id: 'architecture', label: 'Architecture & Interior Design' },
      { id: 'fashion-design', label: 'Fashion Design' },
      { id: 'film-production', label: 'Film & Video Production' }
    ]
  },

  // Additional Categories
  'construction': {
    label: 'Construction & Industrial',
    subcategories: [
      { id: 'contractors', label: 'General Contractors' },
      { id: 'home-renovation', label: 'Home Renovation' },
      { id: 'landscaping', label: 'Landscaping' },
      { id: 'electrical', label: 'Electrical Services' },
      { id: 'plumbing', label: 'Plumbing Services' },
      { id: 'hvac', label: 'HVAC Services' },
      { id: 'roofing', label: 'Roofing' },
      { id: 'painting', label: 'Painting' },
      { id: 'flooring', label: 'Flooring' },
      { id: 'handyman', label: 'Handyman Services' }
    ]
  },

  'travel-hospitality': {
    label: 'Travel & Hospitality',
    subcategories: [
      { id: 'hotels', label: 'Hotels & Accommodation' },
      { id: 'travel-agencies', label: 'Travel Agencies' },
      { id: 'tour-operators', label: 'Tour Operators' },
      { id: 'car-rental', label: 'Car Rental' },
      { id: 'restaurants', label: 'Restaurants & Dining' },
      { id: 'event-venues', label: 'Event Venues' },
      { id: 'tourist-attractions', label: 'Tourist Attractions' },
      { id: 'adventure-tourism', label: 'Adventure Tourism' },
      { id: 'eco-tourism', label: 'Eco-tourism' },
      { id: 'cruises', label: 'Cruises' }
    ]
  }
};

// Flattened list of all category IDs for search and filtering
export const ALL_CATEGORY_IDS = Object.entries(BUSINESS_CATEGORIES_ENHANCED).reduce((acc, [categoryKey, categoryData]) => {
  const mainCategoryId = categoryKey;
  const subcategoryIds = categoryData.subcategories.map(sub => sub.id);
  return [...acc, mainCategoryId, ...subcategoryIds];
}, []);

// All search aliases for enhanced search functionality
export const CATEGORY_SEARCH_ALIASES = Object.values(BUSINESS_CATEGORIES_ENHANCED).reduce((acc, category) => {
  category.subcategories.forEach(subcategory => {
    if (subcategory.aliases) {
      subcategory.aliases.forEach(alias => {
        acc[alias.toLowerCase()] = subcategory.id;
      });
    }
    // Add the subcategory label itself as an alias
    acc[subcategory.label.toLowerCase()] = subcategory.id;
  });
  return acc;
}, {});

// Helper function to get category by ID
export const getCategoryById = (categoryId) => {
  for (const [key, category] of Object.entries(BUSINESS_CATEGORIES_ENHANCED)) {
    if (key === categoryId) {
      return category;
    }
    const subcategory = category.subcategories.find(sub => sub.id === categoryId);
    if (subcategory) {
      return { ...subcategory, parentCategory: key };
    }
  }
  return null;
};

// Helper function to search categories by term
export const searchCategories = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  const results = [];

  // search in main categories
  Object.entries(BUSINESS_CATEGORIES_ENHANCED).forEach(([key, category]) => {
    if (category.label.toLowerCase().includes(term)) {
      results.push({
        type: 'main',
        id: key,
        label: category.label,
        match: 'label'
      });
    }
  });

  // search in subcategories
  Object.values(BUSINESS_CATEGORIES_ENHANCED).forEach(category => {
    category.subcategories.forEach(subcategory => {
      const matches = [];

      // Check label
      if (subcategory.label.toLowerCase().includes(term)) {
        matches.push('label');
      }

      // Check aliases
      if (subcategory.aliases && subcategory.aliases.some(alias => alias.toLowerCase().includes(term))) {
        matches.push('alias');
      }

      if (matches.length > 0) {
        results.push({
          type: 'subcategory',
          id: subcategory.id,
          label: subcategory.label,
          parentCategory: category.label,
          match: matches,
          aliases: subcategory.aliases || []
        });
      }
    });
  });

  return results;
};

// Legacy compatibility - convert old category format to new system
export const mapLegacyCategory = (legacyCategory) => {
  const mapping = {
    'Restaurants/Cafes': 'restaurants',
    'Retail stores': 'retail',
    'Services (plumbing, electric, etc.)': 'home-services',
    'Entertainment venues': 'entertainment',
    'Health & wellness': 'health-wellness',
    'Automotive': 'automotive',
    'Education': 'education',
    'Real Estate': 'real-estate',
    'Technology': 'technology',
    'Finance': 'financial',
    'Arts & Crafts': 'crafts',
    'Home Services': 'home-services',
    'Beauty & Personal Care': 'beauty-services',
    'Fitness & Sports': 'fitness',
    'Travel & Tourism': 'travel'
  };

  return mapping[legacyCategory] || legacyCategory.toLowerCase().replace(/\s+/g, '-');
};

// Get all subcategories for a main category
export const getSubcategories = (mainCategoryId) => {
  const category = BUSINESS_CATEGORIES_ENHANCED[mainCategoryId];
  return category ? category.subcategories : [];
};

// Get display name for category ID
export const getCategoryDisplayName = (categoryId) => {
  const category = getCategoryById(categoryId);
  if (!category) return categoryId;

  if (category.parentCategory) {
    // It's a subcategory
    return category.label;
  } else {
    // It's a main category
    return category.label;
  }
};

// Get full category path (e.g., "Food & Beverage > Restaurants")
export const getCategoryPath = (categoryId) => {
  const category = getCategoryById(categoryId);
  if (!category) return categoryId;

  if (category.parentCategory) {
    const parentCategory = BUSINESS_CATEGORIES_ENHANCED[category.parentCategory];
    return `${parentCategory.label} > ${category.label}`;
  } else {
    return category.label;
  }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'kasi_auth_token',
  USER_DATA: 'kasi_user_data',
  PREFERENCES: 'kasi_preferences',
  FEED_PREFERENCES: 'kasi_feed_preferences',
  SELECTED_CATEGORIES: 'kasi_selected_categories',
  CATEGORY_HISTORY: 'kasi_category_history'
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
  CATEGORY_GRID_LIMIT: 12,
  TRENDING_LIMIT: 6
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  ACCEPTED_TYPES: {
    IMAGE: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
    VIDEO: 'video/mp4,video/mpeg,video/quicktime,video/webm',
    DOCUMENT: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ALL: 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mpeg,video/quicktime,video/webm,application/pdf'
  }
};

// ============================================================================
// GLOBAL DISTANCE CONSTANTS FOR PERSONALIZATION (0-45,000km)
// ============================================================================

export const DISTANCE_CONSTANTS = {
  // Range limits
  MIN_DISTANCE_KM: 0,
  MAX_DISTANCE_KM: 45000,
  EARTH_CIRCUMFERENCE_KM: 40075,

  // Distance presets for smart selection
  DISTANCE_PRESETS: [
    { value: 0, label: 'Worldwide', icon: '🌐', color: '#805ad5', description: 'Show posts from anywhere' },
    { value: 5, label: 'Walking', icon: '🚶', color: '#38a169', description: 'Within walking distance (~5km)' },
    { value: 10, label: 'Local', icon: '🏘️', color: '#3182ce', description: 'Your local area (~10km)' },
    { value: 50, label: 'City', icon: '🏙️', color: '#3182ce', description: 'Within your city (~50km)' },
    { value: 200, label: 'Regional', icon: '🗺️', color: '#d69e2e', description: 'Regional area (~200km)' },
    { value: 1000, label: 'National', icon: '🇺🇸', color: '#d69e2e', description: 'National level (~1000km)' },
    { value: 5000, label: 'Continental', icon: '🌎', color: '#ed8936', description: 'Continental scale (~5000km)' },
    { value: 45000, label: 'Global', icon: '🌍', color: '#4a5568', description: 'Worldwide coverage (~45,000km)' }
  ],

  // Distance categories for classification
  DISTANCE_CATEGORIES: {
    WORLDWIDE: { min: 0, max: 0, label: 'Worldwide', icon: '🌐', color: '#805ad5' },
    WALKING: { min: 0.1, max: 5, label: 'Walking', icon: '🚶', color: '#38a169' },
    LOCAL: { min: 5, max: 10, label: 'Local', icon: '🏘️', color: '#3182ce' },
    CITY: { min: 10, max: 50, label: 'City', icon: '🏙️', color: '#3182ce' },
    REGIONAL: { min: 50, max: 200, label: 'Regional', icon: '🗺️', color: '#d69e2e' },
    NATIONAL: { min: 200, max: 1000, label: 'National', icon: '🇺🇸', color: '#d69e2e' },
    CONTINENTAL: { min: 1000, max: 5000, label: 'Continental', icon: '🌎', color: '#ed8936' },
    GLOBAL: { min: 5000, max: 45000, label: 'Global', icon: '🌍', color: '#4a5568' }
  },

  // Conversion factors
  KM_TO_MILES: 0.621371,
  MILES_TO_KM: 1.60934,

  // Default values
  DEFAULT_DISTANCE_KM: 50,
  DEFAULT_DISTANCE_UNIT: 'km',
  DEFAULT_DISTANCE_PRESET: 'city'
};

// Feed Constants - UPDATED FOR GLOBAL PERSONALIZATION
export const FEED_CONSTANTS = {
  DEFAULT_MAX_DISTANCE: 50, // km
  MIN_DISTANCE: 0, // km - Updated for worldwide
  MAX_DISTANCE: 45000, // km - Updated for global scale

  // Score thresholds
  HIGH_RELEVANCE_THRESHOLD: 0.8,
  MEDIUM_RELEVANCE_THRESHOLD: 0.5,
  LOW_RELEVANCE_THRESHOLD: 0.3,

  // Weight factors for scoring (updated for global personalization)
  WEIGHTS: {
    DISTANCE: 0.35,
    CATEGORY: 0.30,
    ENGAGEMENT: 0.25,
    RECENCY: 0.10
  },

  // Sorting options
  SORT_OPTIONS: [
    { value: 'relevance_score', label: 'Most Relevant' },
    { value: 'distance', label: 'Closest First' },
    { value: 'created_at', label: 'Newest First' },
    { value: 'likes_count', label: 'Most Popular' },
    { value: 'trending', label: 'Trending' }
  ],

  // Feed types
  FEED_TYPES: {
    PERSONALIZED: 'personalized',
    REGULAR: 'regular',
    TRENDING: 'trending',
    FOLLOWING: 'following',
    CATEGORY: 'category',
    DISCOVER: 'discover'
  },

  // Default preferences - UPDATED FOR GLOBAL PERSONALIZATION
  DEFAULT_PREFERENCES: {
    max_distance_km: 50,
    use_miles: false,
    preferred_categories: [],
    enable_distance_prioritization: true,
    enable_category_prioritization: true,
    home_latitude: null,
    home_longitude: null,
    home_address: null,
    location_type: 'auto',
    manual_location: '',
    distance_preset: 'city'
  },

  // Score breakdown categories
  SCORE_CATEGORIES: {
    DISTANCE: 'distance',
    CATEGORY: 'category',
    ENGAGEMENT: 'engagement',
    RECENCY: 'recency'
  }
};

// Category-specific constants
export const CATEGORY_CONSTANTS = {
  // Default categories for new users
  DEFAULT_PREFERRED_CATEGORIES: ['restaurants', 'retail', 'services', 'technology'],

  // Popular categories (most searched/used)
  POPULAR_CATEGORIES: [
    'restaurants',
    'retail',
    'home-services',
    'health-wellness',
    'technology',
    'entertainment',
    'education',
    'automotive'
  ],

  // Trending categories (based on recent activity)
  TRENDING_CATEGORIES: [
    'food-trucks',
    'fitness',
    'digital-marketing',
    'eco-tourism',
    'home-renovation'
  ],

  // Categories that support specific features
  CATEGORIES_WITH_EVENTS: ['restaurants', 'entertainment', 'education', 'fitness'],
  CATEGORIES_WITH_OFFERS: ['retail', 'restaurants', 'beauty-services', 'home-services'],

  // Maximum categories per business
  MAX_CATEGORIES_PER_BUSINESS: 5,

  // Category icons mapping
  CATEGORY_ICONS: {
    'food-beverage': '🍽️',
    'retail': '🛍️',
    'services': '🔧',
    'technology': '💻',
    'health-wellness': '🏥',
    'creative-arts': '🎨',
    'construction': '🏗️',
    'travel-hospitality': '✈️',
    'restaurants': '🍴',
    'cafes': '☕',
    'bars': '🍺',
    'fashion': '👕',
    'electronics': '📱',
    'fitness': '💪',
    'education': '📚',
    'automotive': '🚗',
    'real-estate': '🏠',
    'beauty-services': '💇',
    'entertainment': '🎭',
    'financial': '💰'
  }
};

// Time constants
export const TIME_CONSTANTS = {
  FEED_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  CACHE_TTL: 10 * 60 * 1000, // 10 minutes
  DEBOUNCE_DELAY: 300, // ms
  CATEGORY_STATS_REFRESH: 30 * 60 * 1000, // 30 minutes
  TRENDING_REFRESH: 15 * 60 * 1000 // 15 minutes
};

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 3000,
  MODAL_ANIMATION_DURATION: 300,
  INFINITE_SCROLL_THRESHOLD: 100,
  CATEGORY_GRID_COLUMNS: 3,
  BUSINESS_CARDS_PER_ROW: 3,

  // Distance slider settings
  DISTANCE_SLIDER: {
    STEP: 1,
    MIN: 0,
    MAX: 45000,
    LOGARITHMIC: true
  },

  // Category UI settings
  CATEGORY_UI: {
    SHOW_SUBCATEGORIES: true,
    ENABLE_MULTISELECT: true,
    MAX_VISIBLE_CATEGORIES: 50,
    SHOW_CATEGORY_ICONS: true,
    DEFAULT_VIEW: 'grid' // 'grid', 'list', 'compact'
  }
};

// Regional variations (can be expanded based on location)
export const REGIONAL_CATEGORIES = {
  US: {
    additional: ['gun-shops', 'dispensaries', 'drive-thrus'],
    renamed: { 'chemist': 'pharmacy', 'takeaway': 'takeout' }
  },
  UK: {
    additional: ['off-licence', 'takeaway', 'chemist'],
    renamed: { 'pharmacy': 'chemist', 'liquor-store': 'off-licence' }
  },
  EU: {
    additional: ['kiosk', 'apotheke', 'boulangerie'],
    renamed: { 'bakery': 'boulangerie', 'pharmacy': 'apotheke' }
  }
};

// Export helpers for backward compatibility
export const getCategoryIcon = (categoryId) => {
  return CATEGORY_CONSTANTS.CATEGORY_ICONS[categoryId] || '🏢';
};

export const isPopularCategory = (categoryId) => {
  return CATEGORY_CONSTANTS.POPULAR_CATEGORIES.includes(categoryId);
};

export const getCategoryColor = (categoryId) => {
  const colors = [
    '#4299E1', // Blue
    '#48BB78', // Green
    '#ED8936', // Orange
    '#9F7AEA', // Purple
    '#F56565', // Red
    '#38B2AC', // Teal
    '#ECC94B', // Yellow
    '#4FD1C7', // Cyan
    '#F687B3', // Pink
    '#A0AEC0'  // Gray
  ];

  // Generate consistent color based on category ID
  const hash = categoryId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};