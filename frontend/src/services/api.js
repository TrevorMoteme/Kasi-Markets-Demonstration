// services/api.js

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Request caching
    this.cache = new Map();
    this.cacheDuration = 30000; // 30 seconds cache

    // Request deduplication
    this.pendingRequests = new Map();

    // Store callbacks for auth errors
    this.onAuthError = null;
    this.onUnauthorized = null;
  }

  // Register callbacks for auth errors
  registerAuthErrorHandler(callback) {
    this.onAuthError = callback;
  }

  registerUnauthorizedHandler(callback) {
    this.onUnauthorized = callback;
  }

  // Get authentication token
  getAuthToken() {
    return localStorage.getItem('access_token');
  }

  // Check if token exists
  hasToken() {
    return !!this.getAuthToken();
  }

  // Get headers with authentication
  getHeaders(includeAuth = true, customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('⚠️ No auth token available for request');
      }
    }

    return headers;
  }

  // Create cache key
  createCacheKey(endpoint, params = {}, includeAuth = true) {
    return `${endpoint}:${JSON.stringify(params)}:${includeAuth}`;
  }

  // Get from cache
  getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  // Set cache
  setCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear specific cache
  clearCache(endpointPattern = null) {
    if (endpointPattern) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(endpointPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    console.log('🧹 Cache cleared:', endpointPattern || 'all');
  }

  // Handle API response with enhanced error logging
  async handleResponse(response) {
    console.log(`📡 API Response: ${response.status} ${response.statusText} - ${response.url}`);

    // Log the response body for debugging (first 500 chars)
    const responseClone = response.clone();
    try {
      const text = await responseClone.text();
      if (text) {
        console.log('📄 Response body preview:', text.substring(0, 500));
      }
    } catch (e) {
      console.log('📄 Could not read response body');
    }

    // If response is 200-299, it's successful
    if (response.ok) {
      try {
        const data = await response.json();
        console.log('✅ API Success - Data received');
        return data;
      } catch (e) {
        console.log('📡 Response is not JSON or empty');
        return {};
      }
    }

    // Handle specific error status codes
    const status = response.status;

    // 422 Validation Error - Request doesn't match Pydantic model
    if (status === 422) {
      console.error('🔴 422 Validation Error - Request doesn\'t match backend model');

      let errorDetail = '';
      let errorFields = [];
      let missingFields = [];

      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData, null, 2);
        console.error('📋 Validation error details:', errorData);

        // Extract which fields are causing issues
        if (errorData.detail && Array.isArray(errorData.detail)) {
          console.error('🔍 Invalid fields:', errorData.detail);

          errorData.detail.forEach(err => {
            if (err.type === 'missing') {
              const field = err.loc?.join('.') || 'unknown';
              missingFields.push(field);
              console.error(`❌ Missing required field: ${field}`);
            } else if (err.loc) {
              errorFields.push(err.loc.join('.'));
            }
          });
        }
      } catch (e) {
        console.error('📋 Could not parse validation error details');
      }

      const error = new Error(`Validation error: ${errorDetail.substring(0, 200)}`);
      error.status = 422;
      error.isValidationError = true;
      error.errorFields = errorFields;
      error.missingFields = missingFields;
      throw error;
    }

    // 401 Unauthorized - Token is invalid/expired
    if (status === 401) {
      console.warn('🔐 401 Unauthorized - Token invalid or expired');

      const error = new Error('Not authenticated');
      error.status = 401;
      error.isAuthError = true;

      if (this.onUnauthorized) {
        this.onUnauthorized(error);
      }

      throw error;
    }

    // 405 Method Not Allowed - Endpoint exists but wrong HTTP method
    if (status === 405) {
      console.warn('⚠️ 405 Method Not Allowed - Endpoint exists but wrong HTTP method');

      const error = new Error('Method Not Allowed');
      error.status = 405;
      error.isMethodError = true;
      error.isAuthError = false;
      throw error;
    }

    // 403 Forbidden - Authenticated but no permission
    if (status === 403) {
      console.warn('🚫 403 Forbidden - No permission');
      const error = new Error('Access forbidden');
      error.status = 403;
      error.isAuthError = false;
      throw error;
    }

    // 404 Not Found
    if (status === 404) {
      console.warn('🔍 404 Not Found - Endpoint does not exist');
      const error = new Error('Resource not found');
      error.status = 404;
      throw error;
    }

    // Handle other errors (400, 500, etc.)
    let errorMessage = `HTTP error ${response.status}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
      console.error('📡 API Error details:', errorData);
    } catch (e) {
      errorMessage = response.statusText || errorMessage;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  // GET request with caching and deduplication
  async get(endpoint, params = {}, includeAuth = true) {
    const cacheKey = this.createCacheKey(endpoint, params, includeAuth);

    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log(`📦 CACHE HIT: ${endpoint}`);
      return cachedData;
    }

    // Check for pending requests (deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`🔄 REQUEST DEDUPLICATION: ${endpoint} - returning existing promise`);
      return this.pendingRequests.get(cacheKey);
    }

    try {
      const url = new URL(`${this.baseURL}${endpoint}`);

      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });

      const requestUrl = url.toString();
      console.log(`📡 GET ${requestUrl}`, includeAuth ? '(with auth)' : '(no auth)');

      // Create request promise
      const requestPromise = fetch(requestUrl, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
        credentials: 'include',
      }).then(response => this.handleResponse(response));

      // Store for deduplication
      this.pendingRequests.set(cacheKey, requestPromise);

      // Process response
      const data = await requestPromise;

      // Cache successful response
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`❌ GET ${endpoint} failed:`, error.message);
      throw error;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  // POST request
  async post(endpoint, data = {}, includeAuth = true) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`📡 POST ${url}`, includeAuth ? '(with auth)' : '(no auth)');
      console.log('📤 Request payload:', JSON.stringify(data, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`❌ POST ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // PUT request
  async put(endpoint, data = {}, includeAuth = true) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`📡 PUT ${url}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
        credentials: 'include',
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`❌ PUT ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // DELETE request
  async delete(endpoint, includeAuth = true) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`📡 DELETE ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
        credentials: 'include',
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`❌ DELETE ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // Form Data POST/PUT (for file uploads)
  async postFormData(endpoint, formData) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`📡 POST FormData ${url}`);

      const headers = {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'include',
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`❌ POST FormData ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  async putFormData(endpoint, formData) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log(`📡 PUT FormData ${url}`);

      const headers = {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: formData,
        credentials: 'include',
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`❌ PUT FormData ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // Smart search specific method - ONLY for text + location
  async smartSearch(searchParams) {
    console.log('🔍 Executing smart search via API...');

    const payload = {
      query: searchParams.query || '',
      latitude: searchParams.latitude || null,
      longitude: searchParams.longitude || null,
      max_distance_km: searchParams.max_distance_km || 50,
      limit: searchParams.limit || 20,
      offset: searchParams.offset || 0
    };

    // Clean up payload - remove empty values
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }
    });

    console.log('📤 Smart search payload (ONLY query + location):', payload);
    return this.post('/businesses/smart-search', payload);
  }

  // Legacy search for complex filters (category, city, tags)
  async legacySearch(searchParams) {
    console.log('🔍 Executing legacy search with complex filters via API...');

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

    // Clean up payload - remove empty values
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
      }

      // Special handling for empty arrays
      if (key === 'tags' && Array.isArray(payload[key]) && payload[key].length === 0) {
        delete payload[key];
      }
    });

    console.log('📤 Legacy search payload (with filters):', payload);
    return this.post('/businesses/search', payload);
  }

  // Unified search method - AUTOMATICALLY chooses correct endpoint
  async searchBusinesses(searchParams) {
    console.log(`🔍 API unified search with params:`, searchParams);

    // Check if we need complex filters
    const needsComplexFilters =
      searchParams.category ||
      searchParams.city ||
      (searchParams.tags && Array.isArray(searchParams.tags) && searchParams.tags.length > 0);

    if (needsComplexFilters) {
      console.log('📋 Using legacy search endpoint (with filters)');
      return this.legacySearch(searchParams);
    } else {
      console.log('⚡ Using smart search endpoint (text + location only)');
      return this.smartSearch(searchParams);
    }
  }

  // Error handling wrapper
  async withErrorHandling(apiCall, errorMessage = 'Request failed') {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`❌ ${errorMessage}:`, error);

      // Check for specific error types
      if (error.isAuthError && error.status === 401) {
        console.warn('🔐 Authentication error detected - NOT clearing storage');
      }

      // Handle 405 errors specially
      if (error.isMethodError && error.status === 405) {
        console.log('⚠️ Method error - endpoint exists but wrong HTTP method');
      }

      // Handle 422 validation errors
      if (error.isValidationError && error.status === 422) {
        console.log('⚠️ Validation error - check payload structure');
        console.log('📋 Invalid fields:', error.errorFields);
        console.log('📋 Missing fields:', error.missingFields);
      }

      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }

      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      console.log('🔍 Testing backend connection...');

      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });

      console.log(`📡 Health check: ${response.status}`);

      if (response.ok) {
        try {
          const data = await response.json();
          return { connected: true, data };
        } catch (e) {
          return { connected: true, data: { message: 'Health check OK' } };
        }
      }

      return { connected: false, error: `Status: ${response.status}` };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { connected: false, error: error.message };
    }
  }

  // Test authentication
  async testAuth() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { authenticated: false, error: 'No token' };
      }

      const response = await fetch(`${this.baseURL}/feed?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log(`🔐 Auth test: ${response.status}`);

      if (response.status === 401) {
        return { authenticated: false, error: 'Token invalid' };
      }

      return { authenticated: true };
    } catch (error) {
      console.error('❌ Auth test failed:', error);
      return { authenticated: false, error: error.message };
    }
  }

  // Get user info with fallback
  async getUserInfo() {
    try {
      return await this.get('/user/me');
    } catch (error) {
      console.log('⚠️ /user/me failed, trying /users/me...');

      try {
        return await this.get('/users/me');
      } catch (error2) {
        console.log('⚠️ All user endpoints failed, using localStorage');

        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('🔄 Using localStorage user:', user.username);
          return user;
        }

        throw new Error('Could not retrieve user information');
      }
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Initialize the API service with global handlers
if (typeof window !== 'undefined') {
  // Register global unauthorized handler
  apiService.registerUnauthorizedHandler((error) => {
    console.log('🌍 Global unauthorized handler triggered');

    if (error.status === 401 && !error.isMethodError) {
      console.log('🧹 Clearing invalid auth data');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  });
}

export default apiService;