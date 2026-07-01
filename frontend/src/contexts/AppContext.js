import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_TOAST':
      return {
        ...state,
        toast: action.payload,
      };
    case 'CLEAR_TOAST':
      return {
        ...state,
        toast: null,
      };
    case 'SET_MODAL':
      return {
        ...state,
        modal: action.payload,
      };
    case 'CLEAR_MODAL':
      return {
        ...state,
        modal: null,
      };
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload,
      };
    case 'SET_USER_LOCATION':
      return {
        ...state,
        userLocation: action.payload,
      };
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: action.payload,
      };
    case 'SET_AUTH_ERROR':
      return {
        ...state,
        authError: action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  toast: null,
  modal: null,
  sidebarOpen: false,
  userLocation: null,
  authError: null,
  preferences: {
    theme: 'light',
    notifications: true,
    location: null,
    preferredCategories: [],
  },
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { handleUnauthorized } = useAuth();

  // Handle global authentication errors
  useEffect(() => {
    const handleApiError = (event) => {
      if (event.detail?.status === 401) {
        console.log('Global 401 error detected');
        handleUnauthorized?.();
        showToast('Session expired. Please log in again.', 'error');
      }
    };

    window.addEventListener('apiError', handleApiError);

    return () => {
      window.removeEventListener('apiError', handleApiError);
    };
  }, [handleUnauthorized]);

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const showToast = (message, type = 'info') => {
    dispatch({
      type: 'SET_TOAST',
      payload: { message, type, id: Date.now() },
    });

    // Auto hide after 5 seconds
    setTimeout(() => {
      dispatch({ type: 'CLEAR_TOAST' });
    }, 5000);
  };

  const clearToast = () => {
    dispatch({ type: 'CLEAR_TOAST' });
  };

  const showModal = (modalType, modalProps = {}) => {
    dispatch({
      type: 'SET_MODAL',
      payload: { type: modalType, props: modalProps },
    });
  };

  const hideModal = () => {
    dispatch({ type: 'CLEAR_MODAL' });
  };

  const setSidebarOpen = (open) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  };

  const setUserLocation = (location) => {
    dispatch({ type: 'SET_USER_LOCATION', payload: location });
  };

  const setPreferences = (preferences) => {
    dispatch({ type: 'SET_PREFERENCES', payload: preferences });
  };

  const setAuthError = (error) => {
    dispatch({ type: 'SET_AUTH_ERROR', payload: error });
  };

  const value = {
    ...state,
    setLoading,
    showToast,
    clearToast,
    showModal,
    hideModal,
    setSidebarOpen,
    setUserLocation,
    setPreferences,
    setAuthError,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

