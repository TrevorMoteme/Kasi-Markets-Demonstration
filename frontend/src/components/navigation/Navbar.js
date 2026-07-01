import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { currentBusiness, hasExistingBusiness, loading } = useBusiness();
  const { setSidebarOpen } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
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

  return (
    <nav className="navbar" role="navigation">
      <div className="navbar__container">
        {/* Logo and Brand */}
        <div className="navbar__brand">
          <Link to="/" className="navbar__logo">
            <div className="navbar__logo-icon">K</div>
            <span className="navbar__logo-text">KASI</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar__desktop">
          {isAuthenticated ? (
            <>
              <div className="navbar__links">
                <Link
                  to="/feed"
                  className={`navbar__link ${isActiveRoute('/feed') ? 'navbar__link--active' : ''}`}
                >
                  Feed
                </Link>
                <Link
                  to="/business/search"
                  className={`navbar__link ${isActiveRoute('/business/search') ? 'navbar__link--active' : ''}`}
                >
                  Discover
                </Link>
                <Link
                  to="/events"
                  className={`navbar__link ${isActiveRoute('/events') ? 'navbar__link--active' : ''}`}
                >
                  Events
                </Link>
                {/* Dashboard link - shows once business is loaded */}
                {user?.user_type === 'business_owner' && hasExistingBusiness && businessId && !loading && (
                  <Link
                    to={`/business/${businessId}`}
                    className={`navbar__link ${isActiveRoute(`/business/${businessId}`) ? 'navbar__link--active' : ''}`}
                  >
                    Dashboard
                  </Link>
                )}
              </div>

              <div className="navbar__user">
                <button
                  className="navbar__user-toggle"
                  onClick={handleUserMenuToggle}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <div className="navbar__user-avatar">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="navbar__user-name">
                    {user?.username}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="navbar__user-menu">
                    <Link
                      to="/profile"
                      className="navbar__user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/preferences"
                      className="navbar__user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Preferences
                    </Link>
                    <Link
                      to="/saved"
                      className="navbar__user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Saved Posts
                    </Link>
                    <hr className="navbar__user-menu-divider" />
                    <button
                      className="navbar__user-menu-item navbar__user-menu-item--logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="navbar__auth">
              <Button
                variant="outline"
                size="small"
                onClick={() => navigate('/login')}
                className="navbar__auth-btn"
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => navigate('/register')}
                className="navbar__auth-btn"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="navbar__mobile">
          <button
            className="navbar__menu-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Overlay for user menu */}
      {showUserMenu && (
        <div
          className="navbar__overlay"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;