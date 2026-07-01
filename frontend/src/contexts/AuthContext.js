// contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.access_token,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuth = useCallback(async () => {
    console.log('🔐 Checking authentication...');
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      console.log('🔐 No stored auth data');
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      const user = JSON.parse(userStr);

      try {
        const testResponse = await fetch('http://localhost:8000/health', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (testResponse.status === 401) {
          console.log('🔐 Token invalid, logging out');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
          return;
        }

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, access_token: token },
        });

      } catch (testError) {
        console.log('🔐 Token test failed (network):', testError.message);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, access_token: token },
        });
      }

    } catch (error) {
      console.error('🔐 Auth check error:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      console.log('🔐 Attempting login...');
      const response = await authService.login(credentials);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response,
      });
      return response;
    } catch (error) {
      console.error('🔐 Login error:', error);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
      });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      console.log('🔐 Attempting registration...');
      const response = await authService.register(userData);

      // IMPORTANT: Do NOT auto-login
      // User must verify email first
      dispatch({ type: 'SET_LOADING', payload: false });

      // Clear any previous errors
      dispatch({ type: 'CLEAR_ERROR' });

      // Return response for UI to show success message
      return response;
    } catch (error) {
      console.error('🔐 Registration error:', error);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message,
      });
      throw error;
    }
  };

  const logout = async () => {
    console.log('🔐 Logging out...');
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData) => {
    authService.updateUserData(userData);
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};




