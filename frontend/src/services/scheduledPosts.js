import { apiService } from './api';

export const scheduledPostsService = {
  async createScheduledPost(postData) {
    try {
      const response = await apiService.post('/scheduled-posts', postData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getScheduledPosts(businessId) {
    try {
      const response = await apiService.get(`/businesses/${businessId}/scheduled-posts`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async updateScheduledPost(postId, postData) {
    try {
      const response = await apiService.put(`/scheduled-posts/${postId}`, postData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async deleteScheduledPost(postId) {
    try {
      const response = await apiService.delete(`/scheduled-posts/${postId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getScheduledPost(postId) {
    try {
      const response = await apiService.get(`/scheduled-posts/${postId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};
