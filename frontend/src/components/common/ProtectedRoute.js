import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({
  children,
  requiredUserType = null,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  console.log('🔐 ProtectedRoute:', {
    isAuthenticated,
    loading,
    hasUser: !!user,
    path: location.pathname
  });

  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔐 Not authenticated, redirecting to login');
    // Redirect to login page with return url
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredUserType && user?.user_type !== requiredUserType) {
    console.log(`🔐 User type ${user?.user_type} doesn't match required ${requiredUserType}`);
    // Redirect to appropriate page based on user type
    const userTypeFallback = user?.user_type === 'business_owner' ? '/business/dashboard' : '/feed';
    return <Navigate to={userTypeFallback} replace />;
  }

  console.log('🔐 Access granted');
  return children;
};

export default ProtectedRoute;