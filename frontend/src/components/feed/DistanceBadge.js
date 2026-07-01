import React from 'react';
import distanceUtils from '../../utils/distanceUtils';
import feedService from '../../services/feed';
import './DistanceBadge.css';

const DistanceBadge = ({
  distanceKm,
  unit = 'auto', // 'auto', 'km', 'miles'
  useMiles = false,
  showIcon = true,
  showLabel = true,
  variant = 'default', // 'default', 'compact', 'inline', 'pill'
  className = '',
  title = null
}) => {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return null;
  }

  // Determine which unit to use
  const displayUnit = unit === 'auto' ? (useMiles ? 'miles' : 'km') : unit;

  // Get distance category info
  const category = distanceUtils.getDistanceCategory(distanceKm);

  // Format distance for display
  const displayValue = feedService.formatDistance(distanceKm, displayUnit === 'miles');

  // Determine title text
  const badgeTitle = title || `${displayValue} away (${category.label})`;

  // Render different variants
  const renderDefault = () => (
    <div
      className={`distance-badge distance-badge-${category.label.toLowerCase()} ${className}`}
      title={badgeTitle}
      style={{ backgroundColor: category.color }}
    >
      {showIcon && <span className="distance-badge-icon">{category.icon}</span>}
      {showLabel && (
        <span className="distance-badge-text">
          {displayValue}
        </span>
      )}
    </div>
  );

  const renderCompact = () => (
    <div
      className={`distance-badge distance-badge-compact distance-badge-${category.label.toLowerCase()} ${className}`}
      title={badgeTitle}
      style={{ backgroundColor: category.color }}
    >
      <span className="distance-badge-icon">{category.icon}</span>
      {showLabel && (
        <span className="distance-badge-text">
          {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : displayValue}
        </span>
      )}
    </div>
  );

  const renderInline = () => (
    <span
      className={`distance-badge distance-badge-inline distance-badge-${category.label.toLowerCase()} ${className}`}
      title={badgeTitle}
      style={{ color: category.color }}
    >
      {showIcon && <span className="distance-badge-icon">{category.icon}</span>}
      {showLabel && (
        <span className="distance-badge-text">
          {displayValue}
        </span>
      )}
    </span>
  );

  const renderPill = () => (
    <div
      className={`distance-badge distance-badge-pill distance-badge-${category.label.toLowerCase()} ${className}`}
      title={badgeTitle}
      style={{
        backgroundColor: `${category.color}20`, // 20% opacity
        color: category.color,
        borderColor: `${category.color}40` // 40% opacity
      }}
    >
      {showIcon && <span className="distance-badge-icon">{category.icon}</span>}
      {showLabel && (
        <span className="distance-badge-text">
          {displayValue} • {category.label}
        </span>
      )}
    </div>
  );

  const renderDetailed = () => (
    <div
      className={`distance-badge distance-badge-detailed distance-badge-${category.label.toLowerCase()} ${className}`}
      title={badgeTitle}
    >
      <div className="distance-badge-header">
        <span className="distance-badge-icon" style={{ color: category.color }}>
          {category.icon}
        </span>
        <span className="distance-badge-category" style={{ color: category.color }}>
          {category.label}
        </span>
      </div>
      <div className="distance-badge-value">{displayValue}</div>
      <div className="distance-badge-description">
        {distanceUtils.getDistanceDescription(distanceKm, displayUnit)}
      </div>
    </div>
  );

  switch (variant) {
    case 'compact':
      return renderCompact();
    case 'inline':
      return renderInline();
    case 'pill':
      return renderPill();
    case 'detailed':
      return renderDetailed();
    default:
      return renderDefault();
  }
};

// PropTypes equivalent
DistanceBadge.propTypes = {
  distanceKm: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== 'number') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected number, got ${typeof value}.`
      );
    }
  },
  unit: (props, propName, componentName) => {
    const value = props[propName];
    if (value && !['auto', 'km', 'miles'].includes(value)) {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected one of ['auto', 'km', 'miles'].`
      );
    }
  },
  useMiles: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== 'boolean') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected boolean.`
      );
    }
  },
  showIcon: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== 'boolean') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected boolean.`
      );
    }
  },
  showLabel: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== 'boolean') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected boolean.`
      );
    }
  },
  variant: (props, propName, componentName) => {
    const value = props[propName];
    if (value && !['default', 'compact', 'inline', 'pill', 'detailed'].includes(value)) {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected one of ['default', 'compact', 'inline', 'pill', 'detailed'].`
      );
    }
  },
  className: (props, propName, componentName) => {
    const value = props[propName];
    if (value && typeof value !== 'string') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected string.`
      );
    }
  },
  title: (props, propName, componentName) => {
    const value = props[propName];
    if (value && typeof value !== 'string') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected string.`
      );
    }
  }
};

export default DistanceBadge;