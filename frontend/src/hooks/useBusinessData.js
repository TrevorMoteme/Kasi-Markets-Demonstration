// src/hooks/useBusinessData.js - STABLE, NO INFINITE LOOPS
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useRef } from 'react';

export const useBusinessData = (businessId, fallbackData = {}) => {
  const queryClient = useQueryClient();
  const [businessData, setBusinessData] = useState({
    name: fallbackData.name || null,
    logo: fallbackData.logo || null,
    banner: fallbackData.banner || null,
    city: fallbackData.city || null,
    state: fallbackData.state || null,
    address: fallbackData.address || null,
    is_verified: fallbackData.is_verified || false,
    rating: fallbackData.rating || null,
    followers_count: fallbackData.followers_count || 0,
  });

  const [isLoading, setIsLoading] = useState(!fallbackData.name);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const previousBusinessIdRef = useRef(null);
  const updateCountRef = useRef(0);

  // Get business from cache - stable callback
  const getBusinessFromCache = useCallback(() => {
    if (!businessId) return null;
    return queryClient.getQueryData(['business', businessId]);
  }, [businessId, queryClient]);

  // Fetch business data from API
  const fetchBusinessData = useCallback(async () => {
    if (!businessId) return null;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/businesses/${businessId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const business = data.business || data;
        queryClient.setQueryData(['business', businessId], business);
        return business;
      }
    } catch (err) {
      console.error('Failed to fetch business:', err);
      setError(err);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
    return null;
  }, [businessId, queryClient]);

  // Update local state - STABLE, uses fallbackData as base
  const updateStateFromBusiness = useCallback((business) => {
    if (!business) return;

    // Prevent excessive updates (max 3 per business)
    if (updateCountRef.current > 3) return;
    updateCountRef.current++;

    console.log(`📛 [useBusinessData] Updating business ${businessId}:`, business.name);

    setBusinessData({
      name: business.name || fallbackData.name,
      logo: business.logo_url || business.logo || fallbackData.logo,
      banner: business.background_picture_url || business.banner_url || fallbackData.banner,
      city: business.city || fallbackData.city,
      state: business.state || fallbackData.state,
      address: business.address || fallbackData.address,
      is_verified: business.is_verified || fallbackData.is_verified,
      rating: business.rating || fallbackData.rating,
      followers_count: business.followers_count || fallbackData.followers_count,
    });
  }, [businessId, fallbackData]);

  // Reset update count when businessId changes
  useEffect(() => {
    if (previousBusinessIdRef.current !== businessId) {
      updateCountRef.current = 0;
      previousBusinessIdRef.current = businessId;
    }
  }, [businessId]);

  // Main effect for cache subscription
  useEffect(() => {
    if (!businessId) return;

    // Initial load from cache
    const cached = getBusinessFromCache();
    if (cached) {
      updateStateFromBusiness(cached);
      setIsLoading(false);
    } else if (!fallbackData.name) {
      fetchBusinessData().then(business => {
        if (business) updateStateFromBusiness(business);
      });
    } else {
      setIsLoading(false);
    }

    // Subscribe to cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' &&
          event.query.queryKey[0] === 'business' &&
          event.query.queryKey[1] === businessId) {
        const updated = queryClient.getQueryData(['business', businessId]);
        if (updated && updateCountRef.current <= 3) {
          console.log(`🔄 [useBusinessData] Business ${businessId} cache updated`);
          updateStateFromBusiness(updated);
        }
      }
    });

    return () => {
      unsubscribe();
      isMounted.current = false;
    };
  }, [businessId, queryClient, getBusinessFromCache, fetchBusinessData, updateStateFromBusiness, fallbackData.name]);

  // Force refetch
  const forceRefetch = useCallback(async () => {
    console.log(`🔄 [useBusinessData] Force refetching business ${businessId}`);
    queryClient.invalidateQueries({ queryKey: ['business', businessId] });
    const result = await fetchBusinessData();
    if (result) {
      updateStateFromBusiness(result);
    }
    return result;
  }, [businessId, queryClient, fetchBusinessData, updateStateFromBusiness]);

  return {
    ...businessData,
    isLoading,
    error,
    refetch: fetchBusinessData,
    forceRefetch,
    hasLocation: !!(businessData.city || businessData.state || businessData.address),
    getLocationString: () => [businessData.city, businessData.state].filter(Boolean).join(', '),
    getFullAddress: () => [businessData.address, businessData.city, businessData.state].filter(Boolean).join(', '),
  };
};