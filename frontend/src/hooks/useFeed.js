// src/hooks/useFeed.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import feedService from '../services/feed';

export const useFeed = ({
  selectedCategory = null,
  sortBy = 'relevance',
  strictFiltering = false,
  limit = 10
} = {}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ===== STATE =====
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [preferences, setPreferences] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const isLoadingMore = useRef(false);
  const initialLoadDone = useRef(false);
  const abortControllerRef = useRef(null);

  // ===== PREFERENCE CHECKING =====
  const hasValidPreferences = useCallback(() => {
    if (!preferences) return false;
    if (preferences.enabled === false) return false;

    const hasDistance = preferences.max_distance_km !== undefined;
    const hasLocation = (preferences.home_latitude && preferences.home_longitude) ||
                        (preferences.latitude && preferences.longitude);

    return hasDistance && hasLocation;
  }, [preferences]);

  // ===== LOAD PREFERENCES =====
  const loadPreferences = useCallback(async () => {
    try {
      const cachedPrefs = queryClient.getQueryData(['userPreferences']);
      if (cachedPrefs) {
        setPreferences(cachedPrefs);
        return cachedPrefs;
      }

      const result = await feedService.loadAllFeedData({
        loadPreferences: true,
        loadCategories: false,
        loadTrending: false,
        loadFeed: false
      });

      if (result.success && result.preferences?.data) {
        const prefs = result.preferences.data;
        setPreferences(prefs);
        queryClient.setQueryData(['userPreferences'], prefs);
        return prefs;
      }
      return null;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  }, [queryClient]);

  // ===== ABORT PREVIOUS REQUESTS =====
  const abortPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);

  // ===== LOAD FEED (MAIN) =====
  const loadFeed = useCallback(async (isLoadMore = false, refresh = false) => {
    if (!isAuthenticated) return;
    if (isLoadingMore.current && isLoadMore) return;

    const controller = abortPreviousRequest();

    const prefs = preferences || await loadPreferences();
    const isValid = prefs ? hasValidPreferences() : false;

    if (!isValid) {
      return loadTrendingFeed(isLoadMore, controller);
    }

    isLoadingMore.current = isLoadMore;
    setLoading(true);
    setError(null);

    if (refresh) {
      setPosts([]);
      setOffset(0);
      setHasMore(true);
      setShowSkeleton(true);
    }

    if (isLoadMore) {
      setShowSkeleton(false);
    }

    try {
      const currentOffset = isLoadMore ? offset : 0;

      const locationData = prefs.location || {};
      const lat = locationData.lat || prefs.home_latitude || prefs.latitude;
      const lng = locationData.lng || prefs.home_longitude || prefs.longitude;

      const params = {
        limit: isLoadMore ? limit : Math.min(limit, 8),
        offset: currentOffset,
        maxDistanceKm: prefs.max_distance_km || 50,
        preferredCategories: prefs.preferred_categories || [],
        latitude: lat,
        longitude: lng,
        strictFiltering: strictFiltering,
        category: selectedCategory,
        sortBy: sortBy !== 'relevance' ? sortBy : undefined
      };

      const result = await feedService.getFastPersonalizedFeed(params, controller.signal);

      if (controller.signal.aborted) {
        console.log('⏹️ Request aborted');
        return;
      }

      if (result.success && result.data?.length > 0) {
        const newPosts = result.data;

        setPosts(prev => isLoadMore ? [...prev, ...newPosts] : newPosts);
        setStats(result.feed_summary || null);
        setHasMore(result.has_more || false);
        setOffset(prev => prev + (isLoadMore ? limit : Math.min(limit, 8)));

        if (result.has_more && !isLoadMore) {
          prefetchNextBatch(params);
        }

        setShowSkeleton(false);
      } else if (!isLoadMore) {
        setPosts([]);
        setShowSkeleton(false);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('⏹️ Request aborted');
        return;
      }

      console.error('Feed error:', error);
      setError(error.message);

      if (!isLoadMore) {
        await loadTrendingFeed(false, controller);
      }
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  }, [isAuthenticated, preferences, selectedCategory, sortBy, strictFiltering,
      offset, limit, loadPreferences, hasValidPreferences, abortPreviousRequest]);

  // ===== PREFETCH NEXT BATCH =====
  const prefetchNextBatch = useCallback(async (params) => {
    const nextOffset = (params.offset || 0) + (params.limit || 8);

    try {
      const nextParams = {
        ...params,
        offset: nextOffset,
        limit: 3
      };

      const result = await feedService.getFastPersonalizedFeed(nextParams);

      if (result.success && result.data?.length > 0) {
        queryClient.setQueryData(
          ['feed', 'prefetch', nextOffset],
          result.data
        );
        console.log(`📦 Prefetched ${result.data.length} posts for offset ${nextOffset}`);
      }
    } catch (error) {
      console.debug('Prefetch failed:', error);
    }
  }, [queryClient]);

  // ===== LOAD TRENDING FALLBACK =====
  const loadTrendingFeed = useCallback(async (isLoadMore = false, controller = null) => {
    if (isLoadingMore.current && isLoadMore) return;

    isLoadingMore.current = isLoadMore;
    setLoading(true);
    setError(null);

    if (!isLoadMore) {
      setShowSkeleton(true);
    }

    try {
      const currentOffset = isLoadMore ? offset : 0;
      const response = await feedService.getTrendingFeed({
        limit: isLoadMore ? limit : Math.min(limit, 8),
        offset: currentOffset,
        category: selectedCategory
      }, controller?.signal);

      if (controller && controller.signal.aborted) {
        return;
      }

      const posts = response.posts || [];

      setPosts(prev => isLoadMore ? [...prev, ...posts] : posts);
      setHasMore(response.has_more || false);
      setOffset(prev => prev + (isLoadMore ? limit : Math.min(limit, 8)));
      setShowSkeleton(false);
    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error('Trending feed error:', error);
      setError(error.message);
      setShowSkeleton(false);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  }, [selectedCategory, offset, limit]);

  // ===== REFRESH =====
  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    setPosts([]);
    await loadFeed(false, true);
  }, [loadFeed]);

  // ===== LOAD MORE =====
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    const nextOffset = offset;
    const cachedPrefetch = queryClient.getQueryData(['feed', 'prefetch', nextOffset]);

    if (cachedPrefetch && cachedPrefetch.length > 0) {
      console.log('📦 Using prefetched data');
      setPosts(prev => [...prev, ...cachedPrefetch]);
      setOffset(prev => prev + cachedPrefetch.length);
      setHasMore(cachedPrefetch.length >= limit);
      queryClient.removeQueries(['feed', 'prefetch', nextOffset]);
      return;
    }

    loadFeed(true);
  }, [loading, hasMore, offset, queryClient, loadFeed, limit]);

  // ===== INITIALIZATION =====
  useEffect(() => {
    if (!isAuthenticated || initialLoadDone.current) return;

    const init = async () => {
      setShowSkeleton(true);
      await loadPreferences();
      await loadFeed(false, true);
      initialLoadDone.current = true;
      setIsInitialized(true);
    };

    init();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAuthenticated, loadPreferences, loadFeed]);

  // ===== EXPOSE =====
  return {
    posts,
    stats,
    loading,
    error,
    hasMore,
    preferences,
    showSkeleton,
    hasValidPreferences: hasValidPreferences(),
    isInitialized,
    refresh,
    loadMore,
    setPreferences,
    loadFeed
  };
};