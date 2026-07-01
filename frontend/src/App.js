// App.js - Fixed version without ReactQueryDevTools issues
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './contexts/AuthContext';
import { BusinessProvider } from './contexts/BusinessContext';
import { AppProvider } from './contexts/AppContext';
import Navbar from './components/navigation/Navbar';
// import Footer from './components/navigation/Footer';  // REMOVED for infinite scroll
import SidebarWrapper from './components/navigation/SidebarWrapper';
import ErrorBoundary from './components/common/ErrorBoundary';
import Toast from './components/common/Toast';
import BottomNav from './components/navigation/BottomNav';
import { useDevice } from './hooks/useMediaQuery';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmailVerification from './pages/auth/EmailVerification';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// General Pages
import Home from './pages/Home';
import Feed from './pages/post/Feed';
import PostDetail from './pages/post/PostDetail';
import Categories from './pages/general/Categories';
import Trending from './pages/general/Trending';

// Business Pages
import BusinessDashboard from './pages/business/BusinessDashboard';
import CreateBusiness from './pages/business/CreateBusiness';
import BusinessSearch from './pages/business/BusinessSearch';
// REMOVED: import BusinessSettings from './pages/business/BusinessSettings';
import ManagePosts from './pages/business/ManagePosts';
import BusinessProfile from './components/business/BusinessProfile';

// Import BusinessForm directly - the unified component
import BusinessForm from './components/business/BusinessForm';

// Post Pages
import CreatePost from './pages/post/CreatePost';

// Analytics Pages
import BusinessAnalytics from './pages/analytics/BusinessAnalytics';
import PostAnalytics from './pages/analytics/PostAnalytics';

// Event Pages
import Events from './pages/events/Events';
import EventDetail from './pages/events/EventDetail';
import CreateEvent from './pages/events/CreateEvent';

// User Pages
import Profile from './pages/user/Profile';
import Preferences from './pages/user/Preferences';
import SavedPosts from './pages/user/SavedPosts';

// Common Components
import ProtectedRoute from './components/common/ProtectedRoute';

import './App.css';

// Wrapper component that conditionally shows bottom nav on mobile
const AppContent = ({ children }) => {
  const { isMobile } = useDevice();
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Pages where bottom nav should NOT show
  const hideBottomNavPaths = [
    '/login', '/register', '/verify-email',
    '/forgot-password', '/reset-password'
  ];

  const shouldShowBottomNav = isMobile &&
    !hideBottomNavPaths.includes(currentPath) &&
    !currentPath.startsWith('/business/') &&
    !currentPath.startsWith('/post/') &&
    !currentPath.includes('/analytics') &&
    !currentPath.includes('/settings') &&
    !currentPath.includes('/create');

  return (
    <>
      {children}
      {shouldShowBottomNav && <BottomNav />}
    </>
  );
};

// Offline sync handler
const OfflineSyncHandler = () => {
  useEffect(() => {
    const processOfflineQueue = async () => {
      const queue = JSON.parse(localStorage.getItem('offline_likes_queue') || '[]');
      if (queue.length === 0) return;

      console.log(`📱 Processing ${queue.length} offline actions...`);

      // Dynamically import postsService to avoid circular dependencies
      const { postsService } = await import('./services/posts');

      for (const item of queue) {
        try {
          if (item.type === 'like') {
            await postsService.likePost(item.postId);
            console.log(`✅ Synced like for post ${item.postId}`);
          } else if (item.type === 'unlike') {
            await postsService.unlikePost(item.postId);
            console.log(`✅ Synced unlike for post ${item.postId}`);
          }
          // Remove from queue after successful sync
          const updatedQueue = queue.filter(q => q.id !== item.id);
          localStorage.setItem('offline_likes_queue', JSON.stringify(updatedQueue));
        } catch (error) {
          console.error(`❌ Failed to sync action for post ${item.postId}:`, error);
          // Increment retry count
          item.retryCount = (item.retryCount || 0) + 1;
          if (item.retryCount >= 3) {
            // Remove after 3 failed attempts
            const updatedQueue = queue.filter(q => q.id !== item.id);
            localStorage.setItem('offline_likes_queue', JSON.stringify(updatedQueue));
          } else {
            // Update retry count
            const updatedQueue = queue.map(q =>
              q.id === item.id ? { ...q, retryCount: item.retryCount } : q
            );
            localStorage.setItem('offline_likes_queue', JSON.stringify(updatedQueue));
          }
        }
      }
    };

    // Process queue when coming online
    const handleOnline = () => {
      console.log('🌐 Back online! Syncing offline actions...');
      processOfflineQueue();
    };

    window.addEventListener('online', handleOnline);

    // Process queue immediately if online
    if (navigator.onLine) {
      processOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return null;
};

function App() {
  useEffect(() => {
    console.log('🎬 App mounted - Checking environment');
    console.log('API URL:', process.env.REACT_APP_API_URL || 'http://localhost:8000');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    console.log('🔐 Stored auth:', {
      hasToken: !!token,
      tokenLength: token?.length,
      hasUser: !!user,
      user: user ? JSON.parse(user)?.username : null
    });

    const handleGlobalError = (error) => {
      console.error('🌍 Global error caught:', error);
    };

    window.addEventListener('error', handleGlobalError);

    // Register service worker for offline support (optional)
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(registrationError => {
          console.log('SW registration failed:', registrationError);
        });
      });
    }

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <Router>
          <AuthProvider>
            <AppProvider>
              <BusinessProvider>
                <SidebarWrapper>
                  <div className="app">
                    <Navbar />

                    <main className="app-main">
                      <AppContent>
                        <Routes>
                          {/* Public Routes */}
                          <Route path="/" element={<Home />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/verify-email" element={<EmailVerification />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route path="/trending" element={<Trending />} />
                          <Route path="/events" element={<Events />} />
                          <Route path="/event/:eventId" element={<EventDetail />} />
                          <Route path="/business/search" element={<BusinessSearch />} />
                          <Route path="/business/:businessId" element={<BusinessProfile />} />
                          <Route path="/post/:postId" element={<PostDetail />} />

                          {/* Protected Routes - All Users */}
                          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                          <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
                          <Route path="/saved" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />

                          {/* Protected Routes - Business Owners Only */}
                          <Route path="/business/:businessId/dashboard" element={<ProtectedRoute requiredUserType="business_owner"><BusinessDashboard /></ProtectedRoute>} />

                          {/* CREATE BUSINESS - Using BusinessForm in create mode */}
                          <Route path="/business/create" element={
                            <ProtectedRoute requiredUserType="business_owner">
                              <CreateBusiness />
                            </ProtectedRoute>
                          } />

                          {/* BUSINESS SETTINGS - Using BusinessForm in edit mode with full features */}
                          <Route path="/business/:businessId/settings" element={
                            <ProtectedRoute requiredUserType="business_owner">
                              <BusinessForm
                                mode="edit"
                                showLocationCard={true}
                                showDrawer={true}
                                showBottomNav={true}
                              />
                            </ProtectedRoute>
                          } />

                          {/* BUSINESS EDIT - Alternative edit route */}
                          <Route path="/business/:businessId/edit" element={
                            <ProtectedRoute requiredUserType="business_owner">
                              <BusinessForm
                                mode="edit"
                                showLocationCard={true}
                                showDrawer={true}
                                showBottomNav={true}
                              />
                            </ProtectedRoute>
                          } />

                          <Route path="/business/:businessId/posts" element={<ProtectedRoute requiredUserType="business_owner"><ManagePosts /></ProtectedRoute>} />
                          <Route path="/business/:businessId/posts/create" element={<ProtectedRoute requiredUserType="business_owner"><CreatePost /></ProtectedRoute>} />
                          <Route path="/business/:businessId/analytics" element={<ProtectedRoute requiredUserType="business_owner"><BusinessAnalytics /></ProtectedRoute>} />
                          <Route path="/post/:postId/analytics" element={<ProtectedRoute requiredUserType="business_owner"><PostAnalytics /></ProtectedRoute>} />
                          <Route path="/business/:businessId/events/create" element={<ProtectedRoute requiredUserType="business_owner"><CreateEvent /></ProtectedRoute>} />

                          {/* 404 Route */}
                          <Route path="*" element={<div className="not-found"><h1>404 - Page Not Found</h1><p>The page you're looking for doesn't exist.</p></div>} />
                        </Routes>
                      </AppContent>
                    </main>

                    <Toast />
                    <OfflineSyncHandler />

                    {process.env.NODE_ENV === 'development' && (
                      <button
                        onClick={() => {
                          localStorage.clear();
                          sessionStorage.clear();
                          // Also clear React Query cache
                          try {
                            const { queryClient } = require('./providers/QueryProvider');
                            if (queryClient) {
                              queryClient.clear();
                            }
                          } catch (e) {
                            console.warn('Could not clear query cache:', e);
                          }
                          window.location.href = '/login';
                        }}
                        style={{
                          position: 'fixed',
                          bottom: '20px',
                          right: '20px',
                          zIndex: 9999,
                          background: '#dc3545',
                          color: 'white',
                          padding: '8px 16px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          opacity: 0.8
                        }}
                      >
                        🧹 Clear Auth & Cache
                      </button>
                    )}
                  </div>
                </SidebarWrapper>
              </BusinessProvider>
            </AppProvider>
          </AuthProvider>
        </Router>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;