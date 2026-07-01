import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';
import './Modal.css';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'medium',
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = ''
}) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const modalContent = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className={`modal modal--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && (
              <h2 id="modal-title" className="modal-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="text"
                size="small"
                onClick={onClose}
                className="modal-close"
                aria-label="Close modal"
              >
                ×
              </Button>
            )}
          </div>
        )}

        <div className="modal-content">
          {children}
        </div>

        {actions && actions.length > 0 && (
          <div className="modal-actions">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                onClick={action.onClick}
                disabled={action.disabled}
                loading={action.loading}
                className={action.className}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modalContent,
    document.getElementById('modal-root') || document.body
  );
};

// Additional modal components for feed preferences support
export const ModalHeader = ({ children, className = '' }) => (
  <div className={`modal-header-custom ${className}`}>
    {children}
  </div>
);

export const ModalBody = ({ children, className = '', scrollable = false }) => (
  <div className={`modal-body ${scrollable ? 'modal-body--scrollable' : ''} ${className}`}>
    {children}
  </div>
);

export const ModalFooter = ({ children, className = '' }) => (
  <div className={`modal-footer ${className}`}>
    {children}
  </div>
);

export const ModalSection = ({ title, children, className = '' }) => (
  <div className={`modal-section ${className}`}>
    {title && <h3 className="modal-section-title">{title}</h3>}
    <div className="modal-section-content">{children}</div>
  </div>
);

// Helper function for feed preferences modal
export const createFeedPreferencesModalActions = (onSave, onCancel, saving = false) => [
  {
    label: 'Cancel',
    variant: 'outline',
    onClick: onCancel,
    disabled: saving
  },
  {
    label: saving ? 'Saving...' : 'Save Preferences',
    variant: 'primary',
    onClick: onSave,
    disabled: saving,
    loading: saving
  }
];

export default Modal;