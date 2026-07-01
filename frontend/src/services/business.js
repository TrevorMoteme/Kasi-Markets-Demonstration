// services/business.js - COMPLETE UPDATED FILE WITH FOLLOW/UNFOLLOW FIXES

import { apiService } from './api';

class BusinessService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  resolveMediaUrl(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${this.baseURL}${url}`;
    return `${this.baseURL}/${url}`;
  }

  // Helper to parse operating hours
  parseOperatingHours(hours) {
    if (!hours) return null;
    if (typeof hours === 'object') return hours;
    if (typeof hours === 'string') {
      try {
        return JSON.parse(hours);
      } catch (e) {
        console.error('Failed to parse operating hours:', e);
        return null;
      }
    }
    return null;
  }

  // Helper to parse special hours
  parseSpecialHours(hours) {
    if (!hours) return [];
    if (Array.isArray(hours)) return hours;
    if (typeof hours === 'string') {
      try {
        const parsed = JSON.parse(hours);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse special hours:', e);
        return [];
      }
    }
    return [];
  }

  async getDashboardData() {
    try {
      console.log('🔍 Fetching dashboard data...');
      const response = await apiService.get('/businesses/dashboard');

      if (response.business) {
        response.business.logo_url = this.resolveMediaUrl(response.business.logo_url);
        response.business.background_picture_url = this.resolveMediaUrl(response.business.background_picture_url);
        response.business.operating_hours = this.parseOperatingHours(response.business.operating_hours);
        response.business.special_hours = this.parseSpecialHours(response.business.special_hours);
      }

      return response;
    } catch (error) {
      console.error('❌ Dashboard data error:', error);
      throw error;
    }
  }

  async getMyBusinesses() {
    try {
      const businesses = await apiService.get('/businesses/me');

      return businesses.map(business => ({
        ...business,
        logo_url: this.resolveMediaUrl(business.logo_url),
        background_picture_url: this.resolveMediaUrl(business.background_picture_url),
        operating_hours: this.parseOperatingHours(business.operating_hours),
        special_hours: this.parseSpecialHours(business.special_hours)
      }));
    } catch (error) {
      console.error('Error getting my businesses:', error);
      throw error;
    }
  }

  async createBusiness(businessData) {
    try {
      const dataToSend = { ...businessData };
      const business = await apiService.post('/businesses', dataToSend);

      business.logo_url = this.resolveMediaUrl(business.logo_url);
      business.background_picture_url = this.resolveMediaUrl(business.background_picture_url);
      business.operating_hours = this.parseOperatingHours(business.operating_hours);
      business.special_hours = this.parseSpecialHours(business.special_hours);

      return business;
    } catch (error) {
      console.error('Create business error:', error);
      throw error;
    }
  }

  async getBusiness(businessId) {
    try {
      const business = await apiService.get(`/businesses/${businessId}`);

      business.logo_url = this.resolveMediaUrl(business.logo_url);
      business.background_picture_url = this.resolveMediaUrl(business.background_picture_url);
      business.operating_hours = this.parseOperatingHours(business.operating_hours);
      business.special_hours = this.parseSpecialHours(business.special_hours);

      return business;
    } catch (error) {
      console.error('Get business error:', error);
      throw error;
    }
  }

  async getBusinessWithMedia(businessId) {
    return this.getBusiness(businessId);
  }

  async updateBusiness(businessId, businessData) {
    try {
      console.log('🔄 Updating business:', businessId, businessData);

      const cleanedData = {};
      Object.keys(businessData).forEach(key => {
        if (businessData[key] !== null &&
            businessData[key] !== undefined &&
            businessData[key] !== '') {
          cleanedData[key] = businessData[key];
        }
      });

      if (businessData.tags !== undefined) {
        cleanedData.tags = businessData.tags;
      }

      if (cleanedData.operating_hours && typeof cleanedData.operating_hours === 'object') {
        console.log('📅 operating_hours is already an object, sending as is');
      }

      if (cleanedData.special_hours && typeof cleanedData.special_hours === 'object') {
        console.log('📅 special_hours is already an array/object, sending as is');
      }

      console.log('📤 Sending cleaned update data:', {
        ...cleanedData,
        operating_hours: cleanedData.operating_hours ? 'OBJECT (not stringified)' : 'not present',
        special_hours: cleanedData.special_hours ? 'OBJECT (not stringified)' : 'not present'
      });

      const business = await apiService.put(`/businesses/${businessId}`, cleanedData);

      business.logo_url = this.resolveMediaUrl(business.logo_url);
      business.background_picture_url = this.resolveMediaUrl(business.background_picture_url);
      business.operating_hours = this.parseOperatingHours(business.operating_hours);
      business.special_hours = this.parseSpecialHours(business.special_hours);

      console.log('✅ Business updated with operating_hours:', business.operating_hours);

      return business;
    } catch (error) {
      console.error('Update business error:', error);
      throw error;
    }
  }

  async uploadBusinessLogo(businessId, logoFile) {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await apiService.putFormData(`/businesses/${businessId}/logo`, formData);
      return response;
    } catch (error) {
      console.error('Upload logo error:', error);
      throw error;
    }
  }

  async updateBusinessLogo(businessId, logoFile) {
    return this.uploadBusinessLogo(businessId, logoFile);
  }

  async updateBusinessBackgroundPicture(businessId, backgroundFile) {
    try {
      const formData = new FormData();
      formData.append('background_picture', backgroundFile);

      const response = await apiService.putFormData(`/businesses/${businessId}/background-picture`, formData);
      return response;
    } catch (error) {
      console.error('Update background picture error:', error);
      throw error;
    }
  }

  // ============================================
  // FOLLOW/UNFOLLOW METHODS - FIXED
  // ============================================
  async followBusiness(businessId) {
    try {
      console.log(`🔵 Frontend: Following business ${businessId}`);
      const response = await apiService.post(`/businesses/${businessId}/follow`, {});
      console.log('✅ Follow response:', response);
      return response;
    } catch (error) {
      console.error('❌ Follow business error:', error);
      throw error;
    }
  }

  async unfollowBusiness(businessId) {
    try {
      console.log(`🔴 Frontend: Unfollowing business ${businessId}`);
      const response = await apiService.delete(`/businesses/${businessId}/follow`);
      console.log('✅ Unfollow response:', response);
      return response;
    } catch (error) {
      console.error('❌ Unfollow business error:', error);
      throw error;
    }
  }

  // ============================================
  // SEARCH METHODS
  // ============================================
  async smartSearchBusinesses(searchParams) {
    console.log('🚀 Smart search (text + location only) with params:', searchParams);

    try {
      const startTime = performance.now();
      const query = searchParams.query || '';

      if (!query.trim()) {
        console.warn('⚠️ Empty query provided to smart search');

        if (searchParams.latitude && searchParams.longitude) {
          console.log('📍 Has location - using location-only search');
          return this.locationOnlySearch(searchParams);
        }

        return {
          businesses: [],
          total_count: 0,
          search_type: 'smart_search_empty',
          response_time: 0
        };
      }

      const payload = {
        query: query,
        latitude: searchParams.latitude || null,
        longitude: searchParams.longitude || null,
        max_distance_km: searchParams.max_distance_km || 50,
        limit: searchParams.limit || 20,
        offset: searchParams.offset || 0
      };

      Object.keys(payload).forEach(key => {
        if (key !== 'query' && (payload[key] === '' || payload[key] === null || payload[key] === undefined)) {
          delete payload[key];
        }
      });

      console.log('📤 Sending smart search payload:', payload);

      const response = await apiService.post('/businesses/smart-search', payload);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      console.log(`✅ Smart search completed in ${responseTime}ms, found ${response.businesses?.length || 0} businesses`);

      response.response_time = responseTime;

      if (response.businesses && Array.isArray(response.businesses)) {
        response.businesses = response.businesses.map(business => {
          return {
            ...business,
            logo_url: this.resolveMediaUrl(business.logo_url),
            background_picture_url: this.resolveMediaUrl(business.background_picture_url),
            operating_hours: this.parseOperatingHours(business.operating_hours),
            special_hours: this.parseSpecialHours(business.special_hours)
          };
        });
      }

      return response;
    } catch (error) {
      console.error('❌ Smart search error:', error);
      throw error;
    }
  }

  async locationOnlySearch(searchParams) {
    console.log('📍 Location-only search with params:', searchParams);

    try {
      const startTime = performance.now();

      const payload = {
        latitude: searchParams.latitude || null,
        longitude: searchParams.longitude || null,
        max_distance_km: searchParams.max_distance_km || 50,
        category: searchParams.category,
        city: searchParams.city,
        tags: searchParams.tags,
        limit: searchParams.limit || 20,
        offset: searchParams.offset || 0
      };

      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
        if (key === 'tags' && Array.isArray(payload[key]) && payload[key].length === 0) {
          delete payload[key];
        }
      });

      console.log('📤 Sending location-only search payload:', payload);

      const response = await apiService.post('/businesses/search', payload);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      console.log(`✅ Location-only search completed in ${responseTime}ms, found ${response.businesses?.length || 0} businesses`);

      response.response_time = responseTime;
      response.search_type = 'location_only';

      if (response.businesses && Array.isArray(response.businesses)) {
        response.businesses = response.businesses.map(business => {
          return {
            ...business,
            logo_url: this.resolveMediaUrl(business.logo_url),
            background_picture_url: this.resolveMediaUrl(business.background_picture_url),
            operating_hours: this.parseOperatingHours(business.operating_hours),
            special_hours: this.parseSpecialHours(business.special_hours)
          };
        });
      }

      return response;
    } catch (error) {
      console.error('❌ Location-only search error:', error);
      throw error;
    }
  }

  async legacySearchBusinesses(searchParams) {
    console.log('🔍 Legacy search (with filters) with params:', searchParams);

    try {
      const startTime = performance.now();

      const payload = {
        query: searchParams.query || '',
        category: searchParams.category || '',
        city: searchParams.city || '',
        tags: searchParams.tags || [],
        max_distance_km: searchParams.max_distance_km || 50,
        latitude: searchParams.latitude || null,
        longitude: searchParams.longitude || null,
        limit: searchParams.limit || 20,
        offset: searchParams.offset || 0
      };

      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
        if (key === 'tags' && Array.isArray(payload[key]) && payload[key].length === 0) {
          delete payload[key];
        }
      });

      console.log('📤 Sending legacy search payload (with filters):', payload);

      const response = await apiService.post('/businesses/search', payload);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      console.log(`✅ Legacy search completed in ${responseTime}ms, found ${response.businesses?.length || 0} businesses`);

      response.response_time = responseTime;

      if (response.businesses && Array.isArray(response.businesses)) {
        response.businesses = response.businesses.map(business => {
          return {
            ...business,
            logo_url: this.resolveMediaUrl(business.logo_url),
            background_picture_url: this.resolveMediaUrl(business.background_picture_url),
            operating_hours: this.parseOperatingHours(business.operating_hours),
            special_hours: this.parseSpecialHours(business.special_hours)
          };
        });
      }

      return response;
    } catch (error) {
      console.error('❌ Legacy search error:', error);
      throw error;
    }
  }

  async searchBusinesses(searchParams) {
    console.log('🔍 Unified search with params:', searchParams);

    const hasQuery = searchParams.query && searchParams.query.trim().length > 0;
    const hasLocation = searchParams.latitude && searchParams.longitude;
    const needsComplexFilters = searchParams.category || searchParams.city || (searchParams.tags && Array.isArray(searchParams.tags) && searchParams.tags.length > 0);

    if (!hasQuery) {
      console.warn('⚠️ No search query provided');

      if (hasLocation) {
        console.log('📍 Using location-only search');
        return this.locationOnlySearch(searchParams);
      }

      return {
        businesses: [],
        total_count: 0,
        search_type: 'no_query_no_location',
        response_time: 0
      };
    }

    if (needsComplexFilters) {
      console.log('📋 Using legacy search (with filters)');
      return this.legacySearchBusinesses(searchParams);
    } else {
      console.log('⚡ Using smart search (text + location only)');
      return this.smartSearchBusinesses(searchParams);
    }
  }

  async searchWithType(searchParams, searchType = 'auto') {
    console.log(`🔍 Search with type: ${searchType}`, searchParams);

    if (searchType === 'smart') {
      return this.smartSearchBusinesses(searchParams);
    } else if (searchType === 'legacy') {
      return this.legacySearchBusinesses(searchParams);
    } else if (searchType === 'location') {
      return this.locationOnlySearch(searchParams);
    } else {
      return this.searchBusinesses(searchParams);
    }
  }

  async getTrendingContent(category = null) {
    try {
      const params = category ? { category } : {};
      const trendingContent = await apiService.get('/trending', params);
      return trendingContent;
    } catch (error) {
      console.error('Get trending content error:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const categories = await apiService.get('/categories');
      return categories;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }

  async getCategoryStats() {
    try {
      const stats = await apiService.get('/categories/stats');
      return stats;
    } catch (error) {
      console.error('Get category stats error:', error);
      throw error;
    }
  }

  async getBusinessAnalytics(businessId) {
    try {
      const analytics = await apiService.get(`/businesses/${businessId}/analytics/summary`);
      return analytics;
    } catch (error) {
      console.error('Get business analytics error:', error);
      throw error;
    }
  }

  async getBusinessPosts(businessId, limit = 20, offset = 0) {
    try {
      const params = { limit, offset };
      const posts = await apiService.get(`/businesses/${businessId}/posts`, params);
      return posts;
    } catch (error) {
      console.error('Get business posts error:', error);
      throw error;
    }
  }

  async getTopPosts(businessId, limit = 15) {
    try {
      const params = { limit: limit * 2, offset: 0 };
      const posts = await apiService.get(`/businesses/${businessId}/posts`, params);

      return posts
        .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Get top posts error:', error);
      throw error;
    }
  }

  async getGeocode(address) {
    try {
      const geocode = await apiService.get('/api/geocode', { address });
      return geocode;
    } catch (error) {
      console.error('Geocode error:', error);
      throw error;
    }
  }

  async getReverseGeocode(lat, lng) {
    try {
      const reverseGeocode = await apiService.get('/api/reverse-geocode', { lat, lng });
      return reverseGeocode;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      throw error;
    }
  }

  async uploadBusinessMedia(businessId, files) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await apiService.postFormData(`/upload/business-media/${businessId}/multiple`, formData);
      return response;
    } catch (error) {
      console.error('Upload business media error:', error);
      throw error;
    }
  }
}

export const businessService = new BusinessService();