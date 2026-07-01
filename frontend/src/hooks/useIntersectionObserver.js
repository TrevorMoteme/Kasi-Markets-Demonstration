import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Intersection Observer to detect when elements enter viewport
 * Optimized for video auto-play on scroll
 * @param {Object} options - Intersection Observer options
 * @param {number} options.threshold - Threshold (0-1) for when to trigger (0.5 = 50% visible)
 * @param {string} options.rootMargin - Root margin (e.g., "50px 0px")
 * @param {boolean} options.triggerOnce - Whether to unobserve after first trigger (false for continuous)
 * @returns {[React.RefObject, boolean]} - Ref to attach and visibility state
 */
const useIntersectionObserver = (options = {}) => {
  const {
    threshold = 0.5, // 50% visible before triggering - good for videos
    rootMargin = '50px 0px', // Preload slightly before entering
    triggerOnce = false // Keep observing for continuous play/pause
  } = options;

  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef(null);

  const handleIntersect = useCallback((entries) => {
    entries.forEach((entry) => {
      const isIntersecting = entry.isIntersecting;

      if (isIntersecting) {
        setIsVisible(true);
        // If triggerOnce, unobserve after first trigger
        if (triggerOnce && observerRef.current) {
          observerRef.current.unobserve(entry.target);
        }
      } else {
        // Only set to false if we're not in triggerOnce mode
        if (!triggerOnce) {
          setIsVisible(false);
        }
      }
    });
  }, [triggerOnce]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin
    });

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce, handleIntersect]);

  return [elementRef, isVisible];
};

export default useIntersectionObserver;