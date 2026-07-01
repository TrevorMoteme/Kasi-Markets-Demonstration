import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { useApp } from '../../contexts/AppContext';
import './BusinessCard.css';

const BusinessCard = ({
  business,
  showActions = true,
  className = '',
  distanceUnit = 'km',
  onImageError,
  hasImageError = false,
  variant = 'default'
}) => {
  const { user } = useAuth();
  const { followBusiness, unfollowBusiness } = useBusiness();
  const { showToast } = useApp();
  const [localImageError, setLocalImageError] = useState(false);
  const [localBgError, setLocalBgError] = useState(false);

  // SVG Icons
  const HeartIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  );

  const LocationIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  );

  const DistanceIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  );

  const FollowPlusIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  );

  const CheckIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  );

  const StarIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  );

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await followBusiness(business.id);
      showToast(`Following ${business.name}`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleUnfollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await unfollowBusiness(business.id);
      showToast(`Unfollowed ${business.name}`, 'info');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleImageErrorInternal = (type = 'logo') => {
    if (onImageError) {
      onImageError(business.id, type);
    } else {
      if (type === 'logo') {
        setLocalImageError(true);
      } else {
        setLocalBgError(true);
      }
    }
  };

  const formatDistance = (km) => {
    if (!km && km !== 0) return null;

    if (distanceUnit === 'miles') {
      const miles = km * 0.621371;
      if (miles < 0.1) return `${Math.round(miles * 5280)} ft`;
      if (miles < 1) return `${miles.toFixed(1)} mi`;
      return `${Math.round(miles)} mi`;
    }

    if (km < 0.1) return `${Math.round(km * 1000)} m`;
    if (km < 1) return `${(km * 1000).toFixed(0)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
  };

  const getRatingStars = () => {
    if (!business.rating) return null;

    const fullStars = Math.floor(business.rating);
    const hasHalfStar = business.rating % 1 >= 0.5;

    return (
      <div className="business-card__rating">
        <div className="business-card__stars">
          {[...Array(fullStars)].map((_, i) => (
            <StarIcon key={i} />
          ))}
          {hasHalfStar && <span className="business-card__half-star">½</span>}
          {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
            <span key={i} className="business-card__empty-star">☆</span>
          ))}
        </div>
        <span className="business-card__rating-value">
          {business.rating.toFixed(1)}
        </span>
        {business.review_count > 0 && (
          <span className="business-card__review-count">
            ({business.review_count})
          </span>
        )}
      </div>
    );
  };

  const getCategoryIcon = () => {
    const category = business.category?.toLowerCase() || '';
    if (category.includes('restaurant') || category.includes('cafe')) return '🍽️';
    if (category.includes('retail') || category.includes('shop')) return '🛍️';
    if (category.includes('service')) return '🔧';
    if (category.includes('entertainment')) return '🎬';
    if (category.includes('health') || category.includes('fitness')) return '💪';
    if (category.includes('beauty') || category.includes('salon')) return '💅';
    if (category.includes('auto') || category.includes('car')) return '🚗';
    if (category.includes('education') || category.includes('school')) return '📚';
    return '🏢';
  };

  const resolveMediaUrl = (url) => {
    if (!url) return null;
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    if (url.startsWith('http')) {
      if (url.includes('localhost:3000')) {
        const filename = url.split('/media/')[1];
        return `${backendUrl}/media/${filename}`;
      }
      return url;
    }
    if (url.startsWith('/media/')) return `${backendUrl}${url}`;
    if (!url.includes('/')) return `${backendUrl}/media/${url}`;
    return `${backendUrl}/media/${url}`;
  };

  const displayDistance = formatDistance(business.calculated_distance || business.distance);
  const businessLogo = !hasImageError && !localImageError && business.logo_url
    ? resolveMediaUrl(business.logo_url)
    : null;
  const businessBackground = !localBgError && business.background_picture_url
    ? resolveMediaUrl(business.background_picture_url)
    : null;
  const categoryIcon = getCategoryIcon();
  const businessInitial = business.name ? business.name.charAt(0).toUpperCase() : 'B';
  const totalEngagement = (business.likes_count || 0) + (business.followers_count || 0);

  // Media-first card with text overlays
  const MediaCard = () => {
    const mediaUrl = businessBackground || businessLogo;
    const hasMedia = mediaUrl && !localBgError && !localImageError;

    return (
      <div className={`business-card business-card--media ${className}`}>
        <Link to={`/business/${business.id}`} className="business-card__media-link">
          <div className="business-card__media-container">
            {hasMedia ? (
              <img
                src={mediaUrl}
                alt={business.name}
                className="business-card__media-image"
                onError={() => handleImageErrorInternal(businessBackground ? 'bg' : 'logo')}
                loading="lazy"
              />
            ) : (
              <div className="business-card__media-placeholder">
                <span className="business-card__media-placeholder-icon">{categoryIcon}</span>
              </div>
            )}

            <div className="business-card__gradient-overlay"></div>

            {/* Top Left - Round Logo */}
            <div className="business-card__overlay-top-left">
              {businessLogo && !localImageError ? (
                <div className="business-card__overlay-logo">
                  <img src={businessLogo} alt={business.name} />
                </div>
              ) : (
                <div className="business-card__overlay-logo-placeholder">
                  {businessInitial}
                </div>
              )}
            </div>

            {/* Top Right - Follow Button (only if user is logged in and not owner) */}
            {showActions && user && (
              <div className="business-card__overlay-top-right">
                <button
                  className={`business-card__overlay-follow-btn ${business.is_following ? 'following' : ''}`}
                  onClick={business.is_following ? handleUnfollow : handleFollow}
                >
                  {business.is_following ? <CheckIcon /> : <FollowPlusIcon />}
                  {business.is_following ? ' Following' : ' Follow'}
                </button>
              </div>
            )}

            {/* Distance Pill */}
            {displayDistance && (
              <div className="business-card__distance-pill">
                <DistanceIcon />
                {displayDistance}
              </div>
            )}

            {/* Bottom Left - Business Info */}
            <div className="business-card__overlay-bottom-left">
              <h3 className="business-card__overlay-name">{business.name}</h3>
              <div className="business-card__overlay-category">
                {categoryIcon} {business.category || 'Business'}
              </div>
              {business.city && (
                <div className="business-card__overlay-location">
                  <LocationIcon /> {business.city}{business.state ? `, ${business.state}` : ''}
                </div>
              )}
            </div>

            {/* Bottom Right - Rating & Engagement */}
            <div className="business-card__overlay-bottom-right">
              {business.rating && (
                <div className="business-card__overlay-rating">
                  {getRatingStars()}
                </div>
              )}
              {totalEngagement > 0 && (
                <div className="business-card__overlay-engagement">
                  <HeartIcon />
                  <span>{totalEngagement.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  };

  // Compact card for sidebars
  const CompactCard = () => (
    <div className={`business-card business-card--compact ${className}`}>
      <Link to={`/business/${business.id}`} className="business-card__compact-link">
        <div className="business-card__compact-image">
          {businessLogo ? (
            <img
              src={businessLogo}
              alt={business.name}
              onError={() => handleImageErrorInternal('logo')}
              loading="lazy"
            />
          ) : (
            <div className="business-card__compact-placeholder">
              {businessInitial}
            </div>
          )}
        </div>
        <div className="business-card__compact-info">
          <h4 className="business-card__compact-name">{business.name}</h4>
          <div className="business-card__compact-meta">
            <span className="business-card__compact-category">
              {categoryIcon}
            </span>
            {displayDistance && (
              <span className="business-card__compact-distance">
                • {displayDistance}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );

  if (variant === 'compact') {
    return <CompactCard />;
  }

  return <MediaCard />;
};

export default BusinessCard;