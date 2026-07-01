// src/pages/post/Feed.js - COMPLETE FIXED VERSION
// Fixed: Race condition - loadFeed now waits for preferences to be set

import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDevice } from '../../hooks/useMediaQuery';
import { useVirtualScroll, useInfiniteScroll } from '../../hooks/useVirtualScroll';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import feedService from '../../services/feed';
import { postsService } from '../../services/posts';
import { analyticsService } from '../../services/analytics';
import { businessService } from '../../services/business';
import { apiService } from '../../services/api';
import FeedSkeleton from './FeedSkeleton';
import './Feed.css';

// Lazy load heavy components for code splitting
const PostCard = lazy(() => import('../../components/post/PostCard'));
const CategoryFilter = lazy(() => import('../../components/common/CategoryFilter'));
const Button = lazy(() => import('../../components/common/Button'));
const LoadingSpinner = lazy(() => import('../../components/common/LoadingSpinner'));
const StoriesBar = lazy(() => import('../../components/stories/StoriesBar'));
const BottomNav = lazy(() => import('../../components/navigation/BottomNav'));

// ===== LOADING MESSAGES =====
const loadingMessages = [
  'Curating your personalized feed...',
  'Finding the best content for you...',
  'Discovering amazing businesses...',
  'Making it special for you...',
  'Loading your community updates...',
  'Connecting you with local gems...',
  'Almost there...',
  'Preparing your experience...'
];

// ===== SKELETON COMPONENT =====
const PostSkeleton = ({ variant = 'default' }) => (
  <div className={`feed-skeleton__card feed-skeleton__card--${variant}`}>
    <div className="feed-skeleton__header">
      <div className="feed-skeleton__avatar" />
      <div className="feed-skeleton__info">
        <div className="feed-skeleton__line feed-skeleton__line--name" />
        <div className="feed-skeleton__line feed-skeleton__line--distance" />
      </div>
    </div>
    <div className="feed-skeleton__image" />
    <div className="feed-skeleton__content">
      <div className="feed-skeleton__line feed-skeleton__line--title" />
      <div className="feed-skeleton__line feed-skeleton__line--subtitle" />
    </div>
  </div>
);

// ===== MAIN FEED COMPONENT =====
const Feed = () => {
  const { showToast } = useApp();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useDevice();
  const queryClient = useQueryClient();

  // ========== STATE DECLARATIONS ==========
  const [state, setState] = useState({
    posts: [],
    hasMore: true,
    loading: false,
    error: null,
    offset: 0,
    selectedCategory: null,
    sortBy: 'relevance',
    preferences: null,
    strictFiltering: false,
    trendingContent: null,
    stories: [],
    storiesLoading: false,
    imageErrors: {},
    isAnyModalOpen: false,
    showSkeleton: true,
    preferencesLoading: true,
    initialLoad: true
  });

  const [feedStats, setFeedStats] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading your feed...');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Refs for performance
  const isLoadingMore = useRef(false);
  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef(null);
  const loadTimeoutRef = useRef(null);
  const loadingIntervalRef = useRef(null);
  const feedLoadedRef = useRef(false); // Track if feed has been loaded

  const limit = 10;

  // ========== ROTATE LOADING MESSAGES ==========
  useEffect(() => {
    const isLoading = state.loading || state.preferencesLoading || state.showSkeleton;

    if (isLoading) {
      let messageIndex = 0;
      setLoadingMessage(loadingMessages[0]);

      loadingIntervalRef.current = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
        setLoadingMessageIndex(messageIndex);
      }, 2500);

      return () => {
        if (loadingIntervalRef.current) {
          clearInterval(loadingIntervalRef.current);
          loadingIntervalRef.current = null;
        }
      };
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      setLoadingMessage('Loading your feed...');
    }
  }, [state.loading, state.preferencesLoading, state.showSkeleton]);

  // ========== VIRTUAL SCROLLING ==========
  const {
    containerRef: virtualContainerRef,
    visibleItems,
    totalHeight,
    isNearBottom
  } = useVirtualScroll(state.posts, {
    itemHeight: isMobile ? 250 : 550,
    overscan: 2,
    scrollThreshold: 200
  });

  // ========== HELPER FUNCTIONS ==========
  const hasValidPreferences = useCallback(() => {
    const prefs = state.preferences;
    console.log('🔍 [hasValidPreferences] Checking:', {
      hasPrefs: !!prefs,
      enabled: prefs?.enabled,
      hasLocation: !!(prefs?.home_latitude && prefs?.home_longitude),
      hasDistance: !!(prefs?.max_distance_km || prefs?.maxDistanceKm),
      prefs
    });

    if (!prefs) return false;
    if (prefs.enabled === false) return false;

    const hasLocation = !!(prefs.home_latitude && prefs.home_longitude);
    const hasDistance = !!(prefs.max_distance_km || prefs.maxDistanceKm);

    const isValid = hasLocation && hasDistance;
    console.log('🔍 [hasValidPreferences] Result:', isValid);
    return isValid;
  }, [state.preferences]);

  const getLocationData = useCallback(() => {
    const prefs = state.preferences;
    if (!prefs) return null;
    const lat = prefs.home_latitude || prefs.latitude;
    const lng = prefs.home_longitude || prefs.longitude;
    if (lat && lng) return { lat: parseFloat(lat), lng: parseFloat(lng) };
    return null;
  }, [state.preferences]);

  const handleAuthError = useCallback((error) => {
    if (error?.message?.includes('401') || error?.message?.includes('unauthorized')) {
      showToast('Your session has expired. Please log in again.', 'error');
      logout();
      navigate('/login');
      return true;
    }
    return false;
  }, [showToast, logout, navigate]);

  const processFeedPosts = useCallback((data) => {
    if (!data || !Array.isArray(data)) return [];

    console.log('📝 [processFeedPosts] Processing posts, count:', data.length);

    return data.map((postItem) => {
      const post = postItem.post || postItem;

      let distanceKm = null;
      let distanceDisplay = null;

      // Extract distance from the item (top level)
      if (postItem.distance_km !== undefined && postItem.distance_km !== null) {
        distanceKm = postItem.distance_km;
        distanceDisplay = postItem.distance_display || null;
      } else if (post.distance_km !== undefined && post.distance_km !== null) {
        distanceKm = post.distance_km;
        distanceDisplay = post.distance_display || null;
      }

      let businessData = {};
      if (post.business && typeof post.business === 'object') {
        businessData = { ...post.business };
      } else if (post.businesses && typeof post.businesses === 'object') {
        businessData = { ...post.businesses };
      } else {
        businessData = {
          id: post.business_id,
          name: post.business_name || 'Business',
          logo: post.business_logo || post.business_logo_url,
          logo_url: post.business_logo_url || post.business_logo,
          category: post.business_category,
          city: post.business_city,
          latitude: post.business_latitude,
          longitude: post.business_longitude
        };
      }

      if (distanceKm) {
        console.log(`📏 [processFeedPosts] Post ${post.id} distance: ${distanceKm}km`);
      }

      return {
        ...post,
        business_id: post.business_id || businessData.id,
        business_name: post.business_name || businessData.name || 'Business',
        business_logo: post.business_logo || post.business_logo_url || businessData.logo || businessData.logo_url,
        business_logo_url: post.business_logo_url || businessData.logo_url || businessData.logo,
        business_category: post.business_category || businessData.category,
        business_city: post.business_city || businessData.city,
        business_latitude: post.business_latitude || businessData.latitude,
        business_longitude: post.business_longitude || businessData.longitude,
        business: businessData,
        distance_km: distanceKm,
        distance_display: distanceDisplay,
        relevance_score: postItem.relevance_score || post.relevance_score || null,
        score_breakdown: postItem.score_breakdown || post.score_breakdown || null,
        category_match: postItem.category_match || post.category_match || false,
        within_distance_range: postItem.within_distance_range || post.within_distance_range || true,
        displayDistance: distanceKm ? feedService.formatDistance(distanceKm, state.preferences?.use_miles || false) : null,
        displayTime: this?._getRelativeTime ? this._getRelativeTime(post.created_at) : null
      };
    });
  }, [state.preferences]);

  const resolveMediaUrl = useCallback((url) => {
    if (!url || url === 'null' || url === 'undefined') return null;
    return businessService.resolveMediaUrl(url);
  }, []);

  const getBusinessInitial = useCallback((businessName) =>
    businessName ? businessName.charAt(0).toUpperCase() : 'B', []);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const getCategoryIcon = useCallback((category) => {
    const icons = {
      'Restaurants/Cafes': '🍽️',
      'Retail stores': '🛍️',
      'Services (plumbing, electric, etc.)': '🔧',
      'Entertainment venues': '🎭',
      'Health & wellness': '🧘'
    };
    return icons[category] || '🪙';
  }, []);

  const preparePostForCard = useCallback((post) => {
    let normalizedPost = { ...post };
    let foundLogo = null;

    if (post.business_logo_url) foundLogo = post.business_logo_url;
    else if (post.business_logo) foundLogo = post.business_logo;

    if (foundLogo && !foundLogo.startsWith('http') && !foundLogo.startsWith('data:')) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      foundLogo = foundLogo.startsWith('/') ? `${baseUrl}${foundLogo}` : `${baseUrl}/${foundLogo}`;
    }

    normalizedPost.business = {
      id: post.business_id || 'unknown',
      name: post.business_name || 'Business',
      logo: foundLogo || null,
      logo_url: foundLogo || null,
    };
    normalizedPost.business_logo = foundLogo;
    normalizedPost.business_logo_url = foundLogo;
    normalizedPost.business_name = post.business_name || 'Business';

    if (post.distance_km !== undefined) {
      normalizedPost.distance_km = post.distance_km;
    }
    if (post.distance_display !== undefined) {
      normalizedPost.distance_display = post.distance_display;
    }

    return normalizedPost;
  }, []);

  // ========== FEED LOADING FUNCTIONS ==========
  const loadFeed = useCallback(async (refresh = false) => {
    console.log('📡 [loadFeed] Called with refresh:', refresh);
    console.log('📡 [loadFeed] Current state.preferences:', state.preferences);

    if (!isAuthenticated) {
      console.log('❌ [loadFeed] Not authenticated, returning');
      return;
    }
    if (isLoadingMore.current) {
      console.log('⏳ [loadFeed] Already loading, returning');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const isValid = hasValidPreferences();
    console.log('📡 [loadFeed] hasValidPreferences:', isValid);

    if (!isValid) {
      console.log('📋 [loadFeed] No valid preferences, loading trending feed');
      await loadTrendingFeed(refresh);
      return;
    }

    console.log('📡 [loadFeed] Loading personalized feed with FAST endpoint');
    isLoadingMore.current = true;

    if (refresh) {
      setState(prev => ({
        ...prev,
        posts: [],
        offset: 0,
        hasMore: true,
        showSkeleton: true,
        loading: true,
        error: null
      }));
    } else {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const locationData = getLocationData();
      const prefs = state.preferences;
      const useMiles = prefs.use_miles || false;

      const params = {
        limit: 10,
        offset: 0,
        maxDistanceKm: prefs.max_distance_km || prefs.maxDistanceKm || 50,
        preferredCategories: prefs.preferred_categories || [],
        useMiles: useMiles,
        latitude: locationData?.lat,
        longitude: locationData?.lng,
        strictFiltering: state.strictFiltering || prefs.strict_filtering || false,
        category: state.selectedCategory || undefined
      };

      console.log('📡 [loadFeed] Calling getFastPersonalizedFeed with params:', params);

      const result = await feedService.getFastPersonalizedFeed(params);

      if (abortControllerRef.current?.signal.aborted) {
        console.log('⏹️ [loadFeed] Request aborted');
        return;
      }

      console.log('📡 [loadFeed] getFastPersonalizedFeed result:', {
        postsCount: result?.posts?.length || 0,
        hasMore: result?.has_more || false,
        samplePost: result?.posts?.length > 0 ? {
          distance_km: result.posts[0]?.distance_km,
          distance_display: result.posts[0]?.distance_display,
          hasPost: !!result.posts[0]?.post
        } : null
      });

      if (result?.posts?.length > 0) {
        const processedPosts = processFeedPosts(result.posts);

        console.log(`✅ [loadFeed] Loaded ${processedPosts.length} posts with distance data`);
        console.log('📏 [loadFeed] Posts with distance:', processedPosts.filter(p => p.distance_km).length);

        setState(prev => ({
          ...prev,
          posts: processedPosts,
          hasMore: result.has_more || false,
          offset: 10,
          showSkeleton: false,
          loading: false
        }));

        feedLoadedRef.current = true;

        try {
          sessionStorage.setItem('feed_cache', JSON.stringify({
            posts: processedPosts.slice(0, 10),
            timestamp: Date.now()
          }));
        } catch (e) {}
      } else {
        console.log('📋 [loadFeed] No posts from personalized feed, falling back to trending');
        await loadTrendingFeed(refresh);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ [loadFeed] Error loading feed:', error);
        if (!handleAuthError(error)) {
          setState(prev => ({
            ...prev,
            error: error.message || 'Failed to load feed',
            showSkeleton: false,
            loading: false
          }));
          await loadTrendingFeed(refresh);
        }
      }
    } finally {
      setState(prev => ({ ...prev, loading: false }));
      isLoadingMore.current = false;
    }
  }, [isAuthenticated, state.preferences, state.selectedCategory, state.sortBy, state.strictFiltering, hasValidPreferences, getLocationData, processFeedPosts, handleAuthError]);

  const loadTrendingFeed = useCallback(async (refresh = false) => {
    if (!isAuthenticated) return;
    if (isLoadingMore.current) return;

    console.log('📡 [loadTrendingFeed] Loading trending feed...');
    isLoadingMore.current = true;

    if (refresh) {
      setState(prev => ({
        ...prev,
        posts: [],
        offset: 0,
        hasMore: true,
        showSkeleton: true,
        loading: true,
        error: null
      }));
    } else {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const response = await postsService.getFeed(10, 0, null, state.selectedCategory);
      const posts = response?.posts || [];
      const hasMore = response?.has_more || false;

      console.log(`📡 [loadTrendingFeed] Loaded ${posts.length} trending posts`);

      setState(prev => ({
        ...prev,
        posts: posts,
        hasMore: hasMore,
        offset: 10,
        showSkeleton: false,
        loading: false,
        error: null
      }));

      feedLoadedRef.current = true;

      try {
        sessionStorage.setItem('feed_cache', JSON.stringify({
          posts: posts.slice(0, 10),
          timestamp: Date.now()
        }));
      } catch (e) {}

      if (!state.trendingContent) {
        try {
          const trendingData = await analyticsService.getTrendingContent(state.selectedCategory);
          if (trendingData) {
            setState(prev => ({ ...prev, trendingContent: trendingData }));
          }
        } catch (e) {
          console.log('⚠️ Could not load trending analytics');
        }
      }
    } catch (error) {
      console.error('❌ [loadTrendingFeed] Error:', error);
      if (!handleAuthError(error)) {
        setState(prev => ({
          ...prev,
          error: 'Failed to load content',
          showSkeleton: false,
          loading: false
        }));
        showToast('Failed to load feed', 'error');
      }
    } finally {
      setState(prev => ({ ...prev, loading: false }));
      isLoadingMore.current = false;
    }
  }, [isAuthenticated, state.selectedCategory, state.trendingContent, handleAuthError, showToast]);

  // ===== INFINITE SCROLL =====
  const loadMorePosts = useCallback(async () => {
    if (state.loading || !state.hasMore) return;
    console.log('📡 Loading more posts...');
  }, [state.loading, state.hasMore]);

  const { sentinelRef, isFetching } = useInfiniteScroll(loadMorePosts, state.hasMore, state.loading);

  const refreshFeed = useCallback(() => {
    console.log('🔄 Refreshing feed...');
    // Clear cache before refreshing
    sessionStorage.removeItem('feed_cache');
    feedLoadedRef.current = false;
    loadFeed(true);
  }, [loadFeed]);

  // ===== HANDLERS =====
  const goToPreferences = useCallback(() => {
    navigate('/preferences');
  }, [navigate]);

  const handleCategoryChange = useCallback((category) => {
    setState(prev => ({
      ...prev,
      selectedCategory: category,
      posts: [],
      offset: 0,
      hasMore: true,
      showSkeleton: true
    }));
    feedService.clearCache('feed');
    feedLoadedRef.current = false;
    loadFeed(true);
  }, [loadFeed]);

  const handleSortChange = useCallback((sortType) => {
    setState(prev => ({ ...prev, sortBy: sortType }));
    refreshFeed();
    showToast(`Sorting by ${sortType}`, 'info');
  }, [refreshFeed, showToast]);

  const handlePostUpdate = useCallback(() => {
    refreshFeed();
  }, [refreshFeed]);

  const handleRetry = useCallback(() => {
    refreshFeed();
  }, [refreshFeed]);

  const handleImageError = useCallback((id, type = 'post') => {
    setState(prev => ({
      ...prev,
      imageErrors: { ...prev.imageErrors, [`${type}_${id}`]: true }
    }));
  }, []);

  const handleStoryClick = useCallback((story) => {
    if (story.postId) navigate(`/post/${story.postId}`);
    else if (story.businessId) navigate(`/business/${story.businessId}`);
  }, [navigate]);

  // ===== INSTANT LOAD FROM CACHE =====
  const loadFromCache = useCallback(() => {
    try {
      const cached = sessionStorage.getItem('feed_cache');
      if (cached) {
        const { posts, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 300000) {
          setState(prev => ({
            ...prev,
            posts: posts,
            loading: false,
            showSkeleton: false
          }));
          feedLoadedRef.current = true;
          return true;
        }
      }
    } catch (e) {}
    return false;
  }, []);

  // ===== PREFERENCES LISTENER =====
  useEffect(() => {
    const handlePreferencesUpdated = (event) => {
      console.log('🎯 Preferences updated event:', event.detail);
      if (event.detail?.preferences) {
        setState(prev => ({
          ...prev,
          preferences: event.detail.preferences,
          strictFiltering: event.detail.preferences.strict_filtering || false
        }));
        // Clear cache and reload when preferences change
        sessionStorage.removeItem('feed_cache');
        feedLoadedRef.current = false;
        setTimeout(() => refreshFeed(), 300);
      }
    };

    window.addEventListener('preferences-updated', handlePreferencesUpdated);
    return () => {
      window.removeEventListener('preferences-updated', handlePreferencesUpdated);
    };
  }, [refreshFeed]);

  // ===== MODAL SCROLL LOCK =====
  useEffect(() => {
    const handleModalOpen = () => {
      setState(prev => ({ ...prev, isAnyModalOpen: true }));
      document.body.classList.add('modal-open');
    };
    const handleModalClose = () => {
      setState(prev => ({ ...prev, isAnyModalOpen: false }));
      document.body.classList.remove('modal-open');
    };
    window.addEventListener('post-modal-open', handleModalOpen);
    window.addEventListener('post-modal-close', handleModalClose);
    return () => {
      window.removeEventListener('post-modal-open', handleModalOpen);
      window.removeEventListener('post-modal-close', handleModalClose);
      document.body.classList.remove('modal-open');
    };
  }, []);

  // ===== INITIAL LOAD - FIXED RACE CONDITION =====
  useEffect(() => {
    if (!isAuthenticated || initialLoadDone.current) return;

    let isMounted = true;

    const initializeFeed = async () => {
      console.log('🚀 [initializeFeed] Starting feed initialization...');

      if (!isMounted) return;

      setState(prev => ({ ...prev, preferencesLoading: true, showSkeleton: true }));

      const hasCache = loadFromCache();
      console.log('🚀 [initializeFeed] Cache found:', hasCache);

      try {
        // STEP 1: Load preferences
        console.log('📡 [initializeFeed] Fetching preferences...');
        const prefsResult = await feedService.getPreferences();

        console.log('📡 [initializeFeed] Preferences result:', {
          success: prefsResult?.success,
          hasData: !!prefsResult?.data
        });

        if (!isMounted) return;

        if (prefsResult?.success && prefsResult?.data) {
          const prefs = prefsResult.data;

          // STEP 2: Set preferences in state
          setState(prev => ({
            ...prev,
            preferences: prefs,
            strictFiltering: prefs.strict_filtering || false,
            preferencesLoading: false
          }));
          console.log('✅ [initializeFeed] Preferences loaded and set in state');

          // STEP 3: Load trending content (optional)
          try {
            console.log('📡 [initializeFeed] Loading trending content...');
            const trendingData = await analyticsService.getTrendingContent();
            if (trendingData && isMounted) {
              setState(prev => ({ ...prev, trendingContent: trendingData }));
              console.log('✅ [initializeFeed] Trending content loaded');
            }
          } catch (e) {
            console.log('⚠️ [initializeFeed] Could not load trending:', e.message);
          }

          // STEP 4: Load feed - BUT WAIT for state to update!
          if (!hasCache && isMounted) {
            console.log('📡 [initializeFeed] No cache, waiting for state update then loading feed...');

            // Critical fix: Wait for the state to actually update
            // Use a setTimeout to let React batch the state updates
            await new Promise(resolve => {
              // Use setState callback pattern to ensure state is updated
              setState(prev => {
                // This callback runs after state is updated
                console.log('📡 [initializeFeed] State updated with preferences, now loading feed');
                return prev;
              });
              // Small delay to ensure React has processed the update
              setTimeout(resolve, 100);
            });

            if (isMounted && !feedLoadedRef.current) {
              console.log('📡 [initializeFeed] Now calling loadFeed with fresh preferences');
              // Use a fresh callback to ensure we have the latest state
              await loadFeed(false);
            }
          } else {
            console.log('📡 [initializeFeed] Using cached posts');
          }
        } else {
          console.log('⚠️ [initializeFeed] No preferences found, using default');
          setState(prev => ({
            ...prev,
            preferences: null,
            preferencesLoading: false
          }));

          if (!hasCache && isMounted) {
            await loadTrendingFeed(false);
          }
        }
      } catch (error) {
        console.error('❌ [initializeFeed] Error initializing feed:', error);
        if (!hasCache && isMounted) {
          setState(prev => ({ ...prev, preferencesLoading: false }));
          await loadTrendingFeed(false);
        }
      } finally {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            showSkeleton: false,
            initialLoad: false
          }));
          initialLoadDone.current = true;
          console.log('✅ [initializeFeed] Feed initialization complete');
        }
      }
    };

    const timer = setTimeout(initializeFeed, 50);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isAuthenticated, loadFeed, loadTrendingFeed, loadFromCache]);

  // ===== DETERMINE DISPLAY POSTS =====
  const hasPreferences = hasValidPreferences();
  const isLoading = state.loading || state.preferencesLoading;
  const hasFeedPosts = state.posts.length > 0;
  const shouldShowSetupPrompt = !state.preferencesLoading && !hasPreferences && !isLoading && !hasFeedPosts;

  let displayPosts = state.posts || [];

  console.log('📊 [Feed Render] State summary:', {
    hasPreferences,
    isLoading,
    hasFeedPosts,
    shouldShowSetupPrompt,
    postsCount: state.posts.length,
    preferences: state.preferences,
    feedLoaded: feedLoadedRef.current
  });

  // ========== RENDER HELPERS ==========
  const SetupPromptState = () => (
    <div className="feed__setup-prompt">
      <div className="feed__setup-icon">🎯</div>
      <h3 className="feed__setup-title">What are you looking for?</h3>
      <p className="feed__setup-message">
        Personalize your feed to see content that matters to you.
        Set your location, preferred categories, and distance range to get started.
      </p>
      <div className="feed__setup-actions">
        <Suspense fallback={<div>Loading...</div>}>
          <button className="btn-primary" onClick={goToPreferences}>
            Customize Your Feed
          </button>
          <button className="btn-outline" onClick={refreshFeed}>
            Continue with Trending
          </button>
        </Suspense>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="feed__personalized-empty">
      <div className="feed__personalized-empty-icon">📭</div>
      <h3 className="feed__personalized-empty-title">No posts found</h3>
      <p className="feed__personalized-empty-message">
        {hasPreferences
          ? "Try adjusting your preferences or selecting a different category"
          : "Check back later for more content"}
      </p>
      {hasPreferences && (
        <Suspense fallback={<div>Loading...</div>}>
          <button className="btn-outline" onClick={goToPreferences}>
            Adjust Preferences
          </button>
        </Suspense>
      )}
    </div>
  );

  // ========== MAIN RENDER ==========
  if (!isAuthenticated) {
    return (
      <div className="feed">
        <div className="feed__container">
          <div className="feed__main">
            <div className="feed__header">
              <h1 className="feed__title">Welcome to KASI!</h1>
              <div className="feed__subtitle">Connect with local businesses and discover amazing content</div>
            </div>
            <div className="feed__auth-prompt">
              <div className="feed__prompt-content">
                <div className="feed__prompt-icon">🌟</div>
                <h3>Join the Community</h3>
                <p>Log in to see personalized content from businesses you follow</p>
              </div>
              <div className="feed__auth-actions">
                <Suspense fallback={<div>Loading...</div>}>
                  <button className="btn-primary" onClick={() => navigate('/login')}>Log In</button>
                  <button className="btn-outline" onClick={() => navigate('/register')}>Create Account</button>
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.error && !isLoading && displayPosts.length === 0 && !shouldShowSetupPrompt) {
    const errorMessage = typeof state.error === 'string' ? state.error : state.error?.message || 'An unknown error occurred';
    return (
      <div className="feed">
        <div className="feed__container">
          <div className="feed__main">
            <div className="feed__header">
              <h1 className="feed__title">{getGreeting()}, {user?.username || 'there'}!</h1>
            </div>
            <div className="feed__error">
              <div className="feed__error-icon">⚠️</div>
              <h3 className="feed__error-title">Unable to Load Feed</h3>
              <div className="feed__error-message">{errorMessage}</div>
              <div className="feed__error-actions">
                <Suspense fallback={<div>Loading...</div>}>
                  <button className="btn-primary" onClick={handleRetry}>Try Again</button>
                  <button className="btn-outline" onClick={goToPreferences}>Customize Feed</button>
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`feed ${state.isAnyModalOpen ? 'feed--modal-open' : ''}`}>
      <div className="feed__container">
        <div className="feed__layout">
          {/* LEFT SIDEBAR */}
          <div className="feed__sidebar feed__sidebar--left">
            <div className="feed__sidebar-section">
              <div className="feed__sidebar-header">
                <h3 className="feed__sidebar-title feed__sidebar-title--compact">
                  <span className="feed__sidebar-icon">📂</span> Categories
                </h3>
                {state.selectedCategory && (
                  <Suspense fallback={<span>Clear</span>}>
                    <button className="btn-text" onClick={() => handleCategoryChange(null)}>Clear</button>
                  </Suspense>
                )}
              </div>
              <Suspense fallback={<div className="feed__sidebar-skeleton" />}>
                <CategoryFilter
                  selectedCategory={state.selectedCategory}
                  onCategoryChange={handleCategoryChange}
                  showCounts={true}
                  className="feed__category-filter"
                />
              </Suspense>
            </div>
            <div className="feed__sidebar-section">
              <h3 className="feed__sidebar-title">Your Activity</h3>
              <div className="feed__user-stats">
                <div className="feed__stat-item">
                  <div className="feed__stat-value">{user?.following_count || 0}</div>
                  <div className="feed__stat-label">Following</div>
                </div>
                <div className="feed__stat-item">
                  <div className="feed__stat-value">{user?.posts_count || 0}</div>
                  <div className="feed__stat-label">Posts</div>
                </div>
                <div className="feed__stat-item">
                  <div className="feed__stat-value">{user?.saved_posts_count || 0}</div>
                  <div className="feed__stat-label">Saved</div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="feed__main">
            {isMobile && !shouldShowSetupPrompt && (
              <div className="feed__stories-bar">
                <Suspense fallback={<div className="feed__stories-skeleton" />}>
                  <StoriesBar
                    stories={state.stories}
                    popularPosts={state.trendingContent?.popular_posts || []}
                    loading={state.storiesLoading}
                    onStoryClick={handleStoryClick}
                  />
                </Suspense>
              </div>
            )}

            <div className="feed__controls">
              <div className="feed__sort-controls">
                <select
                  className="feed__sort-select"
                  value={state.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="recent">Sort by Recent</option>
                  <option value="popular">Sort by Popular</option>
                </select>
              </div>
            </div>

            {state.selectedCategory && (
              <div className="feed__category-badge">
                <span className="feed__category-icon">{getCategoryIcon(state.selectedCategory)}</span>
                <span className="feed__category-label">{state.selectedCategory}</span>
                <button
                  className="feed__category-clear"
                  onClick={() => handleCategoryChange(null)}
                  title="Clear category filter"
                >
                  ×
                </button>
              </div>
            )}

            {shouldShowSetupPrompt && <SetupPromptState />}

            {state.showSkeleton && !shouldShowSetupPrompt && (
              <>
                <FeedSkeleton count={5} variant={isMobile ? 'mobile' : 'default'} />
                <div className="feed__loading-message">{loadingMessage}</div>
              </>
            )}

            {isLoading && !state.showSkeleton && displayPosts.length > 0 && (
              <div className="feed__loading-more">
                <Suspense fallback={<div>Loading...</div>}>
                  <LoadingSpinner size="small" />
                </Suspense>
                <p>{loadingMessage}</p>
              </div>
            )}

            {!shouldShowSetupPrompt && displayPosts.length > 0 && (
              <div ref={virtualContainerRef} className="feed__scrollable-content">
                <div style={{ height: totalHeight, position: 'relative' }}>
                  {visibleItems.map((post, index) => {
                    const preparedPost = preparePostForCard(post);
                    const isPersonalized = hasPreferences && state.posts.length > 0;

                    return (
                      <div
                        key={post._key || post.id}
                        style={{
                          position: 'absolute',
                          top: post._offsetY || 0,
                          left: 0,
                          right: 0,
                          height: isMobile ? 250 : 550
                        }}
                      >
                        <Suspense fallback={<PostSkeleton variant={isMobile ? 'mobile' : 'default'} />}>
                          <PostCard
                            post={preparedPost}
                            allPosts={displayPosts}
                            currentPostIndex={post._virtualIndex || index}
                            showBusinessInfo={true}
                            showScore={!isMobile && isPersonalized}
                            scoreData={isPersonalized ? {
                              relevance_score: post.relevance_score,
                              distance_km: post.distance_km,
                              score_breakdown: post.score_breakdown
                            } : null}
                            useMiles={state.preferences?.use_miles || false}
                            showDistanceBadge={true}
                            variant={isMobile ? 'linkedin' : 'default'}
                            onUpdate={handlePostUpdate}
                            isTrending={!isPersonalized}
                            trendingRank={!isPersonalized ? (post._virtualIndex || index) + 1 : null}
                          />
                        </Suspense>
                      </div>
                    );
                  })}
                </div>
                <div ref={sentinelRef} style={{ height: 1 }} />
              </div>
            )}

            {!shouldShowSetupPrompt && !isLoading && !state.showSkeleton && displayPosts.length === 0 && <EmptyState />}
          </div>

          {/* RIGHT SIDEBAR - Popular Posts */}
          <div className="feed__sidebar feed__sidebar--right">
            {state.trendingContent && state.trendingContent.popular_posts &&
             state.trendingContent.popular_posts.length > 0 && (
              <div className="feed__sidebar-section">
                <div className="feed__sidebar-header">
                  <h3 className="feed__sidebar-title">
                    {state.selectedCategory ? `Popular in ${state.selectedCategory}` : '🔥 Popular Posts'}
                  </h3>
                  <Suspense fallback={<span>🔄</span>}>
                    <button className="btn-text" onClick={refreshFeed}>🔄</button>
                  </Suspense>
                </div>
                <div className="feed__popular-posts">
                  {state.trendingContent.popular_posts.slice(0, 5).map((post, index) => {
                    let thumbnailUrl = null;
                    if (post.business_logo) {
                      thumbnailUrl = resolveMediaUrl(post.business_logo);
                    } else if (post.business_logo_url) {
                      thumbnailUrl = resolveMediaUrl(post.business_logo_url);
                    } else if (post.businesses?.logo_url) {
                      thumbnailUrl = resolveMediaUrl(post.businesses.logo_url);
                    }

                    const hasThumbnail = thumbnailUrl && !state.imageErrors[`popular_${post.id}`];
                    const businessInitial = getBusinessInitial(post.business_name);
                    const isVerified = post.is_verified || post.business?.is_verified || false;

                    const handlePopularClick = () => {
                      if (post.business_id) {
                        navigate(`/business/${post.business_id}`);
                      }
                    };

                    return (
                      <React.Fragment key={post.id}>
                        {index > 0 && <div className="feed__popular-divider" />}
                        <div
                          className="feed__popular-item"
                          onClick={handlePopularClick}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handlePopularClick();
                            }
                          }}
                        >
                          <span className="feed__popular-rank">#{index + 1}</span>

                          <div className="feed__popular-thumbnail">
                            {hasThumbnail ? (
                              <img
                                src={thumbnailUrl}
                                alt={`${post.business_name} logo`}
                                onError={() => handleImageError(post.id, 'popular')}
                                loading="lazy"
                              />
                            ) : (
                              <div className="feed__popular-thumbnail-placeholder">
                                {businessInitial}
                              </div>
                            )}
                          </div>

                          <div className="feed__popular-content">
                            <div className="feed__popular-business">
                              {post.business_name}
                              {isVerified && (
                                <span className="feed__popular-verified">✓</span>
                              )}
                            </div>
                            <div className="feed__popular-title">
                              {post.title || 'Untitled'}
                            </div>
                            <div className="feed__popular-stats">
                              <span className="feed__popular-stat">
                                ❤️ {post.likes_count || 0}
                              </span>
                              {post.comments_count > 0 && (
                                <span className="feed__popular-stat">
                                  💬 {post.comments_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="feed__sidebar-section">
              <h3 className="feed__sidebar-title">Your Activity</h3>
              <div className="feed__user-stats">
                <div className="feed__stat-item">
                  <div className="feed__stat-value">{user?.following_count || 0}</div>
                  <div className="feed__stat-label">Following</div>
                </div>
                <div className="feed__stat-item">
                  <div className="feed__stat-value">{user?.posts_count || 0}</div>
                  <div className="feed__stat-label">Posts</div>
                </div>
                <div className="feed__stat-item">
                  <div className="feed__stat-value">{user?.saved_posts_count || 0}</div>
                  <div className="feed__stat-label">Saved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobile && location.pathname === '/feed' && (
        <Suspense fallback={null}>
          <BottomNav
            onCreateClick={() => navigate('/business/create')}
            onSearchClick={() => navigate('/business/search')}
            onPreferencesClick={goToPreferences}
          />
        </Suspense>
      )}
    </div>
  );
};

export default React.memo(Feed);