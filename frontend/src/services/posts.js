// services/posts.js - PRODUCTION READY with Scenario 1 + 3 (Like + Unlike)
import { apiService } from './api';

export const postsService = {
  /**
   * Create a new post with optional media files
   */
  async createPost(businessId, postData, mediaFiles = []) {
    try {
      console.log('📝 Creating post:', {
        businessId,
        title: postData.title,
        postType: postData.post_type || 'post',
        contentLength: postData.content?.length || 0,
        mediaFilesCount: mediaFiles.length,
      });

      if (!mediaFiles || mediaFiles.length === 0) {
        const payload = {
          title: postData.title,
          content: postData.content || '',
          post_type: postData.post_type || 'post',
          hashtags: postData.hashtags || []
        };

        return await apiService.post(`/businesses/${businessId}/posts`, payload);
      }

      const formData = new FormData();
      formData.append('title', postData.title);
      if (postData.content) formData.append('content', postData.content);
      formData.append('post_type', postData.post_type || 'post');

      if (Array.isArray(mediaFiles)) {
        mediaFiles.forEach(file => formData.append('media', file));
      } else {
        formData.append('media', mediaFiles);
      }

      const response = await apiService.postFormData(`/businesses/${businessId}/posts`, formData);

      // Clear relevant caches
      apiService.clearCache('/feed');
      apiService.clearCache('/feed/personalized-fast');
      apiService.clearCache(`/businesses/${businessId}/posts`);

      return response;

    } catch (error) {
      console.error('❌ Create post error:', error);
      let userMessage = 'Failed to create post';

      if (error.message.includes('Network error')) {
        userMessage = 'Network error: Please check your connection and try again';
      } else if (error.message.includes('Unsupported file format')) {
        userMessage = 'Unsupported file format. Please use JPG, PNG, GIF, WebP, MP4, or MOV files';
      } else if (error.message.includes('File too large')) {
        userMessage = 'File too large. Maximum file size is 50MB';
      } else if (error.message.includes('500')) {
        userMessage = 'Server error: Please try again in a few moments';
      } else if (error.message.includes('403')) {
        userMessage = 'You do not have permission to create posts for this business';
      } else if (error.message.includes('404')) {
        userMessage = 'Business not found';
      }

      throw new Error(userMessage);
    }
  },

  /**
   * DELETE a post
   */
  async deletePost(postId) {
    console.log('🗑️ ========== DELETE POST ==========');
    console.log('🗑️ Post ID:', postId);

    if (!postId || postId === 'undefined' || postId === 'null' || postId === '') {
      throw new Error('Post ID is required');
    }

    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const url = `${baseURL}/posts/${postId}`;
      const token = localStorage.getItem('access_token');

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        apiService.clearCache('/feed');
        apiService.clearCache('/feed/personalized-fast');
        apiService.clearCache(`/posts/${postId}`);
        return { success: true };
      } else {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ Delete post error:', error);
      let userMessage = 'Failed to delete post';

      if (error.message.includes('403')) userMessage = 'You do not have permission to delete this post';
      else if (error.message.includes('404')) userMessage = 'Post not found';
      else if (error.message.includes('401')) userMessage = 'Please log in to delete this post';
      else if (error.message.includes('Network error')) userMessage = 'Network error: Please check your connection';
      else if (error.message.includes('500')) userMessage = 'Server error: Please try again later';

      throw new Error(userMessage);
    }
  },

  /**
   * Upload multiple media files
   */
  async uploadMultipleMedia(businessId, files) {
    try {
      const formData = new FormData();
      if (Array.isArray(files)) {
        files.forEach(file => formData.append('files', file));
      } else {
        formData.append('files', files);
      }

      const response = await apiService.postFormData(`/upload/business-media/${businessId}/multiple`, formData);
      return Array.isArray(response) ? response : [response];

    } catch (error) {
      console.error('❌ Multiple media upload failed:', error);
      const results = [];
      for (const file of files) {
        try {
          const result = await this.uploadSingleMedia(businessId, file);
          results.push(result);
        } catch (singleError) {
          console.error(`Failed to upload ${file.name}:`, singleError);
        }
      }
      if (results.length === 0) throw new Error('All file uploads failed');
      return results;
    }
  },

  /**
   * Upload a single media file
   */
  async uploadSingleMedia(businessId, file) {
    const formData = new FormData();
    formData.append('file', file);
    return await apiService.postFormData(`/upload/business-media/${businessId}`, formData);
  },

  /**
   * Get all posts for a business
   */
  async getBusinessPosts(businessId, limit = 20, offset = 0) {
    try {
      const response = await apiService.get(`/businesses/${businessId}/posts?limit=${limit}&offset=${offset}`);
      return response || [];
    } catch (error) {
      console.error('❌ Get business posts error:', error);
      if (error.message.includes('404') || error.message.includes('405') || error.message.includes('500')) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Get a single post by ID
   */
  async getPost(postId) {
    try {
      const response = await apiService.get(`/posts/${postId}`);
      return response;
    } catch (error) {
      console.error('❌ Get post error:', error);
      throw error;
    }
  },

  /**
   * SCENARIO 1: Like a post
   */
  async likePost(postId) {
    if (!postId) {
      throw new Error('Post ID is required');
    }

    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const url = `${baseURL}/posts/${postId}/like`;
      const token = localStorage.getItem('access_token');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      let responseData = {};
      try {
        responseData = await response.json();
      } catch (e) {
        // No JSON response body
      }

      if (response.ok) {
        // SCENARIO 1: Successfully liked
        console.log('✅ SCENARIO 1: Post liked successfully');

        // Clear caches
        apiService.clearCache(`/posts/${postId}`);
        apiService.clearCache('/feed');
        apiService.clearCache('/feed/personalized');
        apiService.clearCache('/feed/personalized-fast');
        apiService.clearCache('/trending');

        return {
          success: true,
          is_liked: true,
          likes_count: responseData.likes_count || 0
        };
      } else {
        // Handle idempotent case
        if (response.status === 400 &&
            (responseData.detail?.toLowerCase().includes('already liked') ||
             responseData.message?.toLowerCase().includes('already liked'))) {

          console.log('⚠️ Post already liked (idempotent)');

          const currentPost = await this.getPost(postId);
          return {
            success: true,
            is_liked: true,
            likes_count: currentPost?.likes_count || 0,
            alreadyLiked: true
          };
        }

        throw new Error(responseData.detail || responseData.message || `HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Like post error:', error);
      throw error;
    }
  },

  /**
   * SCENARIO 3: Unlike a post
   */
  async unlikePost(postId) {
    if (!postId) {
      throw new Error('Post ID is required');
    }

    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const url = `${baseURL}/posts/${postId}/like`;
      const token = localStorage.getItem('access_token');

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      let responseData = {};
      try {
        responseData = await response.json();
      } catch (e) {
        // No JSON response body
      }

      if (response.ok) {
        // SCENARIO 3: Successfully unliked
        console.log('✅ SCENARIO 3: Post unliked successfully');

        apiService.clearCache(`/posts/${postId}`);
        apiService.clearCache('/feed');
        apiService.clearCache('/feed/personalized');
        apiService.clearCache('/feed/personalized-fast');
        apiService.clearCache('/trending');

        return {
          success: true,
          is_liked: false,
          likes_count: responseData.likes_count || 0
        };
      } else {
        // Handle idempotent case
        if (response.status === 400 &&
            (responseData.detail?.toLowerCase().includes('not liked') ||
             responseData.detail?.toLowerCase().includes('not currently liking'))) {

          console.log('⚠️ Post already not liked (idempotent)');

          const currentPost = await this.getPost(postId);
          return {
            success: true,
            is_liked: false,
            likes_count: currentPost?.likes_count || 0,
            alreadyUnliked: true
          };
        }

        throw new Error(responseData.detail || responseData.message || `HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Unlike post error:', error);
      throw error;
    }
  },

  /**
   * Toggle like status - Used by usePostLike hook
   */
  async toggleLike(postId, currentIsLiked) {
    if (currentIsLiked) {
      // SCENARIO 3: Currently liked, so unlike
      return await this.unlikePost(postId);
    } else {
      // SCENARIO 1: Currently not liked, so like
      return await this.likePost(postId);
    }
  },

  /**
   * Save a post
   */
  async savePost(postId) {
    try {
      const response = await apiService.post(`/posts/${postId}/save`, {});
      return response;
    } catch (error) {
      console.error('❌ Save post error:', error);
      throw error;
    }
  },

  /**
   * Remove a post from saved items
   */
  async unsavePost(postId) {
    try {
      const response = await apiService.delete(`/posts/${postId}/save`);
      return response;
    } catch (error) {
      console.error('❌ Unsave post error:', error);
      throw error;
    }
  },

  /**
   * Get all saved posts
   */
  async getSavedPosts() {
    try {
      const response = await apiService.get('/saved-posts');
      return response || [];
    } catch (error) {
      console.error('❌ Get saved posts error:', error);
      throw error;
    }
  },

  /**
   * Add a comment
   */
  async addComment(postId, content) {
    try {
      const response = await apiService.post(`/posts/${postId}/comments`, { content });
      apiService.clearCache(`/posts/${postId}`);
      return response;
    } catch (error) {
      console.error('❌ Add comment error:', error);
      throw error;
    }
  },

  /**
   * Get comments for a post
   */
  async getPostComments(postId) {
    try {
      const response = await apiService.get(`/posts/${postId}/comments`);
      return response || [];
    } catch (error) {
      console.error('❌ Get post comments error:', error);
      throw error;
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId) {
    try {
      const response = await apiService.delete(`/comments/${commentId}`);
      return response;
    } catch (error) {
      console.error('❌ Delete comment error:', error);
      throw error;
    }
  },

  /**
   * Get feed posts
   */
  async getFeed(limit = 20, offset = 0, hashtag = null, category = null) {
    try {
      const params = { limit, offset };
      if (hashtag) params.hashtag = hashtag;
      if (category) params.category = category;

      const response = await apiService.get('/feed', params);
      return response || { posts: [], has_more: false };
    } catch (error) {
      console.error('❌ Get feed error:', error);
      throw error;
    }
  },

  /**
   * Get personalized feed
   */
  async getPersonalizedFeed(options = {}) {
    try {
      const params = {
        limit: options.limit || 20,
        offset: options.offset || 0,
        max_distance_km: options.maxDistance,
        preferred_categories: options.preferredCategories?.join(','),
        latitude: options.latitude,
        longitude: options.longitude,
        use_miles: options.useMiles,
        strict_filtering: options.strictFiltering
      };

      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === null) delete params[key];
      });

      const response = await apiService.get('/feed/personalized', params);
      return response;
    } catch (error) {
      console.error('❌ Get personalized feed error:', error);
      throw error;
    }
  },

  /**
   * Get trending content
   */
  async getTrending(limit = 10, category = null) {
    try {
      const params = { limit };
      if (category) params.category = category;

      const response = await apiService.get('/trending', params);
      return response;
    } catch (error) {
      console.error('❌ Get trending error:', error);
      throw error;
    }
  },

  /**
   * Verify post existence and like status
   */
  async verifyPostAndLikeStatus(postId) {
    try {
      const post = await this.getPost(postId);
      return {
        exists: true,
        is_liked: post.is_liked || false,
        likes_count: post.likes_count || 0
      };
    } catch (error) {
      console.warn(`⚠️ Post ${postId} not found:`, error.message);
      return { exists: false, is_liked: false, likes_count: 0 };
    }
  },

  /**
   * Get comment count
   */
  async getCommentCount(postId) {
    try {
      const comments = await this.getPostComments(postId);
      return comments.length;
    } catch (error) {
      console.error(`❌ Failed to get comment count:`, error);
      return 0;
    }
  },

  /**
   * Sync all post counts
   */
  async syncPostCounts(postId) {
    try {
      const [post, comments] = await Promise.all([
        this.getPost(postId),
        this.getPostComments(postId)
      ]);
      return {
        likes_count: post.likes_count || 0,
        comments_count: comments.length,
        is_liked: post.is_liked || false
      };
    } catch (error) {
      console.error(`❌ Failed to sync post counts:`, error);
      return null;
    }
  },

  /**
   * Check if user can like a post
   */
  async canLikePost(postId) {
    try {
      const post = await this.getPost(postId);
      return {
        canLike: !post.is_liked,
        is_liked: post.is_liked || false,
        likes_count: post.likes_count || 0
      };
    } catch (error) {
      console.error(`❌ Failed to check like status:`, error);
      return { canLike: false, is_liked: false, likes_count: 0 };
    }
  },

  /**
   * Check if post is saved
   */
  async checkIfSaved(postId) {
    try {
      const savedPosts = await this.getSavedPosts();
      return savedPosts.some(post => post.id === postId);
    } catch (error) {
      console.error('❌ Check if saved error:', error);
      return false;
    }
  },

  /**
   * Get post with enhanced data
   */
  async getPostWithEnhancedData(postId) {
    try {
      const [post, comments, isSaved] = await Promise.all([
        this.getPost(postId),
        this.getPostComments(postId),
        this.checkIfSaved(postId)
      ]);
      return {
        ...post,
        comments: comments,
        is_saved: isSaved,
        comments_count: comments.length
      };
    } catch (error) {
      console.error(`❌ Failed to get enhanced data:`, error);
      throw error;
    }
  },

  /**
   * Search posts
   */
  async searchPosts(query, limit = 20, offset = 0) {
    try {
      const params = { query, limit, offset };
      const response = await apiService.get('/posts/search', params);
      return response || [];
    } catch (error) {
      console.error('❌ Search posts error:', error);

      if (error.message.includes('404') || error.message.includes('405')) {
        const allPosts = await this.getFeed(100, 0);
        const filtered = allPosts.posts?.filter(post =>
          post.title?.toLowerCase().includes(query.toLowerCase()) ||
          post.content?.toLowerCase().includes(query.toLowerCase())
        ) || [];
        return filtered.slice(0, limit);
      }
      throw error;
    }
  },

  /**
   * Get posts by hashtag
   */
  async getPostsByHashtag(hashtag, limit = 20, offset = 0) {
    try {
      const response = await apiService.get(`/hashtags/${hashtag}/posts?limit=${limit}&offset=${offset}`);
      return response || [];
    } catch (error) {
      console.error('❌ Get posts by hashtag error:', error);
      if (error.message.includes('404') || error.message.includes('405')) {
        return this.getFeed(limit, offset, hashtag);
      }
      throw error;
    }
  },

  /**
   * Report a post
   */
  async reportPost(postId, reason) {
    try {
      const response = await apiService.post(`/posts/${postId}/report`, { reason });
      return response;
    } catch (error) {
      console.error('❌ Report post error:', error);
      throw error;
    }
  },

  /**
   * Share a post
   */
  async sharePost(postId, platform = 'copy_link') {
    try {
      const response = await apiService.post(`/posts/${postId}/share`, { platform });
      return response;
    } catch (error) {
      console.error('❌ Share post error:', error);
      throw error;
    }
  },

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const response = await apiService.get('/categories');
      return response || [];
    } catch (error) {
      console.error('❌ Get categories error:', error);
      throw error;
    }
  },

  /**
   * Get category statistics
   */
  async getCategoryStats() {
    try {
      const response = await apiService.get('/categories/stats');
      return response || [];
    } catch (error) {
      console.error('❌ Get category stats error:', error);
      throw error;
    }
  },

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await apiService.healthCheck();
      return response;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }
};

export default postsService;