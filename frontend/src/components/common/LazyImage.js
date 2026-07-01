// LazyImage.js - Simplified like PostModal (no infinite loops)
import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.css';

const LazyImage = ({
  src,
  alt,
  className = '',
  onLoad,
  onError,
  preserveDimensions = true,
  priority = false
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const imgRef = useRef(null);
  const mountedRef = useRef(true);
  const loadAttemptedRef = useRef(false);
  const currentSrcRef = useRef(src);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reset when src changes - but only if it's actually different
  useEffect(() => {
    if (currentSrcRef.current !== src) {
      currentSrcRef.current = src;
      setLoaded(false);
      setError(false);
      setImageDimensions({ width: 0, height: 0 });
      loadAttemptedRef.current = false;
    }
  }, [src]);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || loadAttemptedRef.current || !src) return;

    // Mark that we've attempted to load this src
    loadAttemptedRef.current = true;

    const handleLoad = () => {
      if (!mountedRef.current) return;

      console.log('✅ Image loaded:', src.substring(0, 50) + '...');
      setLoaded(true);
      setError(false);

      if (preserveDimensions) {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }

      if (onLoad) onLoad({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    const handleError = () => {
      if (!mountedRef.current) return;
      console.error('❌ Image failed:', src.substring(0, 50) + '...');
      setError(true);
      if (onError) onError();
    };

    // Check if already loaded (browser cache)
    if (img.complete && img.naturalWidth > 0) {
      handleLoad();
    } else {
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src, onLoad, onError, preserveDimensions]);

  // Calculate container style - mimicking PostModal
  const getContainerStyle = () => {
    const style = {
      position: 'relative',
      width: '100%',
      backgroundColor: '#f5f5f5',
      minHeight: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    };

    // Like PostModal, constrain dimensions but don't force aspect ratio
    if (preserveDimensions && imageDimensions.width && imageDimensions.height) {
      style.maxWidth = `${imageDimensions.width}px`;
      style.margin = '0 auto';
    }

    return style;
  };

  return (
    <div
      className={`lazy-image-container ${className} ${!loaded && !error ? 'lazy-image--loading' : ''} ${error ? 'lazy-image--error' : ''}`}
      style={getContainerStyle()}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
          objectFit: 'contain', // Like PostModal's objectFit: 'contain'
        }}
        loading={priority ? 'eager' : 'lazy'}
      />

      {!loaded && !error && (
        <div className="lazy-image-placeholder">
          <div className="lazy-image-spinner"></div>
          <span>Loading image...</span>
        </div>
      )}

      {error && (
        <div className="lazy-image-error">
          <span className="lazy-image-error-icon">❌</span>
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;