import React, { useEffect, useRef, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './InfiniteScroll.css';

/**
 * Infinite scroll component using intersection observer
 * @param {Object} props
 * @param {boolean} props.hasMore - Whether there's more data to load
 * @param {boolean} props.loading - Whether currently loading
 * @param {Function} props.onLoadMore - Function to call when loading more
 * @param {React.ReactNode} props.children - Content to render
 * @param {React.ReactNode} props.loader - Custom loader component
 * @param {string} props.rootMargin - Intersection root margin
 * @param {number} props.threshold - Intersection threshold
 * @param {boolean} props.useWindow - Use window as scroll container
 * @param {string} props.className - Additional CSS classes
 */
const InfiniteScroll = ({
  hasMore = false,
  loading = false,
  onLoadMore,
  children,
  loader = <LoadingSpinner size="medium" />,
  rootMargin = '200px',
  threshold = 0.1,
  useWindow = true,
  className = ''
}) => {
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const handleObserver = useCallback((entries) => {
    const [entry] = entries;

    if (entry.isIntersecting && hasMore && !loading && !loadingRef.current) {
      loadingRef.current = true;
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: useWindow ? null : element.parentElement,
      rootMargin,
      threshold
    });

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin, threshold, useWindow]);

  // Reset loading ref when hasMore changes
  useEffect(() => {
    if (!hasMore) {
      loadingRef.current = false;
    }
  }, [hasMore]);

  return (
    <div className={`infinite-scroll ${className}`}>
      {children}

      <div
        ref={sentinelRef}
        className="infinite-scroll__sentinel"
        style={{ height: '1px', width: '100%' }}
      />

      {loading && (
        <div className="infinite-scroll__loader">
          {loader}
        </div>
      )}

      {!hasMore && !loading && (
        <div className="infinite-scroll__end">
          <span className="infinite-scroll__end-message">
            You've reached the end
          </span>
        </div>
      )}
    </div>
  );
};

export default InfiniteScroll;