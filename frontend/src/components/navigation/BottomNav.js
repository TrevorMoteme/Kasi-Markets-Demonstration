import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './BottomNav.css';

// SVG Icons - Matching TikTok/Reels immersive style
const HomeIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H9v7H5a2 2 0 0 1-2-2z"/>
  </svg>
);

const SearchIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const CreateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const ShopfrontIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H9v7H5a2 2 0 0 1-2-2z"/>
    <path d="M9 22V12h6v10"/>
    <rect x="4" y="4" width="16" height="4" rx="1"/>
  </svg>
);

const PreferencesIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.14.14"/>
    <path d="M7.5 15v4.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15"/>
  </svg>
);

const FeedPreferencesIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2.5"/>
    <path d="M12 2v4"/>
    <path d="M12 18v4"/>
    <path d="M4.93 4.93l2.83 2.83"/>
    <path d="M16.24 16.24l2.83 2.83"/>
    <path d="M2 12h4"/>
    <path d="M18 12h4"/>
    <path d="M4.93 19.07l2.83-2.83"/>
    <path d="M16.24 7.76l2.83-2.83"/>
  </svg>
);

const HeartIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const BottomNav = ({ onCreateClick, onSearchClick, onPreferencesClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isBusinessUser } = useAuth(); // Assuming you have isBusinessUser in auth context

  const isActive = (path) => {
    if (path === '/feed') return location.pathname === '/feed';
    if (path === '/profile') return location.pathname === '/profile';
    if (path === '/business/shopfront') return location.pathname === '/business/shopfront';
    return location.pathname.startsWith(path);
  };

  // Business User: 5 buttons
  const businessNavItems = [
    { path: '/feed', label: 'Home', icon: HomeIcon, position: 'left' },
    { path: '/business/search', label: 'Search', icon: SearchIcon, position: 'left-center' },
    { path: '/create', label: '', icon: CreateIcon, isSpecial: true, position: 'center' },
    { path: '/preferences', label: 'Settings', icon: PreferencesIcon, position: 'right-center' },
    { path: '/business/shopfront', label: 'Shop', icon: ShopfrontIcon, position: 'right' },
  ];

  // Customer User: 3 buttons
  const customerNavItems = [
    { path: '/feed', label: 'Home', icon: HomeIcon, position: 'left' },
    { path: '/business/search', label: 'Search', icon: SearchIcon, position: 'center' },
    { path: '/preferences', label: 'Feed', icon: FeedPreferencesIcon, position: 'right' },
  ];

  const navItems = user?.isBusinessUser || isBusinessUser ? businessNavItems : customerNavItems;

  const handleNavigation = (item) => {
    if (item.isSpecial) {
      if (onCreateClick) onCreateClick();
      else navigate('/business/create');
    } else if (item.path === '/business/search') {
      if (onSearchClick) onSearchClick();
      else navigate('/business/search');
    } else if (item.path === '/preferences') {
      if (onPreferencesClick) onPreferencesClick();
      else navigate('/preferences');
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="ig-bottom-nav">
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            className={`ig-bottom-nav-item ${active ? 'ig-active' : ''} ${item.isSpecial ? 'ig-special' : ''} ig-position-${item.position}`}
            onClick={() => handleNavigation(item)}
            aria-label={item.label || (item.isSpecial ? 'Create' : 'Navigation')}
          >
            {item.icon({ active })}
            {item.label && <span className="ig-bottom-nav-label">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;