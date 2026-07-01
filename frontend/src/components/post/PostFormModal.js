// src/components/post/PostFormModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDevice } from '../../hooks/useMediaQuery';
import { useApp } from '../../contexts/AppContext';
import PostForm from './PostForm';
import './PostFormModal.css';

const PostFormModal = ({
  isOpen,
  onClose,
  businessId,
  businessName,
  businessLogo,
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

  // Sections configuration for post creation
  const sections = [
    { id: 'basic', title: 'Basic Information', icon: '📝', description: 'Post type, title & content', step: '1 of 3' },
    { id: 'media', title: 'Media', icon: '🖼️', description: 'Images & videos', step: '2 of 3' },
    { id: 'review', title: 'Review', icon: '✅', description: 'Review & publish', step: '3 of 3' }
  ];

  // Save draft to localStorage
  const saveDraft = useCallback((formData) => {
    if (!businessId) return;
    const draftKey = `post_draft_${businessId}`;
    const draft = {
      data: formData,
      timestamp: Date.now(),
      step: currentStep
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [businessId, currentStep]);

  const handleSuccess = (result) => {
    console.log('📦 PostFormModal - Post created:', result);
    console.log('🔍 Business logo in result:', result?.business_logo);
    showToast('Post created successfully', 'success');
    if (onSuccess) onSuccess(result);
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
      <div className={`post-modal-container ${isClosing ? 'closing' : ''}`}>
        <div className="post-modal-overlay" onClick={handleClose} />
        <div className="post-modal-content">
          <button className="post-modal-close-btn" onClick={handleClose}>✕</button>

          <div className="post-modal-header">
            <h2>Create Post</h2>
            <p className="post-modal-subtitle">Share updates with {businessName || 'your audience'}</p>
          </div>

          <div className="post-modal-tabs">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                className={`post-modal-tab ${currentStep === idx ? 'active' : ''}`}
                onClick={() => goToStep(idx)}
              >
                <span className="tab-icon">{section.icon}</span>
                <span className="tab-label">{section.title}</span>
                {idx < currentStep && <span className="tab-check">✓</span>}
              </button>
            ))}
          </div>

          <div className="post-modal-progress">
            <div
              className="post-modal-progress-bar"
              style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
            />
          </div>

          <div className="post-modal-current-section">
            <span className="current-section-title">{sections[currentStep].title}</span>
            <span className="current-section-step">{sections[currentStep].step}</span>
          </div>

          <div className="post-modal-form-content">
            <PostForm
              businessId={businessId}
              onSuccess={handleSuccess}
              onCancel={handleClose}
              isModal={true}
              activeSection={sections[currentStep].id}
              onFormChange={saveDraft}
            />
          </div>

          <div className="post-modal-footer">
            <div className="footer-left">
              {draftSaved && <span className="draft-saved">Draft saved</span>}
            </div>
            <div className="footer-right">
              <button className="btn-cancel" onClick={handleClose}>Cancel</button>
              <button className="btn-save" onClick={() => document.getElementById('post-form-submit')?.click()}>
                Publish Post
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MOBILE: Drawer with stepped navigation
  return (
    <>
      <div className={`post-drawer-container ${isClosing ? 'closing' : ''}`}>
        <div className="post-drawer-overlay" onClick={handleClose} />

        <div
          ref={drawerRef}
          className="post-drawer-content"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="post-drawer-drag-handle">
            <div className="drag-bar" />
          </div>

          <div className="post-drawer-header">
            <button className="post-drawer-back-btn" onClick={handleClose}>Back</button>
            <div className="post-drawer-progress">
              <span className="drawer-step-current">{currentStep + 1}</span>
              <span className="drawer-step-total">/{sections.length}</span>
            </div>
          </div>

          <div className="post-drawer-section-indicator">
            <div className="indicator-badge">{sections[currentStep].step}</div>
            <h3 className="indicator-title">{sections[currentStep].title}</h3>
            <p className="indicator-description">{sections[currentStep].description}</p>
          </div>

          <div className="post-drawer-progress-bar-container">
            <div
              className="post-drawer-progress-fill"
              style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
            />
          </div>

          <div className="post-drawer-nav-chips">
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

          <div className={`post-drawer-form-content ${direction}`}>
            <PostForm
              businessId={businessId}
              onSuccess={handleSuccess}
              onCancel={handleClose}
              isModal={true}
              activeSection={sections[currentStep].id}
              onFormChange={saveDraft}
            />
          </div>

          <div className="post-drawer-footer">
            {currentStep > 0 && (
              <button className="drawer-nav-prev" onClick={prevStep}>Back</button>
            )}
            {currentStep < sections.length - 1 ? (
              <button className="drawer-nav-next" onClick={nextStep}>Continue</button>
            ) : (
              <button className="drawer-nav-submit" onClick={() => document.getElementById('post-form-submit')?.click()}>
                Publish Post
              </button>
            )}
          </div>

          {currentStep > 0 && currentStep < sections.length - 1 && (
            <div className="post-drawer-swipe-hint">← Swipe to navigate →</div>
          )}
        </div>
      </div>

      {draftSaved && <div className="draft-toast">Draft auto-saved</div>}
    </>
  );
};

export default PostFormModal;