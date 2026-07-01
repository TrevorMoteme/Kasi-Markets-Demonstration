// services/feed.js - FIXED: Properly handles /feed/personalized-fast response
import { apiService } from './api';

const feedService = {
  /**
   * ULTRA-FAST personalized feed with distance calculation
   * Uses /feed/personalized-fast endpoint
   * Returns distance_km and distance_display for each post
   */
  async getFastPersonalizedFeed(params = {}) {
    try {
      const queryParams = {
        limit: params.limit || 10,
        offset: params.offset || 0,
        max_distance_km: params.maxDistanceKm || params.max_distance_km || 50,
        preferred_categories: params.preferredCategories || params.preferred_categories || [],
        latitude: params.latitude || null,
        longitude: params.longitude || null,
        use_miles: params.useMiles || params.use_miles || false,
        strict_filtering: params.strictFiltering || params.strict_filtering || false
      };

      // Remove undefined/null values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === null) {
          delete queryParams[key];
        }
      });

      // Convert array to comma-separated string if needed
      if (Array.isArray(queryParams.preferred_categories) && queryParams.preferred_categories.length > 0) {
        queryParams.preferred_categories = queryParams.preferred_categories.join(',');
      } else {
        delete queryParams.preferred_categories;
      }

      console.log('📡 [FEED SERVICE] Fetching fast personalized feed:', queryParams);

      const response = await apiService.get('/feed/personalized-fast', queryParams);

      console.log('✅ [FEED SERVICE] Fast feed response:', {
        postsCount: response?.posts?.length || 0,
        hasMore: response?.has_more || false,
        samplePost: response?.posts?.length > 0 ? {
          hasPost: !!response.posts[0]?.post,
          distance_km: response.posts[0]?.distance_km,
          distance_display: response.posts[0]?.distance_display,
          postId: response.posts[0]?.post?.id || response.posts[0]?.id
        } : null
      });

      // Return the raw response directly - let Feed.js handle processing
      return response;
    } catch (error) {
      console.error('❌ [FEED SERVICE] Get fast personalized feed error:', error);
      throw error;
    }
  },

  /**
   * Legacy method - redirects to fast endpoint
   */
  async getOptimizedFeed(params = {}) {
    return this.getFastPersonalizedFeed(params);
  },

  /**
   * Get user preferences - WITH FALLBACK
   */
  async getPreferences() {
    try {
      console.log('📡 [FEED SERVICE] Fetching preferences from /user/preferences/feed');
      const response = await apiService.get('/user/preferences/feed');

      console.log('✅ [FEED SERVICE] Preferences loaded:', {
        hasData: !!response,
        max_distance_km: response?.max_distance_km,
        hasLocation: !!(response?.home_latitude && response?.home_longitude),
        categories: response?.preferred_categories?.length || 0
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.warn('⚠️ [FEED SERVICE] GET /user/preferences/feed failed:', error.message);

      // Try fallback endpoints
      const fallbackEndpoints = ['/preferences', '/api/preferences', '/profile/preferences'];

      for (const endpoint of fallbackEndpoints) {
        try {
          console.log(`📡 [FEED SERVICE] Trying fallback: ${endpoint}`);
          const response = await apiService.get(endpoint);
          if (response) {
            console.log(`✅ [FEED SERVICE] Preferences loaded from: ${endpoint}`);
            return { success: true, data: response };
          }
        } catch (e) {
          // Continue to next fallback
        }
      }

      // Return default preferences
      console.log('⚠️ [FEED SERVICE] Using default preferences');
      return {
        success: true,
        data: {
          max_distance_km: 50,
          preferred_categories: [],
          enable_distance_prioritization: true,
          enable_category_prioritization: true,
          enabled: true,
          use_miles: false,
          strict_filtering: false,
          home_latitude: null,
          home_longitude: null
        }
      };
    }
  },

  /**
   * Save user preferences
   */
  async savePreferences(preferences) {
    try {
      const response = await apiService.put('/user/preferences/feed', preferences);
      return response;
    } catch (error) {
      console.error('❌ [FEED SERVICE] Save preferences error:', error);
      throw error;
    }
  },

  /**
   * Get regular feed (no personalization)
   */
  async getFeed(limit = 20, offset = 0, hashtag = null, category = null) {
    try {
      const params = { limit, offset };
      if (hashtag) params.hashtag = hashtag;
      if (category) params.category = category;

      const response = await apiService.get('/feed', params);
      return response || { posts: [], has_more: false };
    } catch (error) {
      console.error('❌ [FEED SERVICE] Get feed error:', error);
      throw error;
    }
  },

  /**
   * Get trending content
   */
  async getTrending(params = {}) {
    try {
      const response = await apiService.get('/trending', {
        limit: params.limit || 10,
        category: params.category
      });
      return response;
    } catch (error) {
      console.error('❌ [FEED SERVICE] Get trending error:', error);
      return { hashtags: [], popular_posts: [], upcoming_events: [] };
    }
  },

  /**
   * Clear feed cache
   */
  clearCache(endpoint) {
    apiService.clearCache(endpoint);
  },

  /**
   * Format distance for display
   */
  formatDistance(distanceKm, useMiles = false) {
    if (!distanceKm && distanceKm !== 0) return null;
    if (useMiles) {
      const miles = distanceKm * 0.621371;
      if (miles < 0.1) {
        const feet = Math.round(miles * 5280);
        return `${feet} ft`;
      }
      return `${miles.toFixed(1)} mi`;
    } else {
      if (distanceKm < 1) {
        const meters = Math.round(distanceKm * 1000);
        return `${meters} m`;
      }
      return `${distanceKm.toFixed(1)} km`;
    }
  },

  /**
   * Get distance presets for UI
   */
  getDistancePresets() {
    return [
      { label: "Very Local", value: 1, description: "Within 1km" },
      { label: "Neighborhood", value: 5, description: "Within 5km" },
      { label: "City", value: 20, description: "Within 20km" },
      { label: "Regional", value: 100, description: "Within 100km" },
      { label: "National", value: 1000, description: "Within 1000km" },
      { label: "Continental", value: 5000, description: "Within 5000km" },
      { label: "Global (no limit)", value: 0, description: "Worldwide - show everything" },
      { label: "Custom", value: -1, description: "Set your own distance" }
    ];
  },

  /**
   * Get category presets for UI
   */
  getCategoryPresets() {
    return [
      { label: "Restaurants/Cafes", value: "Restaurants/Cafes", icon: "🍽️" },
      { label: "Retail stores", value: "Retail stores", icon: "🛍️" },
      { label: "Services", value: "Services (plumbing, electric, etc.)", icon: "🔧" },
      { label: "Entertainment", value: "Entertainment venues", icon: "🎬" },
      { label: "Health & wellness", value: "Health & wellness", icon: "💊" }
    ];
  },

  /**
   * Get categories
   */
  async getCategories() {
    try {
      const response = await apiService.get('/categories');
      return response || [];
    } catch (error) {
      console.error('❌ [FEED SERVICE] Get categories error:', error);
      return [];
    }
  },

  /**
   * Get categories stats
   */
  async getCategoriesStats() {
    try {
      const response = await apiService.get('/categories/stats');
      return response || [];
    } catch (error) {
      console.error('❌ [FEED SERVICE] Get categories stats error:', error);
      return [];
    }
  }
};

export default feedService;