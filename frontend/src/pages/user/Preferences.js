import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import GlobalFeedPreferences from '../../components/feed/GlobalFeedPreferences';
import DistanceBadge from '../../components/feed/DistanceBadge';
import feedService from '../../services/feed';
import './Preferences.css';

const Preferences = () => {
  const { user } = useAuth();
  const { showToast } = useApp();

  // SIMPLE STATE - NO HOOK
  const [preferences, setPreferences] = useState(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [showFeedPreferences, setShowFeedPreferences] = useState(false);

  // General preferences
  const [generalPreferences, setGeneralPreferences] = useState({
    theme: 'light',
    language: 'en',
    notifications: { email: true, push: false, sms: false },
    privacy: { profileVisibility: 'public', showOnlineStatus: true, allowMessages: 'everyone' }
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load feed preferences
  useEffect(() => {
    const loadPreferences = async () => {
      setPreferencesLoading(true);
      try {
        const result = await feedService.getPreferences();
        if (result.success) {
          setPreferences(result.data);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setPreferencesLoading(false);
      }
    };

    // Load general preferences from localStorage
    const savedPrefs = localStorage.getItem('kasi_general_preferences');
    if (savedPrefs) {
      try {
        setGeneralPreferences(JSON.parse(savedPrefs));
      } catch (error) {
        console.error('Error loading general preferences:', error);
      }
    }

    loadPreferences();
  }, []);

  // ✅ Update preferences function (used by child components)
  const updatePreferences = async (newPreferences) => {
    try {
      const result = await feedService.updatePreferences(newPreferences);
      if (result.success) {
        setPreferences(result.data);
        showToast('Preferences updated successfully!', 'success');
        return result.data;
      } else {
        showToast('Failed to update preferences', 'error');
        return null;
      }
    } catch (error) {
      console.error('Update preferences error:', error);
      showToast('Failed to update preferences', 'error');
      return null;
    }
  };

  // Toggle distance units
  const toggleDistanceUnits = async () => {
    if (!preferences) return;

    try {
      const updatedPrefs = {
        ...preferences,
        use_miles: !preferences.use_miles,
        useMiles: !preferences.use_miles
      };

      const result = await updatePreferences(updatedPrefs);
      if (result) {
        showToast(`Switched to ${result.use_miles ? 'miles' : 'km'}`, 'success');
      }
    } catch (error) {
      showToast('Failed to toggle distance units', 'error');
    }
  };

  // Reset feed preferences
  const handleResetFeedPreferences = async () => {
    if (!preferences) return;

    try {
      const defaultPrefs = feedService.getDefaultPreferences();
      await updatePreferences(defaultPrefs);
      showToast('Feed preferences reset to defaults', 'success');
    } catch (error) {
      showToast('Failed to reset feed preferences', 'error');
    }
  };

  // Format distance range
  const getFormattedDistanceRange = () => {
    if (!preferences?.distanceRange) return 'Not set';
    if (preferences.distanceRange === 0) return 'Worldwide';
    return feedService.formatDistance(preferences.distanceRange, preferences.useMiles);
  };

  // Get distance category info
  const getCurrentDistanceCategory = () => {
    if (!preferences?.distanceRange) return null;
    return feedService.getDistanceCategory(preferences.distanceRange);
  };

  // Get distance presets
  const getDistancePresets = () => {
    return feedService.getDistancePresets();
  };

  const handleThemeChange = (theme) => {
    setGeneralPreferences(prev => ({
      ...prev,
      theme
    }));
  };

  const handleLanguageChange = (language) => {
    setGeneralPreferences(prev => ({
      ...preferences,
      language
    }));
  };

  const handleNotificationChange = (type) => {
    setGeneralPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handlePrivacyChange = (setting, value) => {
    setGeneralPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [setting]: value
      }
    }));
  };

  const handleSaveGeneralPreferences = () => {
    setSaving(true);

    try {
      // Save to localStorage (in real app, save to API)
      localStorage.setItem('kasi_general_preferences', JSON.stringify(generalPreferences));

      setSaved(true);
      showToast('Preferences saved successfully!', 'success');

      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      showToast('Failed to save preferences', 'error');
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (preferencesLoading) {
    return (
      <div className="preferences-container">
        <div className="preferences-loading">
          <LoadingSpinner size="large" />
          <p>Loading your preferences...</p>
        </div>
      </div>
    );
  }

  const distanceCategory = getCurrentDistanceCategory();
  const distancePresets = getDistancePresets();

  return (
    <div className="preferences-container">
      <div className="preferences-header">
        <h1>Preferences</h1>
        {saved && <div className="save-message">Preferences saved successfully!</div>}
      </div>

      {/* Global Feed Preferences Section */}
      <section className="preference-section preference-section--highlight">
        <div className="section-header">
          <h2>Global Feed Personalization</h2>
          <span className="section-badge">🌍 Global</span>
        </div>

        <div className="feed-preferences-summary">
          {preferences ? (
            <>
              <div className="feed-prefs-status">
                <div className="status-indicator status-active">
                  <span className="status-dot"></span>
                  Personalization Active
                </div>
              </div>

              <div className="feed-prefs-details">
                {/* Distance Range */}
                <div className="pref-detail">
                  <div className="pref-label">
                    <span>📏</span>
                    <span>Distance Range</span>
                  </div>
                  <div className="pref-value">
                    <div className="distance-range-display">
                      {distanceCategory && (
                        <DistanceBadge
                          distanceKm={preferences.distanceRange}
                          useMiles={preferences.useMiles}
                          variant="pill"
                          showIcon={true}
                          showLabel={true}
                        />
                      )}
                      <span className="distance-value">{getFormattedDistanceRange()}</span>
                      <button
                        className="unit-toggle-btn"
                        onClick={toggleDistanceUnits}
                      >
                        Switch to {preferences.useMiles ? 'km' : 'miles'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="pref-detail">
                  <div className="pref-label">
                    <span>🏷️</span>
                    <span>Preferred Categories</span>
                  </div>
                  <div className="pref-value">
                    {preferences.categories && preferences.categories.length > 0 ? (
                      <div className="category-chips">
                        {preferences.categories.map((category, index) => (
                          <span key={index} className="category-chip">
                            {category}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="empty-state">No categories selected</span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="pref-detail">
                  <div className="pref-label">
                    <span>📍</span>
                    <span>Location</span>
                  </div>
                  <div className="pref-value">
                    {preferences.location?.address ? (
                      <span>{preferences.location.address}</span>
                    ) : (
                      <span className="empty-state">Location not set</span>
                    )}
                  </div>
                </div>

                {/* Priority Settings */}
                <div className="pref-detail">
                  <div className="pref-label">
                    <span>⚡</span>
                    <span>Priority Settings</span>
                  </div>
                  <div className="pref-value">
                    <div className="priority-settings">
                      <div className={`priority-setting ${preferences.prioritizeDistance ? 'active' : 'inactive'}`}>
                        <span className="priority-icon">📍</span>
                        <span className="priority-label">Distance Priority</span>
                        <span className="priority-status">{preferences.prioritizeDistance ? 'ON' : 'OFF'}</span>
                      </div>
                      <div className={`priority-setting ${preferences.prioritizeCategories ? 'active' : 'inactive'}`}>
                        <span className="priority-icon">🏷️</span>
                        <span className="priority-label">Category Priority</span>
                        <span className="priority-status">{preferences.prioritizeCategories ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="feed-prefs-actions">
                <Button
                  variant="primary"
                  onClick={() => setShowFeedPreferences(true)}
                  size="medium"
                >
                  Edit Feed Preferences
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetFeedPreferences}
                  size="medium"
                >
                  Reset to Defaults
                </Button>
              </div>
            </>
          ) : (
            <div className="feed-prefs-empty">
              <div className="empty-icon">🎯</div>
              <h3>No Feed Preferences Set</h3>
              <p>Personalize your feed to see content tailored to your interests and location.</p>
              <Button
                variant="primary"
                onClick={() => setShowFeedPreferences(true)}
                size="large"
              >
                Set Up Feed Personalization
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="preferences-sections">
        {/* Theme Preferences */}
        <section className="preference-section">
          <h2>Theme</h2>
          <div className="theme-options">
            <label className="theme-option">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={generalPreferences.theme === 'light'}
                onChange={() => handleThemeChange('light')}
                disabled={saving}
              />
              <span className="theme-label">Light</span>
            </label>
            <label className="theme-option">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={generalPreferences.theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
                disabled={saving}
              />
              <span className="theme-label">Dark</span>
            </label>
            <label className="theme-option">
              <input
                type="radio"
                name="theme"
                value="auto"
                checked={generalPreferences.theme === 'auto'}
                onChange={() => handleThemeChange('auto')}
                disabled={saving}
              />
              <span className="theme-label">Auto</span>
            </label>
          </div>
        </section>

        {/* Language Preferences */}
        <section className="preference-section">
          <h2>Language</h2>
          <select
            value={generalPreferences.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="language-select"
            disabled={saving}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
          </select>
        </section>

        {/* Notification Preferences */}
        <section className="preference-section">
          <h2>Notifications</h2>
          <div className="notification-options">
            <label className="notification-option">
              <input
                type="checkbox"
                checked={generalPreferences.notifications.email}
                onChange={() => handleNotificationChange('email')}
                disabled={saving}
              />
              <span>Email Notifications</span>
            </label>
            <label className="notification-option">
              <input
                type="checkbox"
                checked={generalPreferences.notifications.push}
                onChange={() => handleNotificationChange('push')}
                disabled={saving}
              />
              <span>Push Notifications</span>
            </label>
            <label className="notification-option">
              <input
                type="checkbox"
                checked={generalPreferences.notifications.sms}
                onChange={() => handleNotificationChange('sms')}
                disabled={saving}
              />
              <span>SMS Notifications</span>
            </label>
          </div>
        </section>

        {/* Privacy Preferences */}
        <section className="preference-section">
          <h2>Privacy</h2>
          <div className="privacy-options">
            <div className="privacy-option">
              <label>Profile Visibility</label>
              <select
                value={generalPreferences.privacy.profileVisibility}
                onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                disabled={saving}
              >
                <option value="public">Public</option>
                <option value="friends">Friends Only</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="privacy-option">
              <label>Show Online Status</label>
              <input
                type="checkbox"
                checked={generalPreferences.privacy.showOnlineStatus}
                onChange={(e) => handlePrivacyChange('showOnlineStatus', e.target.checked)}
                disabled={saving}
              />
            </div>

            <div className="privacy-option">
              <label>Allow Messages From</label>
              <select
                value={generalPreferences.privacy.allowMessages}
                onChange={(e) => handlePrivacyChange('allowMessages', e.target.value)}
                disabled={saving}
              >
                <option value="everyone">Everyone</option>
                <option value="friends">Friends Only</option>
                <option value="none">No One</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      <div className="preferences-actions">
        <Button
          className="save-preferences-btn"
          onClick={handleSaveGeneralPreferences}
          loading={saving}
          disabled={saving}
          size="large"
        >
          Save General Preferences
        </Button>
      </div>

      {/* Global Feed Preferences Modal */}
      {showFeedPreferences && (
        <GlobalFeedPreferences
          isOpen={showFeedPreferences}
          onClose={() => setShowFeedPreferences(false)}
          onSave={(updatedPrefs) => {
            showToast('Feed preferences updated successfully!', 'success');
            // The updatePreferences function will handle the update
            updatePreferences(updatedPrefs);
          }}
        />
      )}
    </div>
  );
};

export default Preferences;