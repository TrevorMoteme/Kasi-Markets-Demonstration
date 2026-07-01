import React from 'react';
import BusinessCard from './BusinessCard';
import LoadingSpinner from '../common/LoadingSpinner';
import './BusinessList.css';

const BusinessList = ({
  businesses,
  loading = false,
  emptyMessage = "No businesses found",
  className = '',
  variant = 'default'
}) => {
  if (loading) {
    return (
      <div className="business-list-loading">
        <LoadingSpinner size="large" />
        <p>Loading businesses...</p>
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="business-list-empty">
        <div className="business-list-empty-icon">🏢</div>
        <h3 className="business-list-empty-title">No Businesses Found</h3>
        <p className="business-list-empty-message">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`business-list business-list--${variant} ${className}`}>
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          className={variant === 'compact' ? 'business-card--compact' : ''}
        />
      ))}
    </div>
  );
};

export default BusinessList;