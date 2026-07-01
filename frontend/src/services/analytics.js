import { apiService } from './api';

export const analyticsService = {
  async getBusinessAnalytics(businessId, timeframe) {
    try {
      const response = await apiService.get(
        `/businesses/${businessId}/analytics/summary`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getPostAnalytics(postId) {
    try {
      const response = await apiService.get(`/posts/${postId}/analytics`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getAnalyticsSummary(businessId) {
    try {
      const response = await apiService.get(`/businesses/${businessId}/analytics/summary`);
      return response;
    } catch (error) {
      // Try dashboard endpoint as fallback
      try {
        const dashboardResponse = await apiService.get('/businesses/dashboard');
        if (dashboardResponse && dashboardResponse.analytics) {
          return dashboardResponse.analytics;
        }
      } catch (dashboardError) {
        console.error('Dashboard fallback failed:', dashboardError);
      }
      throw error;
    }
  },

  async getTrendingContent() {
    try {
      const response = await apiService.get('/trending');
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getRecommendations(maxResults = 10) {
    try {
      // Use trending content as recommendations
      const trending = await this.getTrendingContent();
      return {
        posts: trending.popular_posts?.slice(0, maxResults) || [],
        businesses: []
      };
    } catch (error) {
      return { posts: [], businesses: [] };
    }
  },
};
