// contexts/BusinessContext.js - COMPLETE UPDATED FILE WITH NO CACHE FOR FOLLOW STATUS

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { businessService } from '../services/business';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

const BusinessContext = createContext();

const businessReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_BUSINESSES':
      return {
        ...state,
        businesses: action.payload,
        hasExistingBusiness: action.payload.length > 0,
        loading: false,
        error: null,
      };
    case 'SET_CURRENT_BUSINESS':
      return {
        ...state,
        currentBusiness: action.payload,
        loading: false,
        error: null,
      };
    case 'ADD_BUSINESS':
      const newBusinesses = [...state.businesses, action.payload];
      return {
        ...state,
        businesses: newBusinesses,
        hasExistingBusiness: true,
        currentBusiness: action.payload,
      };
    case 'UPDATE_BUSINESS':
      const updatedPayload = action.payload;
      console.log('🔄 UPDATE_BUSINESS reducer called');

      let businessToUpdate = updatedPayload;

      if (updatedPayload.business && typeof updatedPayload.business === 'object') {
        console.log('📊 Handling dashboard response format');
        businessToUpdate = updatedPayload.business;
      } else if (!updatedPayload.id && updatedPayload.business) {
        console.log('⚠️ Edge case: business property is not an object');
        businessToUpdate = { id: updatedPayload.business, ...updatedPayload };
      }

      const resolvedBusiness = {
        ...businessToUpdate,
        logo_url: businessToUpdate?.logo_url
          ? businessService.resolveMediaUrl(businessToUpdate.logo_url)
          : null,
        background_picture_url: businessToUpdate?.background_picture_url
          ? businessService.resolveMediaUrl(businessToUpdate.background_picture_url)
          : null,
        operating_hours: businessToUpdate?.operating_hours || null,
        special_hours: businessToUpdate?.special_hours || []
      };

      const updatedBusinesses = state.businesses.map(business =>
        business.id === resolvedBusiness.id ? resolvedBusiness : business
      );

      let updatedCurrentBusiness;
      if (updatedPayload.business && typeof updatedPayload.business === 'object') {
        updatedCurrentBusiness = {
          ...updatedPayload,
          business: resolvedBusiness
        };
      } else {
        updatedCurrentBusiness = resolvedBusiness;
      }

      return {
        ...state,
        businesses: updatedBusinesses,
        currentBusiness: updatedCurrentBusiness,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload.businesses,
        searchTotal: action.payload.total_count,
        searchType: action.payload.search_type || 'advanced',
        searchTags: action.payload.search_tags || [],
        searchResponseTime: action.payload.response_time || null,
        loading: false,
      };
    case 'CLEAR_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: [],
        searchTotal: 0,
        searchType: null,
        searchTags: [],
        searchResponseTime: null,
      };
    case 'SET_TRENDING_CONTENT':
      return { ...state, trendingContent: action.payload, loading: false, error: null };
    default:
      return state;
  }
};

const initialState = {
  businesses: [],
  currentBusiness: null,
  searchResults: [],
  searchTotal: 0,
  searchType: null,
  searchTags: [],
  searchResponseTime: null,
  trendingContent: null,
  hasExistingBusiness: false,
  loading: false,
  error: null,
};

export const BusinessProvider = ({ children }) => {
  const [state, dispatch] = useReducer(businessReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  const cacheRef = useRef({
    dashboard: null,
    lastFetchTime: null,
    businessCache: new Map(),
    fetchingBusinessId: null,
    cacheTimeout: 30 * 1000, // Reduced to 30 seconds (from 5 minutes)
    pendingRequests: new Map()
  });

  const clearCache = useCallback(() => {
    const cache = cacheRef.current;
    cache.dashboard = null;
    cache.lastFetchTime = null;
    cache.businessCache.clear();
    cache.fetchingBusinessId = null;
    console.log('✅ Cache cleared');
  }, []);

  // Invalidate cache for a specific business
  const invalidateBusinessCache = useCallback((businessId) => {
    const cache = cacheRef.current;
    cache.businessCache.delete(businessId);
    if (cache.dashboard?.business?.id === businessId) {
      cache.dashboard = null;
      cache.lastFetchTime = null;
    }
    console.log(`🗑️ Cache invalidated for business: ${businessId}`);
  }, []);

  const loadMyBusinesses = useCallback(async (forceRefresh = false) => {
    if (user?.user_type !== 'business_owner') return;

    const cache = cacheRef.current;
    const now = Date.now();

    if (!forceRefresh && cache.dashboard && cache.lastFetchTime &&
        (now - cache.lastFetchTime) < cache.cacheTimeout) {
      console.log('✅ Returning cached dashboard data');
      dispatch({ type: 'SET_CURRENT_BUSINESS', payload: cache.dashboard });
      dispatch({ type: 'SET_BUSINESSES', payload: [cache.dashboard.business] });
      return cache.dashboard;
    }

    if (cache.pendingRequests.has('dashboard')) {
      console.log('⏳ Dashboard request already in progress');
      return cache.pendingRequests.get('dashboard');
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      console.log('🔍 Loading dashboard data for business...');
      const dashboardResponse = await businessService.getDashboardData();

      if (dashboardResponse && dashboardResponse.business) {
        console.log('✅ Dashboard data loaded successfully');

        cache.dashboard = dashboardResponse;
        cache.lastFetchTime = Date.now();

        dispatch({ type: 'SET_CURRENT_BUSINESS', payload: dashboardResponse });
        dispatch({ type: 'SET_BUSINESSES', payload: [dashboardResponse.business] });

        return dashboardResponse;
      } else {
        console.log('⚠️ Dashboard data incomplete, falling back to businesses/me');

        const businesses = await businessService.getMyBusinesses();
        console.log('Businesses from /me:', businesses);

        dispatch({ type: 'SET_BUSINESSES', payload: businesses });

        if (businesses.length > 0) {
          dispatch({ type: 'SET_CURRENT_BUSINESS', payload: businesses[0] });
          return businesses[0];
        }
      }
    } catch (error) {
      console.error('❌ Error loading business data:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load business data' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      cache.pendingRequests.delete('dashboard');
    }
  }, [user?.user_type]);

  useEffect(() => {
    if (isAuthenticated && user?.user_type === 'business_owner') {
      loadMyBusinesses();
    } else {
      dispatch({ type: 'SET_BUSINESSES', payload: [] });
    }
  }, [isAuthenticated, user, loadMyBusinesses]);

  const checkExistingBusiness = useCallback(async () => {
    try {
      const businesses = await businessService.getMyBusinesses();
      return businesses.length > 0;
    } catch (error) {
      console.error('Error checking existing business:', error);
      return false;
    }
  }, []);

  const createBusiness = useCallback(async (businessData, logoFile = null, backgroundFile = null) => {
    if (state.hasExistingBusiness) {
      throw new Error('You can only create one business per account.');
    }

    clearCache();
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const business = await businessService.createBusiness(businessData);

      if (logoFile) {
        try {
          await businessService.uploadBusinessLogo(business.id, logoFile);
        } catch (logoError) {
          console.warn('Logo upload failed, but business was created:', logoError);
        }
      }

      if (backgroundFile) {
        try {
          await businessService.updateBusinessBackgroundPicture(business.id, backgroundFile);
        } catch (backgroundError) {
          console.warn('Background picture upload failed, but business was created:', backgroundError);
        }
      }

      const updatedBusiness = await businessService.getBusinessWithMedia(business.id);

      cacheRef.current.businessCache.set(business.id, {
        data: updatedBusiness,
        timestamp: Date.now()
      });

      dispatch({ type: 'ADD_BUSINESS', payload: updatedBusiness });
      return { success: true, business: updatedBusiness };
    } catch (error) {
      console.error('❌ Create business error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.hasExistingBusiness, clearCache]);

  // ============================================
  // GET BUSINESS - WITH NO CACHE FOR FOLLOW STATUS
  // ============================================
  const getBusiness = useCallback(async (businessId, forceRefresh = false) => {
    const cache = cacheRef.current;

    // ✅ CRITICAL: Always force refresh for business profile data
    // This ensures follow status and follower counts are always current
    const shouldForceRefresh = forceRefresh || true;

    if (cache.fetchingBusinessId === businessId) {
      console.log('⏳ Already fetching business', businessId);
      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(await getBusiness(businessId, shouldForceRefresh));
        }, 100);
      });
    }

    // ✅ Skip cache entirely for business profile data
    if (!shouldForceRefresh) {
      const cachedBusiness = cache.businessCache.get(businessId);
      if (cachedBusiness) {
        const cacheAge = Date.now() - cachedBusiness.timestamp;
        if (cacheAge < cache.cacheTimeout) {
          console.log('✅ Returning cached business:', businessId);
          if (!state.currentBusiness || state.currentBusiness.business?.id !== businessId) {
            dispatch({ type: 'SET_CURRENT_BUSINESS', payload: cachedBusiness.data });
          }
          return { success: true, business: cachedBusiness.data };
        }
      }
    }

    console.log('🔍 Fetching fresh business data from API (no cache for follow status):', businessId);
    cache.fetchingBusinessId = businessId;
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Try dashboard endpoint first
      try {
        const dashboardResponse = await businessService.getDashboardData();
        if (dashboardResponse && dashboardResponse.business?.id === businessId) {
          console.log('✅ Got business from dashboard endpoint');

          dispatch({ type: 'SET_CURRENT_BUSINESS', payload: dashboardResponse });
          return { success: true, business: dashboardResponse };
        }
      } catch (dashboardError) {
        console.log('Dashboard endpoint failed, trying regular business endpoint');
      }

      // Get fresh business data
      const business = await businessService.getBusinessWithMedia(businessId);
      console.log('✅ Got fresh business from regular endpoint');

      // CRITICAL: Log the follow status from the API response
      console.log('📊 API returned business with is_following:', business.is_following);
      console.log('📊 API returned business with followers_count:', business.followers_count);

      dispatch({ type: 'SET_CURRENT_BUSINESS', payload: business });

      // Don't cache - we want fresh data for follow status
      // cache.businessCache.set(businessId, { data: business, timestamp: Date.now() });

      return { success: true, business: business };
    } catch (error) {
      console.error('❌ Error fetching business:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      cache.fetchingBusinessId = null;
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentBusiness, state.businesses]);

  // ============================================
  // UPDATE BUSINESS - WITH CACHE INVALIDATION
  // ============================================
  const updateBusiness = useCallback(async (businessId, businessData, logoFile = null, backgroundFile = null) => {
    console.log('=== UPDATE BUSINESS CONTEXT ===');
    console.log('Business ID:', businessId);
    console.log('Business data keys:', Object.keys(businessData || {}));
    console.log('Operating hours present:', !!businessData?.operating_hours);
    console.log('Special hours present:', !!businessData?.special_hours);

    if (!businessId || businessId === 'undefined' || businessId === 'null') {
      throw new Error(`Invalid business ID: ${businessId}`);
    }

    // Invalidate cache before update
    invalidateBusinessCache(businessId);

    let cleanedBusinessData = null;
    if (businessData && typeof businessData === 'object') {
      cleanedBusinessData = Object.fromEntries(
        Object.entries(businessData).filter(([_, value]) =>
          value !== '' && value !== null && value !== undefined
        )
      );

      if (cleanedBusinessData.operating_hours === undefined && businessData.operating_hours) {
        cleanedBusinessData.operating_hours = businessData.operating_hours;
      }
      if (cleanedBusinessData.special_hours === undefined && businessData.special_hours) {
        cleanedBusinessData.special_hours = businessData.special_hours;
      }

      if (Object.keys(cleanedBusinessData).length === 0) {
        cleanedBusinessData = null;
      }
    }

    console.log('Cleaned business data (with hours):', {
      ...cleanedBusinessData,
      operating_hours: cleanedBusinessData?.operating_hours ? 'OBJECT (preserved)' : 'NOT PRESENT',
      special_hours: cleanedBusinessData?.special_hours ? 'ARRAY (preserved)' : 'NOT PRESENT'
    });

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      let updatedBusiness = null;
      let shouldFetchUpdatedBusiness = true;

      if (cleanedBusinessData && Object.keys(cleanedBusinessData).length > 0) {
        console.log('🔄 Updating business data with:', cleanedBusinessData);
        try {
          updatedBusiness = await businessService.updateBusiness(businessId, cleanedBusinessData);
          console.log('✅ Business data update response:', updatedBusiness);
          shouldFetchUpdatedBusiness = false;
        } catch (updateError) {
          console.error('❌ Business data update failed:', updateError);
          shouldFetchUpdatedBusiness = (logoFile !== null || backgroundFile !== null);
        }
      } else {
        console.log('⚠️ No business data provided for update, only handling media if provided');
        shouldFetchUpdatedBusiness = (logoFile !== null || backgroundFile !== null);
      }

      if (logoFile) {
        try {
          console.log('🔄 Uploading logo file:', logoFile.name);
          const logoResponse = await businessService.updateBusinessLogo(businessId, logoFile);
          console.log('✅ Logo upload response:', logoResponse);

          if (logoResponse && logoResponse.business && logoResponse.business.logo_url) {
            if (updatedBusiness) {
              updatedBusiness.logo_url = logoResponse.business.logo_url;
            }
            shouldFetchUpdatedBusiness = true;
          }
        } catch (logoError) {
          console.warn('⚠️ Logo upload failed:', logoError.message);
        }
      }

      if (backgroundFile) {
        try {
          console.log('🔄 Uploading background picture file:', backgroundFile.name);
          const backgroundResponse = await businessService.updateBusinessBackgroundPicture(businessId, backgroundFile);
          console.log('✅ Background picture upload response:', backgroundResponse);

          if (backgroundResponse && backgroundResponse.business && backgroundResponse.business.background_picture_url) {
            if (updatedBusiness) {
              updatedBusiness.background_picture_url = backgroundResponse.business.background_picture_url;
            }
            shouldFetchUpdatedBusiness = true;
          }
        } catch (backgroundError) {
          console.warn('⚠️ Background picture upload failed:', backgroundError.message);
        }
      }

      if (shouldFetchUpdatedBusiness || !updatedBusiness) {
        console.log('🔄 Getting updated business data from API...');
        try {
          updatedBusiness = await businessService.getBusinessWithMedia(businessId);
          console.log('✅ Fetched updated business:', updatedBusiness?.name);
        } catch (fetchError) {
          console.error('❌ Failed to fetch updated business:', fetchError);
          if (!updatedBusiness) {
            throw new Error('Failed to update and fetch business data');
          }
        }
      }

      if (!updatedBusiness) {
        throw new Error('No business data received after update');
      }

      console.log('✅ Final business data with operating_hours:', updatedBusiness.operating_hours);

      dispatch({ type: 'UPDATE_BUSINESS', payload: updatedBusiness });

      console.log('✅ Context state updated with business data');

      return { success: true, business: updatedBusiness };
    } catch (error) {
      console.error('❌ Update business error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update business' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [invalidateBusinessCache]);

  const searchBusinesses = useCallback(async (searchParams, searchType = 'advanced') => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      console.log(`🔍 Searching with type: ${searchType}`);

      const results = await businessService.searchBusinesses(searchParams, searchType);

      dispatch({
        type: 'SET_SEARCH_RESULTS',
        payload: {
          ...results,
          search_type: searchType,
          search_tags: searchParams.tags || [],
          response_time: results.response_time || null
        }
      });

      return { success: true, ...results };
    } catch (error) {
      console.error('❌ Search error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, []);

  const clearSearchResults = useCallback(() => {
    dispatch({ type: 'CLEAR_SEARCH_RESULTS' });
  }, []);

  // ============================================
  // FOLLOW/UNFOLLOW METHODS - WITH INSTANT UI UPDATE
  // ============================================
  const followBusiness = useCallback(async (businessId) => {
    try {
      console.log(`🏢 BusinessContext: Following business ${businessId}`);
      const response = await businessService.followBusiness(businessId);
      console.log('🏢 Follow response in context:', response);

      // ✅ Immediately update the current business state
      if (response && response.is_following !== undefined) {
        // Update current business immediately
        if (state.currentBusiness?.id === businessId) {
          const updatedBusiness = {
            ...state.currentBusiness,
            is_following: response.is_following,
            followers_count: response.followers_count
          };
          console.log('🏢 Updating currentBusiness in context to:', {
            is_following: response.is_following,
            followers_count: response.followers_count
          });
          dispatch({ type: 'SET_CURRENT_BUSINESS', payload: updatedBusiness });
        }

        // Also update in businesses array
        if (state.businesses && state.businesses.length > 0) {
          const updatedBusinesses = state.businesses.map(b =>
            b.id === businessId
              ? { ...b, is_following: response.is_following, followers_count: response.followers_count }
              : b
          );
          dispatch({ type: 'SET_BUSINESSES', payload: updatedBusinesses });
        }

        // Invalidate cache for this business
        invalidateBusinessCache(businessId);
      }

      return response;
    } catch (error) {
      console.error('🏢 Follow business error in context:', error);
      throw error;
    }
  }, [state.currentBusiness, state.businesses, invalidateBusinessCache]);

  const unfollowBusiness = useCallback(async (businessId) => {
    try {
      console.log(`🏢 BusinessContext: Unfollowing business ${businessId}`);
      const response = await businessService.unfollowBusiness(businessId);
      console.log('🏢 Unfollow response in context:', response);

      // ✅ Immediately update the current business state
      if (response && response.is_following !== undefined) {
        // Update current business immediately
        if (state.currentBusiness?.id === businessId) {
          const updatedBusiness = {
            ...state.currentBusiness,
            is_following: response.is_following,
            followers_count: response.followers_count
          };
          console.log('🏢 Updating currentBusiness in context to:', {
            is_following: response.is_following,
            followers_count: response.followers_count
          });
          dispatch({ type: 'SET_CURRENT_BUSINESS', payload: updatedBusiness });
        }

        // Also update in businesses array
        if (state.businesses && state.businesses.length > 0) {
          const updatedBusinesses = state.businesses.map(b =>
            b.id === businessId
              ? { ...b, is_following: response.is_following, followers_count: response.followers_count }
              : b
          );
          dispatch({ type: 'SET_BUSINESSES', payload: updatedBusinesses });
        }

        // Invalidate cache for this business
        invalidateBusinessCache(businessId);
      }

      return response;
    } catch (error) {
      console.error('🏢 Unfollow business error in context:', error);
      throw error;
    }
  }, [state.currentBusiness, state.businesses, invalidateBusinessCache]);

  const getTrendingContent = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const trendingContent = await businessService.getTrendingContent();
      dispatch({ type: 'SET_TRENDING_CONTENT', payload: trendingContent });
      return { success: true, ...trendingContent };
    } catch (error) {
      console.error('Error getting trending content:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load trending content' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const setCurrentBusiness = useCallback((business) => {
    dispatch({ type: 'SET_CURRENT_BUSINESS', payload: business });
  }, []);

  const getTopPosts = useCallback(async (businessId, limit = 15) => {
    try {
      const posts = await businessService.getTopPosts(businessId, limit);
      return { success: true, posts };
    } catch (error) {
      console.error('Error getting top posts:', error);
      throw error;
    }
  }, []);

  const value = React.useMemo(() => ({
    ...state,
    createBusiness,
    getBusiness,
    updateBusiness,
    searchBusinesses,
    clearSearchResults,
    followBusiness,
    unfollowBusiness,
    getTrendingContent,
    clearError,
    loadMyBusinesses,
    checkExistingBusiness,
    setCurrentBusiness,
    clearCache,
    invalidateBusinessCache,
    getTopPosts,
  }), [
    state,
    createBusiness,
    getBusiness,
    updateBusiness,
    searchBusinesses,
    clearSearchResults,
    followBusiness,
    unfollowBusiness,
    getTrendingContent,
    clearError,
    loadMyBusinesses,
    checkExistingBusiness,
    setCurrentBusiness,
    clearCache,
    invalidateBusinessCache,
    getTopPosts,
  ]);

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};