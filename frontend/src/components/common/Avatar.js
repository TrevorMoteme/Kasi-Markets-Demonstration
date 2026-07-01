import React from 'react';
import './Avatar.css';

const Avatar = ({ src, alt, size = 'medium', hasStory = false, isViewed = false, onClick, className = '' }) => {
  const sizeMap = {
    xsmall: 28,
    small: 32,
    medium: 44,
    large: 56,
    xlarge: 77
  };

  const pixelSize = sizeMap[size] || 44;
  const storySize = pixelSize + 4;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const content = src ? (
    <img
      src={src}
      alt={alt || 'Avatar'}
      className="ig-avatar-img"
      style={{ width: pixelSize, height: pixelSize }}
      onError={(e) => {
        e.target.style.display = 'none';
        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
      }}
    />
  ) : (
    <div
      className="ig-avatar-placeholder"
      style={{ width: pixelSize, height: pixelSize, fontSize: pixelSize * 0.4 }}
    >
      {getInitials(alt)}
    </div>
  );

  if (hasStory) {
    return (
      <div
        className={`ig-story-ring ${isViewed ? 'ig-viewed' : ''} ${className}`}
        style={{ width: storySize, height: storySize }}
        onClick={onClick}
        role="button"
        tabIndex={0}
      >
        <div className="ig-story-ring-inner">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {content}
    </div>
  );
};

export default Avatar;