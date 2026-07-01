// src/hooks/usePostLike.js - COMPLETELY FIXED
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import postsService from '../services/posts';

// Cache keys
export const postKeys = {
  all: ['posts'],
  detail: (id) => ['posts', 'detail', id],
  feed: (type) => ['posts', 'feed', type],
  business: (businessId) => ['posts', 'business', businessId],
  trending: ['posts', 'trending'],
};

export const usePostLike = (postId, currentIsLiked, currentLikesCount) => {
  const { user } = useAuth();
  const { showToast } = useApp();
  const queryClient = useQueryClient();
  const mutationInProgressRef = React.useRef(false);

  const forceRefetchAllQueries = async () => {
    console.log(`🔄 Force refetching all queries for post ${postId}`);
    await queryClient.invalidateQueries({ queryKey: ['posts'] });
    await queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    await queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
    await queryClient.invalidateQueries({ queryKey: ['posts', 'business'] });
    await queryClient.invalidateQueries({ queryKey: postKeys.trending });
    await queryClient.refetchQueries({ queryKey: postKeys.detail(postId) });
    await queryClient.refetchQueries({ queryKey: ['posts', 'feed'] });
  };

  const updatePostInAllCaches = (postId, updater) => {
    const existingPost = queryClient.getQueryData(postKeys.detail(postId));
    if (existingPost) {
      const updatedPost = updater(existingPost);
      console.log(`📝 Updating detail cache: ${existingPost.is_liked} → ${updatedPost.is_liked}, ${existingPost.likes_count} → ${updatedPost.likes_count}`);
      queryClient.setQueryData(postKeys.detail(postId), updatedPost);
    }

    const feedTypes = ['all', 'personalized', 'personalized-fast', 'trending'];
    feedTypes.forEach(type => {
      queryClient.setQueryData(postKeys.feed(type), (oldData) => {
        if (!oldData) return oldData;
        if (oldData.posts && Array.isArray(oldData.posts)) {
          return {
            ...oldData,
            posts: oldData.posts.map(post =>
              post.id === postId ? updater(post) : post
            )
          };
        }
        if (oldData.pages && Array.isArray(oldData.pages)) {
          return {
            ...oldData,
            pages: oldData.pages.map(page => ({
              ...page,
              posts: page.posts?.map(post =>
                post.id === postId ? updater(post) : post
              )
            }))
          };
        }
        return oldData;
      });
    });

    queryClient.setQueriesData({ queryKey: ['posts', 'business'] }, (oldData) => {
      if (!oldData) return oldData;
      if (Array.isArray(oldData)) {
        return oldData.map(post =>
          post.id === postId ? updater(post) : post
        );
      }
      if (oldData.pages && Array.isArray(oldData.pages)) {
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            posts: page.posts?.map(post =>
              post.id === postId ? updater(post) : post
            )
          }))
        };
      }
      return oldData;
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (mutationInProgressRef.current) {
        console.log('⚠️ Mutation already in progress, skipping');
        throw new Error('Mutation in progress');
      }
      mutationInProgressRef.current = true;

      if (!user) {
        throw new Error('Please login to like posts');
      }

      if (!postId) {
        throw new Error('Post ID is required');
      }

      // CRITICAL FIX: Use postsService.toggleLike which handles the logic correctly
      console.log(`🔄 Toggling like for post ${postId}, current state: ${currentIsLiked ? 'liked' : 'not liked'}`);
      return await postsService.toggleLike(postId, currentIsLiked);
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: postKeys.detail(postId) });
      await queryClient.cancelQueries({ queryKey: ['posts', 'feed'] });

      const previousPost = queryClient.getQueryData(postKeys.detail(postId));

      const newIsLiked = !currentIsLiked;
      const newLikesCount = newIsLiked
        ? (currentLikesCount || 0) + 1
        : Math.max(0, (currentLikesCount || 0) - 1);

      console.log(`⚡ Optimistic update: ${newIsLiked ? 'Liked' : 'Unliked'} (${newLikesCount} likes)`);

      updatePostInAllCaches(postId, (old) => ({
        ...old,
        is_liked: newIsLiked,
        likes_count: newLikesCount,
      }));

      return { previousPost };
    },

    onSuccess: async (data, variables, context) => {
      mutationInProgressRef.current = false;
      console.log(`✅ Toggle like success:`, data);

      // The toggleLike service already returns the correct state
      let finalIsLiked = data.is_liked;
      let finalLikesCount = data.likes_count;

      // Fix for server returning 0 on successful operation
      const wasLiking = !context?.previousPost?.is_liked;
      if (wasLiking && data.is_liked === true && data.likes_count === 0 && currentLikesCount >= 0) {
        finalLikesCount = currentLikesCount + 1;
        console.log(`⚠️ Server returned 0 likes on like, using optimistic: ${finalLikesCount}`);
      } else if (!wasLiking && data.is_liked === false && data.likes_count === 0 && currentLikesCount > 0) {
        finalLikesCount = Math.max(0, currentLikesCount - 1);
        console.log(`⚠️ Server returned 0 likes on unlike, using optimistic: ${finalLikesCount}`);
      }

      updatePostInAllCaches(postId, (old) => ({
        ...old,
        is_liked: finalIsLiked,
        likes_count: finalLikesCount,
      }));

      await forceRefetchAllQueries();
    },

    onError: async (error, variables, context) => {
      mutationInProgressRef.current = false;
      console.error('❌ Toggle like failed:', error.message);

      // Rollback to previous state
      if (context?.previousPost) {
        updatePostInAllCaches(postId, () => context.previousPost);
      } else {
        updatePostInAllCaches(postId, (old) => ({
          ...old,
          is_liked: currentIsLiked,
          likes_count: currentLikesCount,
        }));
      }

      await forceRefetchAllQueries();

      if (!error.message?.includes('already') && !error.message?.includes('Mutation in progress')) {
        let errorMessage = 'Failed to update like status';
        if (error.message?.includes('login')) {
          errorMessage = 'Please login to like posts';
          showToast(errorMessage, 'warning');
        } else if (error.message?.includes('network')) {
          errorMessage = 'Network error. Your action will be saved when you reconnect.';
          const queue = JSON.parse(localStorage.getItem('offline_likes_queue') || '[]');
          queue.push({
            postId,
            action: currentIsLiked ? 'unlike' : 'like',
            timestamp: Date.now()
          });
          localStorage.setItem('offline_likes_queue', JSON.stringify(queue));
          showToast(errorMessage, 'warning');
        } else {
          showToast(errorMessage, 'error');
        }
      }
    },
  });

  return {
    like: () => mutation.mutate(),
    isLiking: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
};