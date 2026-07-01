// src/components/common/BusinessFormModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDevice } from '../../hooks/useMediaQuery';
import { useApp } from '../../contexts/AppContext';
import BusinessForm from '../business/BusinessForm';
import './BusinessFormModal.css';

const BusinessFormModal = ({
  isOpen,
  onClose,
  business,
  mode = 'edit',
  onSuccess
}) => {
  const { isMobile } = useDevice();
  const { showToast } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [isClosing, setIsClosing] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const drawerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Sections configuration with clear names for better UX
  const sections = [
    { id: 'basic', title: 'Basic Information', description: 'Business name, description & details', step: '1 of 7' },
    { id: 'media', title: 'Media', description: 'Logo & background image', step: '2 of 7' },
    { id: 'category', title: 'Category', description: 'Business type & classification', step: '3 of 7' },
    { id: 'contact', title: 'Contact Details', description: 'Phone, email & website', step: '4 of 7' },
    { id: 'location', title: 'Location', description: 'Address & coordinates', step: '5 of 7' },
    { id: 'hours', title: 'Operating Hours', description: 'Business schedule & special hours', step: '6 of 7' },
    { id: 'tags', title: 'Tags', description: 'Keywords for discovery', step: '7 of 7' }
  ];

  // Save draft to localStorage
  const saveDraft = useCallback((formData) => {
    if (!business?.id) return;
    const draftKey = `business_draft_${business.id}`;
    const draft = {
      data: formData,
      timestamp: Date.now(),
      step: currentStep
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [business?.id, currentStep]);

  const handleSuccess = (updatedBusiness) => {
    showToast('Business updated successfully', 'success');
    if (onSuccess) onSuccess(updatedBusiness);
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setCurrentStep(0);
    }, 300);
  };

  const nextStep = () => {
    if (currentStep < sections.length - 1) {
      setDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step) => {
    setDirection(step > currentStep ? 'forward' : 'backward');
    setCurrentStep(step);
  };

  // Handle swipe gestures for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const swipeDistance = touchEndX.current - touchStartX.current;
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0 && currentStep > 0) {
        prevStep();
      } else if (swipeDistance < 0 && currentStep < sections.length - 1) {
        nextStep();
      }
    }
  };

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft' && !isMobile && currentStep > 0) prevStep();
      if (e.key === 'ArrowRight' && !isMobile && currentStep < sections.length - 1) nextStep();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, isMobile]);

  // Prevent body scroll when modal/drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // DESKTOP: Modal with tabs
  if (!isMobile) {
    return (
      <div className={`business-modal-container ${isClosing ? 'closing' : ''}`}>
        <div className="business-modal-overlay" onClick={handleClose} />
        <div className="business-modal-content">
          <button className="modal-close-btn" onClick={handleClose}>✕</button>

          <div className="business-modal-header">
            <h2>Edit Business Profile</h2>
            <p className="modal-subtitle">Update your business information</p>
          </div>

          <div className="business-modal-tabs">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                className={`modal-tab ${currentStep === idx ? 'active' : ''}`}
                onClick={() => goToStep(idx)}
              >
                <span className="tab-label">{section.title}</span>
                {idx < currentStep && <span className="tab-check">✓</span>}
              </button>
            ))}
          </div>

          <div className="business-modal-progress">
            <div
              className="business-modal-progress-bar"
              style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
            />
          </div>

          {/* Current section indicator */}
          <div className="business-modal-current-section">
            <span className="current-section-title">{sections[currentStep].title}</span>
            <span className="current-section-step">{sections[currentStep].step}</span>
          </div>

          <div className="business-modal-form-content">
            <BusinessForm
              business={business}
              mode={mode}
              onSuccess={handleSuccess}
              onCancel={handleClose}
              showLocationCard={false}
              showDrawer={false}
              showBottomNav={false}
              compactMode={true}
              activeSection={sections[currentStep].id}
              onFormChange={saveDraft}
            />
          </div>

          <div className="business-modal-footer">
            <div className="footer-left">
              {draftSaved && <span className="draft-saved">Draft saved</span>}
            </div>
            <div className="footer-right">
              <button className="btn-cancel" onClick={handleClose}>Cancel</button>
              <button className="btn-save" onClick={() => document.getElementById('business-form-submit')?.click()}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MOBILE: Right Drawer with stepped navigation
  return (
    <>
      <div className={`business-drawer-container ${isClosing ? 'closing' : ''}`}>
        <div className="business-drawer-overlay" onClick={handleClose} />

        <div
          ref={drawerRef}
          className="business-drawer-content"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="drawer-drag-handle">
            <div className="drag-bar" />
          </div>

          <div className="drawer-header">
            <button className="drawer-back-btn" onClick={handleClose}>Back</button>
            <div className="drawer-progress">
              <span className="drawer-step-current">{currentStep + 1}</span>
              <span className="drawer-step-total">/{sections.length}</span>
            </div>
          </div>

          {/* Current section indicator with clear naming */}
          <div className="drawer-section-indicator">
            <div className="indicator-badge">{sections[currentStep].step}</div>
            <h3 className="indicator-title">{sections[currentStep].title}</h3>
            <p className="indicator-description">{sections[currentStep].description}</p>
          </div>

          <div className="drawer-progress-bar-container">
            <div
              className="drawer-progress-fill"
              style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
            />
          </div>

          <div className="drawer-nav-chips">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                className={`nav-chip ${currentStep === idx ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
                onClick={() => goToStep(idx)}
              >
                {idx < currentStep ? '✓' : ''}
                <span>{section.title}</span>
              </button>
            ))}
          </div>

          <div className={`drawer-form-content ${direction}`}>
            <BusinessForm
              business={business}
              mode={mode}
              onSuccess={handleSuccess}
              onCancel={handleClose}
              showLocationCard={false}
              showDrawer={false}
              showBottomNav={false}
              compactMode={true}
              activeSection={sections[currentStep].id}
              onFormChange={saveDraft}
            />
          </div>

          <div className="drawer-footer">
            {currentStep > 0 && (
              <button className="drawer-nav-prev" onClick={prevStep}>Back</button>
            )}
            {currentStep < sections.length - 1 ? (
              <button className="drawer-nav-next" onClick={nextStep}>Continue</button>
            ) : (
              <button className="drawer-nav-submit" onClick={() => document.getElementById('business-form-submit')?.click()}>
                Publish Changes
              </button>
            )}
          </div>

          {currentStep > 0 && currentStep < sections.length - 1 && (
            <div className="drawer-swipe-hint">← Swipe to navigate →</div>
          )}
        </div>
      </div>

      {draftSaved && <div className="draft-toast">Draft auto-saved</div>}
    </>
  );
};

export default BusinessFormModal;