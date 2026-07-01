// Drawer.js - Enhanced with bottom position support and swipe gestures
import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Drawer.css';

const Drawer = ({
  isOpen,
  onClose,
  children,
  position = 'right',
  width = '320px',
  height = 'auto',
  showHandle = false,
  closeOnBackdrop = true,
  closeOnSwipe = true
}) => {
  const drawerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // Handle escape key
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [handleEscapeKey]);

  // Handle swipe to close (for bottom position)
  const handleTouchStart = useCallback((e) => {
    if (position !== 'bottom' || !closeOnSwipe) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [position, closeOnSwipe]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || position !== 'bottom' || !closeOnSwipe) return;
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0 && drawerRef.current) {
      // Only allow downward swipe
      const translateY = Math.min(deltaY, 300);
      drawerRef.current.style.transform = `translateY(${translateY}px)`;
    }
  }, [position, closeOnSwipe]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || position !== 'bottom' || !closeOnSwipe) return;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 100) {
      // Swiped down enough to close
      onClose();
    }

    // Reset position
    if (drawerRef.current) {
      drawerRef.current.style.transform = '';
    }
    isDragging.current = false;
    startY.current = 0;
    currentY.current = 0;
  }, [position, closeOnSwipe, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  if (!isOpen) return null;

  const drawerClassName = `drawer drawer--${position}`;
  const drawerStyle = position === 'bottom'
    ? { height, maxHeight: height }
    : { width };

  return createPortal(
    <div className="drawer-overlay" onClick={handleBackdropClick}>
      <div
        ref={drawerRef}
        className={drawerClassName}
        style={drawerStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {position === 'bottom' && showHandle && (
          <div className="drawer__handle">
            <div className="drawer__handle-bar" />
          </div>
        )}
        <div className="drawer__content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Drawer;