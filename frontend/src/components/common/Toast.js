import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import './Toast.css';

const Toast = () => {
  const { toast, clearToast } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);

      // Auto hide after 5 seconds (matches AppContext timeout)
      const timer = setTimeout(() => {
        setVisible(false);
        // Wait for fade out animation before clearing
        setTimeout(() => clearToast(), 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (!toast || !visible) return null;

  const getToastIcon = () => {
    switch (toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`toast toast--${toast.type} ${visible ? 'toast--visible' : ''}`}>
      <div className="toast__icon">{getToastIcon()}</div>
      <div className="toast__content">
        <div className="toast__message">{toast.message}</div>
      </div>
      <button
        className="toast__close"
        onClick={() => {
          setVisible(false);
          setTimeout(() => clearToast(), 300);
        }}
        aria-label="Close toast"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;


