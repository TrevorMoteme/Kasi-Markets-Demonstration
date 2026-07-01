import { apiService } from './api';

export const emailVerificationService = {
  async sendVerificationEmail(email) {
    try {
      const response = await apiService.post('/resend-verification', { email });
      return response;
    } catch (error) {
      throw error;
    }
  },

  async verifyEmail(token) {
    try {
      const response = await apiService.post('/verify-email', { token });
      return response;
    } catch (error) {
      throw error;
    }
  },

  async checkVerificationStatus() {
    try {
      const user = JSON.parse(localStorage.getItem('kasi_user_data'));
      return user?.is_verified || false;
    } catch (error) {
      return false;
    }
  },
};
