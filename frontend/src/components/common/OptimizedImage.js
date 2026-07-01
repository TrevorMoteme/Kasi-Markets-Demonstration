// src/components/common/OptimizedImage.js - NO CSS FILE REQUIRED
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const imageCache = new Map();

export const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  width,
  height,
  priority = false,
  lazy = true,
  quality = 'auto',
  onLoad,
  onError,
  placeholderColor = '#1a1a1a',
  objectFit = 'cover',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Check if image is already loaded
  const isCached = useMemo(() => {
    if (!src) return false;
    return imageCache.has(src);
  }, [src]);

  // Generate optimized URL
  const optimizedSrc = useMemo(() => {
    if (!src) return null;
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;

    if (src.includes('cloudinary')) {
      return src.replace('/upload/', `/upload/w_${width || 400},q_${quality},f_auto/`);
    }
    if (src.includes('imgix')) {
      return `${src}?w=${width || 400}&q=${quality}&auto=format`;
    }
    return src;
  }, [src, width, quality]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setLoaded(true);
    if (src) {
      imageCache.set(src, true);
    }
    if (onLoad) onLoad();
  }, [src, onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setError(true);
    if (onError) onError();
  }, [onError]);

  // Setup lazy loading
  useEffect(() => {
    if (priority || !lazy || isCached) {
      if (imgRef.current && optimizedSrc) {
        imgRef.current.src = optimizedSrc;
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && imgRef.current) {
          imgRef.current.src = optimizedSrc;
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [optimizedSrc, priority, lazy, isCached]);

  // Preload high priority images
  useEffect(() => {
    if (priority && optimizedSrc) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedSrc;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, optimizedSrc]);

  // Styles
  const wrapperStyle = {
    position: 'relative',
    overflow: 'hidden',
    background: placeholderColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: width || '100%',
    height: height || '100%'
  };

  const imgStyle = {
    width: '100%',
    height: '100%',
    display: 'block',
    opacity: loaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    objectFit: objectFit
  };

  const loaderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(90deg, ${placeholderColor} 25%, ${placeholderColor}88 50%, ${placeholderColor} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite'
  };

  const fallbackStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: placeholderColor,
    color: '#666',
    fontSize: '32px'
  };

  if (!src) {
    return (
      <div
        className={`optimized-image optimized-image--empty ${className}`}
        style={{ width: width || '100%', height: height || '100%', background: placeholderColor }}
      />
    );
  }

  return (
    <div className={`optimized-image-wrapper ${className}`} style={wrapperStyle}>
      <img
        ref={imgRef}
        alt={alt}
        width={width}
        height={height}
        src={priority ? optimizedSrc : optimizedSrc}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`optimized-image__img ${loaded ? 'optimized-image__img--loaded' : ''} ${error ? 'optimized-image__img--error' : ''}`}
        style={imgStyle}
        {...props}
      />

      {!loaded && !error && (
        <div className="optimized-image__loader" style={loaderStyle} />
      )}

      {error && (
        <div className="optimized-image__fallback" style={fallbackStyle}>
          <span>📷</span>
        </div>
      )}
    </div>
  );
};

// Add keyframe animation to document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .optimized-image__loader {
        animation-duration: 3s !important;
      }
    }
    @media (max-width: 767px) {
      .optimized-image__fallback {
        font-size: 24px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default OptimizedImage;