import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import './Sidebar.css';

const Sidebar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { hasExistingBusiness, currentBusiness, loading } = useBusiness();
  const { sidebarOpen, setSidebarOpen } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleClose = () => {
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get the business ID from currentBusiness (handles both formats)
  const getBusinessId = () => {
    if (currentBusiness?.id) return currentBusiness.id;
    if (currentBusiness?.business?.id) return currentBusiness.business.id;
    return null;
  };

  const businessId = getBusinessId();

  if (!sidebarOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={handleClose} />

      <aside className="sidebar" role="navigation">
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo">K</div>
            <span className="sidebar__title">KASI</span>
          </div>
          <button
            className="sidebar__close"
            onClick={handleClose}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <nav className="sidebar__nav">
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <div className="sidebar__user">
                <div className="sidebar__user-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="sidebar__user-info">
                  <div className="sidebar__user-name">{user?.username}</div>
                  <div className="sidebar__user-type">{user?.user_type}</div>
                </div>
              </div>

              {/* Main Navigation */}
              <div className="sidebar__section">
                <h3 className="sidebar__section-title">Navigation</h3>
                <button
                  className={`sidebar__item ${isActiveRoute('/feed') ? 'sidebar__item--active' : ''}`}
                  onClick={() => handleNavigation('/feed')}
                >
                  Feed
                </button>
                <button
                  className={`sidebar__item ${isActiveRoute('/business/search') ? 'sidebar__item--active' : ''}`}
                  onClick={() => handleNavigation('/business/search')}
                >
                  Discover Businesses
                </button>
                <button
                  className={`sidebar__item ${isActiveRoute('/events') ? 'sidebar__item--active' : ''}`}
                  onClick={() => handleNavigation('/events')}
                >
                  Events
                </button>
                <button
                  className={`sidebar__item ${isActiveRoute('/trending') ? 'sidebar__item--active' : ''}`}
                  onClick={() => handleNavigation('/trending')}
                >
                  Trending
                </button>
              </div>

              {/* User Section */}
              <div className="sidebar__section">
                <h3 className="sidebar__section-title">Your Account</h3>
                <button
                  className={`sidebar__item ${isActiveRoute('/profile') ? 'sidebar__item--active' : ''}`}
                  onClick={() => handleNavigation('/profile')}
                >
                  Profile
                </button>
                <button
                  className={`sidebar__item ${isActiveRoute('/preferences') ? 'sidebar__item--active' : ''}`}
                  onClick={() => handleNavigation('/preferences')}
                >
                  Preferences
                </button>
                <button
                  className={`sidebar__item ${isActiveRoute('/saved') ? 'sidebar__item--active' : ''}`}
                  onClick={() => handleNavigation('/saved')}
                >
                  Saved Posts
                </button>
              </div>

              {/* Business Owner Section */}
              {user?.user_type === 'business_owner' && (
                <div className="sidebar__section">
                  <h3 className="sidebar__section-title">Business</h3>

                  {/* Dashboard - shows once business is loaded */}
                  {hasExistingBusiness && businessId && !loading && (
                    <button
                      className={`sidebar__item ${isActiveRoute(`/business/${businessId}`) ? 'sidebar__item--active' : ''}`}
                      onClick={() => handleNavigation(`/business/${businessId}`)}
                    >
                      Dashboard
                    </button>
                  )}

                  {/* Show Create Business only if user doesn't have one */}
                  {!hasExistingBusiness && (
                    <button
                      className={`sidebar__item ${isActiveRoute('/business/create') ? 'sidebar__item--active' : ''}`}
                      onClick={() => handleNavigation('/business/create')}
                    >
                      Create Business
                    </button>
                  )}

                  {/* Show Manage Business if user has a business */}
                  {hasExistingBusiness && businessId && (
                    <>
                      <button
                        className={`sidebar__item ${isActiveRoute(`/business/${businessId}/posts`) ? 'sidebar__item--active' : ''}`}
                        onClick={() => handleNavigation(`/business/${businessId}/posts`)}
                      >
                        Manage Posts
                      </button>
                      <button
                        className={`sidebar__item ${isActiveRoute(`/business/${businessId}/analytics`) ? 'sidebar__item--active' : ''}`}
                        onClick={() => handleNavigation(`/business/${businessId}/analytics`)}
                      >
                        Analytics
                      </button>
                      <button
                        className={`sidebar__item ${isActiveRoute(`/business/${businessId}/settings`) ? 'sidebar__item--active' : ''}`}
                        onClick={() => handleNavigation(`/business/${businessId}/settings`)}
                      >
                        Business Settings
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Logout */}
              <div className="sidebar__section">
                <button
                  className="sidebar__item sidebar__item--logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            /* Unauthenticated State */
            <div className="sidebar__auth">
              <p className="sidebar__auth-message">
                Join KASI to discover local businesses and connect with your community.
              </p>
              <div className="sidebar__auth-buttons">
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => handleNavigation('/login')}
                  className="sidebar__auth-btn"
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  size="large"
                  onClick={() => handleNavigation('/register')}
                  className="sidebar__auth-btn"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;