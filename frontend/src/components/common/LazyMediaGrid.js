// LazyMediaGrid.js - Fixed image loading
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import LazyImage from './LazyImage';
import LazyVideo from './LazyVideo';
import './LazyMediaGrid.css';

const LazyMediaGrid = ({
  mediaUrls = [],
  mediaMetadata = {},
  postId,
  onMediaClick,
  onMediaError,
  registerVideoElement,
  className = ''
}) => {
  const [mediaErrors, setMediaErrors] = useState({});
  const [mediaDimensions, setMediaDimensions] = useState({});
  const mediaCount = mediaUrls.length;
  const gridRef = useRef(null);

  // Get media type from metadata or filename
  const getMediaType = useCallback((url) => {
    // First check metadata if available
    if (mediaMetadata && mediaMetadata[url]) {
      const type = mediaMetadata[url].type || 'image';
      return type;
    }

    if (Array.isArray(mediaMetadata)) {
      const meta = mediaMetadata.find(m => m.url === url);
      if (meta) {
        return meta.type || 'image';
      }
    }

    // Check file extension
    const filename = url.split('/').pop()?.toLowerCase() || '';
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'mpeg', 'mpg', 'ogg', 'ogv'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];

    const extension = filename.split('.').pop()?.split('?')[0] || '';

    if (videoExtensions.includes(extension)) {
      return 'video';
    }

    if (imageExtensions.includes(extension)) {
      return 'image';
    }

    return 'image';
  }, [mediaMetadata]);

  // Handle dimension updates from media components
  const handleDimensionUpdate = useCallback((url, dimensions) => {
    setMediaDimensions(prev => ({
      ...prev,
      [url]: dimensions
    }));
  }, []);

  // Calculate grid layout based on number of media items
  const getGridLayout = useCallback(() => {
    if (mediaCount === 0) return {};

    if (mediaCount === 1) {
      return {
        display: 'block',
        width: '100%'
      };
    }

    let columns = 2;
    if (mediaCount === 3) {
      columns = 3;
    }

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '4px',
      width: '100%'
    };
  }, [mediaCount]);

  const displayMedia = mediaUrls.slice(0, 4);

  const handleMediaClick = (url, index, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onMediaClick) {
      onMediaClick(url, index);
    }
  };

  const handleError = useCallback((url) => {
    console.log(`❌ Media failed to load: ${url}`);
    setMediaErrors(prev => ({ ...prev, [url]: true }));

    if (onMediaError) {
      onMediaError(url);
    }
  }, [onMediaError]);

  const handleRetry = (url, e) => {
    e.stopPropagation();
    setMediaErrors(prev => ({ ...prev, [url]: false }));
  };

  const getGridClass = () => {
    switch (mediaCount) {
      case 1: return 'lazy-media-grid--single';
      case 2: return 'lazy-media-grid--double';
      case 3: return 'lazy-media-grid--triple';
      default: return 'lazy-media-grid--quad';
    }
  };

  return (
    <div
      ref={gridRef}
      className={`lazy-media-grid ${getGridClass()} ${className}`}
      style={getGridLayout()}
    >
      {displayMedia.map((url, index) => {
        const mediaType = getMediaType(url);
        const hasError = mediaErrors[url];
        const dimensions = mediaDimensions[url];

        if (index === 3 && mediaCount > 4) {
          return (
            <div
              key={`${postId}-${index}`}
              className="lazy-media-grid__item lazy-media-grid__item--more"
              onClick={(e) => handleMediaClick(url, index, e)}
              role="button"
              tabIndex={0}
              aria-label={`View ${mediaCount - 4} more items`}
            >
              <span className="lazy-media-grid__more-count">
                +{mediaCount - 4}
              </span>
            </div>
          );
        }

        if (hasError) {
          return (
            <div
              key={`${postId}-${index}`}
              className="lazy-media-grid__item lazy-media-grid__item--error"
              onClick={(e) => handleMediaClick(url, index, e)}
              role="button"
              tabIndex={0}
            >
              <span className="lazy-media-grid__error-icon">
                {mediaType === 'video' ? '🎬' : '📷'}
              </span>
              <span>Failed to load</span>
              <button
                className="lazy-media-grid__retry"
                onClick={(e) => handleRetry(url, e)}
                aria-label="Retry loading media"
              >
                Retry
              </button>
            </div>
          );
        }

        return (
          <div
            key={`${postId}-${index}`}
            className={`lazy-media-grid__item ${mediaType === 'video' ? 'lazy-media-grid__item--video' : 'lazy-media-grid__item--image'}`}
            onClick={(e) => handleMediaClick(url, index, e)}
            role="button"
            tabIndex={0}
            aria-label={`View ${mediaType} ${index + 1}`}
            style={dimensions && mediaCount === 1 ? {
              maxWidth: dimensions.width ? `${dimensions.width}px` : '100%',
              margin: '0 auto'
            } : {}}
          >
            {mediaType === 'video' ? (
              <LazyVideo
                src={url}
                poster={url}
                loop={true}
                className="lazy-media-grid__video"
                onError={() => handleError(url)}
                onLoad={(dimensions) => handleDimensionUpdate(url, dimensions)}
                preserveDimensions={true}
                registerVideoElement={(el) => registerVideoElement && registerVideoElement(el, index)}
              />
            ) : (
              <LazyImage
                src={url}
                alt={`Post media ${index + 1}`}
                className="lazy-media-grid__image"
                onError={() => handleError(url)}
                onLoad={(dimensions) => handleDimensionUpdate(url, dimensions)}
                preserveDimensions={true}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LazyMediaGrid;