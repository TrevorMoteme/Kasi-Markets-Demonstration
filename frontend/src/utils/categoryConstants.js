// src/utils/categoryConstants.js
// Single source of truth for all categories

export const CATEGORIES = {
  // Main categories with their database keys and display names
  'food-beverage': {
    id: 'food-beverage',
    displayName: 'Food & Beverage',
    icon: '🍔',
    description: 'Restaurants, cafes, bars, fast food, bakeries',
    subcategories: ['restaurant', 'cafe', 'bar', 'fast-food', 'bakery', 'coffee-shop', 'pizzeria', 'diner']
  },
  'retail': {
    id: 'retail',
    displayName: 'Retail',
    icon: '🛍️',
    description: 'Clothing, electronics, grocery, department stores',
    subcategories: ['clothing', 'electronics', 'grocery', 'department-store', 'jewelry', 'furniture']
  },
  'services': {
    id: 'services',
    displayName: 'Services',
    icon: '🔧',
    description: 'Plumbing, electric, cleaning, repair services',
    subcategories: ['plumbing', 'electric', 'cleaning', 'repair', 'consulting', 'legal', 'accounting']
  },
  'health-wellness': {
    id: 'health-wellness',
    displayName: 'Health & Wellness',
    icon: '🧘',
    description: 'Gyms, spas, doctors, dentists, pharmacies',
    subcategories: ['gym', 'spa', 'doctor', 'dentist', 'pharmacy', 'yoga', 'meditation']
  },
  'entertainment': {
    id: 'entertainment',
    displayName: 'Entertainment',
    icon: '🎬',
    description: 'Movies, concerts, theatre, gaming, sports',
    subcategories: ['movies', 'concerts', 'theatre', 'gaming', 'sports', 'events']
  },
  'technology': {
    id: 'technology',
    displayName: 'Technology',
    icon: '💻',
    description: 'Software, hardware, IT services',
    subcategories: ['software', 'hardware', 'it-services', 'web-development', 'app-development']
  },
  'education': {
    id: 'education',
    displayName: 'Education',
    icon: '📚',
    description: 'Schools, universities, tutoring, training',
    subcategories: ['school', 'university', 'tutoring', 'training', 'workshop']
  },
  'automotive': {
    id: 'automotive',
    displayName: 'Automotive',
    icon: '🚗',
    description: 'Repair, sales, rental, parts',
    subcategories: ['repair', 'sales', 'rental', 'parts', 'service-center']
  },
  'arts': {
    id: 'arts',
    displayName: 'Arts',
    icon: '🎨',
    description: 'Galleries, museums, studios, theatre',
    subcategories: ['gallery', 'museum', 'studio', 'theatre', 'music']
  },
  'travel': {
    id: 'travel',
    displayName: 'Travel',
    icon: '✈️',
    description: 'Hotels, flights, tours, agencies',
    subcategories: ['hotel', 'flight', 'tour', 'agency', 'rental']
  },
  'beauty': {
    id: 'beauty',
    displayName: 'Beauty',
    icon: '💄',
    description: 'Salons, spas, barbers, nails, makeup',
    subcategories: ['salon', 'spa', 'barber', 'nail', 'makeup']
  },
  'fitness': {
    id: 'fitness',
    displayName: 'Fitness',
    icon: '💪',
    description: 'Gyms, yoga, pilates, crossfit',
    subcategories: ['gym', 'yoga', 'pilates', 'crossfit', 'personal-training']
  },
  'finance': {
    id: 'finance',
    displayName: 'Finance',
    icon: '💰',
    description: 'Banks, insurance, investments, loans',
    subcategories: ['bank', 'insurance', 'investment', 'loan', 'accounting']
  }
};

// Get all category options for dropdowns
export const getCategoryOptions = () => {
  return Object.values(CATEGORIES).map(cat => ({
    value: cat.id,
    label: cat.displayName,
    icon: cat.icon,
    description: cat.description
  }));
};

// Get category options specifically for feed preferences
export const getCategoryOptionsForFeed = () => {
  return getCategoryOptions();
};

// Get category options for business registration
export const getCategoryOptionsForBusiness = () => {
  return getCategoryOptions();
};

// Helper to get display name from category ID
export const getCategoryDisplayName = (categoryId) => {
  return CATEGORIES[categoryId]?.displayName || categoryId;
};

// Helper to get category icon
export const getCategoryIcon = (categoryId) => {
  return CATEGORIES[categoryId]?.icon || '📌';
};

// Helper to check if a category is valid
export const isValidCategory = (categoryId) => {
  return !!CATEGORIES[categoryId];
};

// Map old display names to new IDs (for migration)
export const mapOldCategoryToId = (oldCategoryName) => {
  const mapping = {
    // Food & Beverage variations
    'Food & Beverage': 'food-beverage',
    'Restaurant': 'food-beverage',
    'restaurants': 'food-beverage',
    'Restaurants/Cafes': 'food-beverage',
    'Cafe': 'food-beverage',
    'Bar': 'food-beverage',
    'Fast Food': 'food-beverage',
    'Bakery': 'food-beverage',
    'Coffee Shop': 'food-beverage',
    'Pizzeria': 'food-beverage',
    'Diner': 'food-beverage',
    'food-beverage': 'food-beverage',

    // Retail variations
    'Retail stores': 'retail',
    'Retail': 'retail',
    'Clothing': 'retail',
    'Electronics': 'retail',
    'Grocery': 'retail',

    // Services variations
    'Services (plumbing, electric, etc.)': 'services',
    'Services': 'services',

    // Entertainment variations
    'Entertainment venues': 'entertainment',
    'Entertainment': 'entertainment',

    // Health & Wellness variations
    'Health & wellness': 'health-wellness',
    'Health & Wellness': 'health-wellness',
    'Health': 'health-wellness'
  };

  return mapping[oldCategoryName] || oldCategoryName;
};

// Get all available category IDs
export const getAllCategoryIds = () => {
  return Object.keys(CATEGORIES);
};

// Get all available display names
export const getAllDisplayNames = () => {
  return Object.values(CATEGORIES).map(cat => cat.displayName);
};