import React, { useState } from 'react';
import Button from '../common/Button';
import FeedPreferencesModal from './FeedPreferencesModal';
import './PersonalizationButton.css';

const PersonalizationButton = ({
  // Button configuration
  buttonText = "What are you looking for?",
  buttonVariant = "primary",
  buttonSize = "medium",
  buttonIcon = "🎯",
  showIcon = true,
  showBadge = false,
  badgeText = "New",
  className = "",

  // Modal configuration
  modalTitle = "Personalize Your Feed",
  showGreeting = true,

  // Callbacks
  onPreferencesSaved = null,
  onButtonClick = null,

  // User state
  user = null,
  hasPreferences = false,

  // ✅ CRITICAL: Direct function from parent component
  updatePreferences = null
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleButtonClick = () => {
    console.log('🖱️ PersonalizationButton clicked');

    // Call custom callback if provided
    if (onButtonClick) {
      onButtonClick();
    }

    // Open preferences modal
    setShowModal(true);
  };

  const handlePreferencesSaved = (preferences) => {
    console.log('💾 Preferences saved in PersonalizationButton:', preferences);
    setShowModal(false);

    // Call custom callback if provided
    if (onPreferencesSaved) {
      onPreferencesSaved(preferences);
    }
  };

  const handleModalClose = () => {
    console.log('🚪 Closing modal from PersonalizationButton');
    setShowModal(false);
  };

  const getButtonContent = () => (
    <>
      {showIcon && <span className="personalization-button-icon">{buttonIcon}</span>}
      <span className="personalization-button-text">{buttonText}</span>
      {showBadge && (
        <span className="personalization-button-badge">{badgeText}</span>
      )}
    </>
  );

  const getGreetingMessage = () => {
    if (!user || !showGreeting) return null;

    const hour = new Date().getHours();
    let greeting = 'Hello';

    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    return `${greeting}, ${user.username || 'there'}! Let's personalize your feed.`;
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleButtonClick}
        className={`personalization-button ${className} ${
          hasPreferences ? 'has-preferences' : 'no-preferences'
        }`}
        title={hasPreferences ? "Edit your feed preferences" : "Set up personalized recommendations"}
        style={{ cursor: 'pointer' }}
      >
        {getButtonContent()}
      </Button>

      {/* ✅ CRITICAL: Pass updatePreferences to modal */}
      <FeedPreferencesModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSave={handlePreferencesSaved}
        title={modalTitle}
        greeting={getGreetingMessage()}
        user={user}
        existingPreferences={hasPreferences}
        updatePreferences={updatePreferences} // ✅ PASSED HERE
      />
    </>
  );
};

// Configuration constants for easy reuse
PersonalizationButton.config = {
  variants: {
    DEFAULT: {
      text: "What are you looking for?",
      variant: "primary",
      icon: "🎯",
      size: "medium"
    },
    DISCOVER: {
      text: "Discover Personalized Content",
      variant: "secondary",
      icon: "✨",
      size: "large"
    },
    SETUP: {
      text: "Set Up Personalization",
      variant: "outline",
      icon: "⚙️",
      size: "small"
    },
    QUICK: {
      text: "Quick Setup",
      variant: "primary",
      icon: "🚀",
      size: "small",
      showBadge: true,
      badgeText: "New"
    }
  },

  modalTitles: {
    DEFAULT: "Personalize Your Feed",
    SETUP: "Set Up Your Personalized Feed",
    EDIT: "Edit Feed Preferences",
    QUICK: "Quick Personalization Setup"
  }
};

export default PersonalizationButton;