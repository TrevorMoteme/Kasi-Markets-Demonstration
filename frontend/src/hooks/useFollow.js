// src/hooks/useFollow.js - PRODUCTION READY with INSTANT optimistic updates
import React, { useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useBusiness } from '../contexts/BusinessContext';

// Cache keys for follow-related data
export const followKeys = {
  all: ['follows'],
  business: (businessId) => ['follows', 'business', businessId],
  user: (userId) => ['follows', 'user', userId],
  count: (businessId) => ['follows', 'count', businessId],
};

export const useFollow = (businessId, initialIsFollowing = false, initialFollowersCount = 0) => {
  const { user } = useAuth();
  const { showToast } = useApp();
  const { followBusiness, unfollowBusiness } = useBusiness();
  const queryClient = useQueryClient();
  const mutationInProgressRef = React.useRef(false);

  // Helper to update all caches containing this business
  const updateBusinessInAllCaches = useCallback((businessId, updater) => {
    console.log(`🔄 Updating business ${businessId} in all caches`);

    // 1. Update React Query cache for this specific business (CRITICAL for useQuery)
    queryClient.setQueryData(['business', businessId], (oldData) => {
      if (!oldData) return oldData;
      const updated = updater(oldData);
      console.log(`📝 Business cache updated: following=${updated.is_following}, followers=${updated.followers_count}`);
      return updated;
    });

    // 2. Update all businesses lists (search results, recommendations, etc.)
    queryClient.setQueriesData({ queryKey: ['businesses'] }, (oldData) => {
      if (!oldData) return oldData;

      if (oldData.pages && Array.isArray(oldData.pages)) {
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            businesses: page.businesses?.map(business =>
              business.id === businessId ? updater(business) : business
            )
          }))
        };
      }

      if (Array.isArray(oldData)) {
        return oldData.map(business =>
          business.id === businessId ? updater(business) : business
        );
      }

      return oldData;
    });

    // 3. Update follow-specific caches
    queryClient.setQueryData(followKeys.business(businessId), (oldData) => {
      if (!oldData) return oldData;
      return updater(oldData);
    });
  }, [queryClient]);

  // Force refetch to ensure consistency
  const forceRefetchAllQueries = useCallback(async () => {
    console.log(`🔄 Force refetching all queries for business ${businessId}`);
    await queryClient.invalidateQueries({ queryKey: ['business', businessId] });
    await queryClient.invalidateQueries({ queryKey: ['businesses'] });
    await queryClient.invalidateQueries({ queryKey: followKeys.all });
    await queryClient.invalidateQueries({ queryKey: followKeys.business(businessId) });
    await queryClient.refetchQueries({ queryKey: ['business', businessId] });
  }, [queryClient, businessId]);

  const mutation = useMutation({
    mutationFn: async ({ action }) => {
      if (mutationInProgressRef.current) {
        console.log('⚠️ Mutation already in progress, skipping');
        throw new Error('Mutation in progress');
      }
      mutationInProgressRef.current = true;

      if (!user) {
        throw new Error('Please login to follow businesses');
      }

      if (!businessId) {
        throw new Error('Business ID is required');
      }

      console.log(`🔄 ${action === 'follow' ? 'Following' : 'Unfollowing'} business ${businessId}`);

      const result = action === 'follow'
        ? await followBusiness(businessId)
        : await unfollowBusiness(businessId);

      return result;
    },

    // 🔥 CRITICAL: This runs BEFORE the API call - UI updates INSTANTLY
    onMutate: async ({ action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['business', businessId] });
      await queryClient.cancelQueries({ queryKey: ['businesses'] });

      // Save previous state for rollback
      const previousBusiness = queryClient.getQueryData(['business', businessId]);
      const previousBusinesses = queryClient.getQueryData(['businesses']);

      // 🔥 Calculate optimistic values - INSTANT UI UPDATE
      const newIsFollowing = action === 'follow';
      const newFollowersCount = newIsFollowing
        ? initialFollowersCount + 1      // 🚀 Instantly increase by 1
        : Math.max(0, initialFollowersCount - 1);  // 🚀 Instantly decrease by 1

      console.log(`⚡ OPTIMISTIC UPDATE: ${newIsFollowing ? 'Following' : 'Unfollowing'} - Count: ${initialFollowersCount} → ${newFollowersCount}`);

      // 🔥 Update all caches optimistically - THIS MAKES UI UPDATE INSTANTLY
      updateBusinessInAllCaches(businessId, (old) => {
        const updated = {
          ...old,
          is_following: newIsFollowing,
          followers_count: newFollowersCount,
        };
        console.log(`📊 Updated business object: is_following=${updated.is_following}, followers_count=${updated.followers_count}`);
        return updated;
      });

      // Also update React Query's follow cache
      queryClient.setQueryData(followKeys.business(businessId), {
        is_following: newIsFollowing,
        followers_count: newFollowersCount,
      });

      return { previousBusiness, previousBusinesses, action };
    },

    onSuccess: async (data, variables, context) => {
      mutationInProgressRef.current = false;
      console.log(`✅ ${variables.action} successful`, data);

      let finalIsFollowing = data?.is_following;
      let finalFollowersCount = data?.followers_count;

      // 🔥 FIX: Handle server returning 0 on successful follow/unfollow
      if (variables.action === 'follow' && data?.is_following === true) {
        if (data?.followers_count === 0 && initialFollowersCount >= 0) {
          finalFollowersCount = initialFollowersCount + 1;
          console.log(`⚠️ Server returned 0 followers on follow, KEEPING optimistic: ${finalFollowersCount}`);
        }
      } else if (variables.action === 'unfollow' && data?.is_following === false) {
        if (data?.followers_count === 0 && initialFollowersCount > 0) {
          finalFollowersCount = Math.max(0, initialFollowersCount - 1);
          console.log(`⚠️ Server returned 0 followers on unfollow, KEEPING optimistic: ${finalFollowersCount}`);
        }
      }

      // Update with final values (ensuring UI stays correct)
      updateBusinessInAllCaches(businessId, (old) => ({
        ...old,
        is_following: finalIsFollowing !== undefined ? finalIsFollowing : old?.is_following,
        followers_count: finalFollowersCount !== undefined ? finalFollowersCount : old?.followers_count,
      }));

      // Show success message
      if (variables.action === 'follow' && !data?.alreadyFollowing) {
        showToast(`Now following ${data?.business_name || 'this business'}`, 'success');
      } else if (variables.action === 'unfollow' && !data?.alreadyUnfollowing) {
        showToast(`Unfollowed ${data?.business_name || 'this business'}`, 'info');
      }

      // Background refresh to ensure consistency (doesn't affect UI)
      await forceRefetchAllQueries();
    },

    onError: async (error, variables, context) => {
      mutationInProgressRef.current = false;
      console.error('❌ Follow/Unfollow failed:', error.message);

      // 🔥 CRITICAL: Rollback to previous state on error
      if (context?.previousBusiness) {
        updateBusinessInAllCaches(businessId, () => context.previousBusiness);
        console.log('🔄 Rolled back to previous state due to error');
      } else {
        // If no previous state, revert to original values
        updateBusinessInAllCaches(businessId, (old) => ({
          ...old,
          is_following: initialIsFollowing,
          followers_count: initialFollowersCount,
        }));
      }

      await forceRefetchAllQueries();

      let errorMessage = 'Failed to update follow status';
      if (error.message?.includes('login')) {
        errorMessage = 'Please login to follow businesses';
        showToast(errorMessage, 'warning');
      } else if (error.message?.includes('own business')) {
        errorMessage = 'You cannot follow your own business';
        showToast(errorMessage, 'warning');
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Your action will be saved when you reconnect.';
        const queue = JSON.parse(localStorage.getItem('offline_follows_queue') || '[]');
        queue.push({
          businessId,
          action: variables.action,
          timestamp: Date.now()
        });
        localStorage.setItem('offline_follows_queue', JSON.stringify(queue));
        showToast(errorMessage, 'warning');
      } else {
        showToast(errorMessage, 'error');
      }
    },
  });

  // Process offline queue on reconnect
  const processOfflineQueue = useCallback(async () => {
    const queue = JSON.parse(localStorage.getItem('offline_follows_queue') || '[]');
    if (queue.length === 0) return;

    console.log(`📱 Processing ${queue.length} offline follow actions`);

    for (const item of queue) {
      try {
        if (item.action === 'follow') {
          await followBusiness(item.businessId);
        } else {
          await unfollowBusiness(item.businessId);
        }
        console.log(`✅ Processed offline ${item.action} for ${item.businessId}`);
      } catch (error) {
        console.error(`❌ Failed to process offline ${item.action}:`, error);
      }
    }

    localStorage.setItem('offline_follows_queue', '[]');
    await forceRefetchAllQueries();
  }, [followBusiness, unfollowBusiness, forceRefetchAllQueries]);

  useEffect(() => {
    window.addEventListener('online', processOfflineQueue);
    return () => window.removeEventListener('online', processOfflineQueue);
  }, [processOfflineQueue]);

  return {
    follow: () => mutation.mutate({ action: 'follow' }),
    unfollow: () => mutation.mutate({ action: 'unfollow' }),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
    processOfflineQueue,
  };
};