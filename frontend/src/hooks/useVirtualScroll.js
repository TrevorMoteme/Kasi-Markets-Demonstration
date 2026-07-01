// src/hooks/useVirtualScroll.js
// Complete Virtual Scrolling Hook for Feed Performance

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export const useVirtualScroll = (items, options = {}) => {
  const {
    itemHeight = 300,
    overscan = 2,
    containerHeight = window.innerHeight,
    scrollThreshold = 200
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightState, setContainerHeightState] = useState(containerHeight);
  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const rafIdRef = useRef(null);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeightState / itemHeight) + overscan;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan);

  // Get visible items with virtual indices
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      _virtualIndex: startIndex + index,
      _offsetY: (startIndex + index) * itemHeight,
      _key: item.id || `virtual-${startIndex + index}`
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  // Handle scroll events with RAF for performance
  const handleScroll = useCallback((e) => {
    const target = e.target;
    const newScrollTop = target.scrollTop;

    // Cancel any pending RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Use RAF for smooth scrolling
    rafIdRef.current = requestAnimationFrame(() => {
      setScrollTop(newScrollTop);
    });
  }, []);

  // Update container height on resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      const height = container.clientHeight;
      if (height > 0) {
        setContainerHeightState(height);
      }
    };

    // Use ResizeObserver for better performance
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => updateHeight());
      observer.observe(container);
      resizeObserverRef.current = observer;
    }

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Scroll to a specific index
  const scrollToIndex = useCallback((index) => {
    const container = containerRef.current;
    if (!container) return;

    const targetScroll = index * itemHeight;
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  }, [itemHeight]);

  // Check if near bottom (for infinite scroll)
  const isNearBottom = useMemo(() => {
    const container = containerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollTop + clientHeight >= scrollHeight - scrollThreshold;
  }, [scrollTop, scrollThreshold]);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollTop,
    isNearBottom,
    scrollToIndex,
    itemHeight,
    visibleCount
  };
};

// ===== HOOK FOR INFINITE SCROLL TRIGGER =====
export const useInfiniteScroll = (callback, hasMore, loading) => {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loading || isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isFetching) {
          setIsFetching(true);
          callback().finally(() => {
            setIsFetching(false);
          });
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, callback, isFetching]);

  return { sentinelRef, isFetching };
};

export default useVirtualScroll;