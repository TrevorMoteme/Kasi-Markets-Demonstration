// services/auth.js
import { apiService } from './api';

export const authService = {
  // Store keys
  TOKEN_KEY: 'access_token',
  USER_KEY: 'user',

  // Register user - NO token expected, verification email sent
  async register(userData) {
    console.log('🔐 Registering user:', userData.email);

    try {
      const response = await apiService.post('/register', userData, false);
      console.log('✅ Registration response:', response);

      // Registration success - NO token expected
      // User must verify email before they can login
      if (response && response.message) {
        console.log('✅ Registration successful, verification email sent');

        // Return success without token or auto-login
        return {
          success: true,
          message: response.message,
          email: response.email,
          user_type: response.user_type,
          requiresVerification: true
        };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      throw error;
    }
  },

  // Login user
  async login(credentials) {
    console.log('🔐 Attempting login for:', credentials.email);

    try {
      const response = await apiService.post('/login', credentials, false);
      console.log('✅ Login response received');

      if (response.access_token) {
        this.setToken(response.access_token);
        this.setCurrentUser(response.user);
        console.log('✅ Login successful for:', credentials.email);
        return response;
      } else {
        throw new Error('Login failed - no access token received');
      }
    } catch (error) {
      console.error('❌ Login failed:', error.message);

      // Try alternative login method if the main one fails
      if (error.message.includes('405') || error.message.includes('Method Not Allowed')) {
        console.log('⚠️ Main login endpoint failed, trying token endpoint...');
        return this.loginViaTokenEndpoint(credentials);
      }

      throw error;
    }
  },

  // Alternative login via /token endpoint
  async loginViaTokenEndpoint(credentials) {
    try {
      console.log('🔐 Trying login via /token endpoint...');

      const response = await fetch(`${apiService.baseURL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          username: credentials.email,
          password: credentials.password,
          grant_type: 'password'
        }),
        credentials: 'include'
      });

      console.log('📡 Token endpoint response:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token endpoint error:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || errorData.message || 'Login failed');
        } catch (e) {
          throw new Error(`Login failed: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('✅ Token endpoint login successful');

      if (data.access_token) {
        this.setToken(data.access_token);

        if (data.user) {
          this.setCurrentUser(data.user);
        } else {
          const user = {
            id: 'temp-id',
            email: credentials.email,
            username: credentials.email.split('@')[0],
            user_type: 'customer'
          };
          this.setCurrentUser(user);
        }

        return data;
      } else {
        throw new Error('No access token received from token endpoint');
      }
    } catch (error) {
      console.error('❌ Token endpoint login failed:', error);
      throw error;
    }
  },

  // Logout
  async logout() {
    console.log('🔐 Logging out...');

    try {
      try {
        await apiService.post('/logout', {});
        console.log('✅ Backend logout successful');
      } catch (logoutError) {
        console.log('⚠️ Backend logout endpoint not available:', logoutError.message);
      }
    } finally {
      this.clearAuthData();
      console.log('✅ Local logout complete');
    }
  },

  // Verify email
  async verifyEmail(token) {
    try {
      const response = await apiService.post('/verify-email', { token });
      return response;
    } catch (error) {
      console.error('❌ Email verification failed:', error);
      throw error;
    }
  },

  // Resend verification
  async resendVerification(email) {
    try {
      const response = await apiService.post('/resend-verification', { email });
      return response;
    } catch (error) {
      console.error('❌ Resend verification failed:', error);
      throw error;
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await apiService.post('/forgot-password', { email });
      return response;
    } catch (error) {
      console.error('❌ Forgot password request failed:', error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await apiService.post('/reset-password', {
        token,
        new_password: newPassword,
      });
      return response;
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
  },

  // Storage methods
  setToken(token) {
    if (!token) {
      console.error('❌ Cannot set empty token');
      return;
    }

    localStorage.setItem(this.TOKEN_KEY, token);
    console.log('🔐 Token saved to localStorage');
  },

  getToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      console.log('🔐 No token found');
      return null;
    }
    return token;
  },

  setCurrentUser(user) {
    if (!user) {
      console.error('❌ Cannot set empty user');
      return;
    }

    const userToStore = {
      ...user,
      id: user.id || 'unknown-id',
      username: user.username || user.email?.split('@')[0] || 'user',
      email: user.email || 'unknown@email.com',
      user_type: user.user_type || 'customer'
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(userToStore));
    console.log('👤 User saved:', userToStore.username);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('❌ Failed to parse user:', error);
      this.clearAuthData();
      return null;
    }
  },

  updateUserData(userData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const updatedUser = { ...currentUser, ...userData };
    this.setCurrentUser(updatedUser);
    return updatedUser;
  },

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  },

  async verifyToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${apiService.baseURL}/feed?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) return false;
      return true;
    } catch (error) {
      return true;
    }
  },

  clearAuthData() {
    console.log('🧹 Clearing auth data');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  getAuthHeaders() {
    const token = this.getToken();
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  },

  async testConnection() {
    try {
      const response = await fetch(`${apiService.baseURL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        try {
          const data = await response.json();
          return { connected: true, data };
        } catch (e) {
          return { connected: true, data: { message: 'Backend is running' } };
        }
      }
      return { connected: false, error: `Status: ${response.status}` };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
};