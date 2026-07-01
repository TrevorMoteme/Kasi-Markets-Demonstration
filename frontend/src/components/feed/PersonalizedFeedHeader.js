import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PersonalizationButton from './PersonalizationButton';
import './PersonalizedFeedHeader.css';

const PersonalizedFeedHeader = ({
  stats = {},
  preferences = null,
  hasPreferences = false,
  loading = false,
  updatePreferences = null
}) => {
  const { user } = useAuth();

  // Default stats
  const displayStats = {
    totalPosts: stats.totalPosts || 0,
    withinRange: stats.withinRange || 0,
    categoryMatches: stats.categoryMatches || 0,
    avgScore: stats.avgScore || 0,
    filteringMode: stats.filteringMode || 'prioritized',
    filteredOut: stats.filteredOut || 0,
    performance: stats.performance || 'standard',
    totalPostsReturned: stats.total_posts_returned || stats.totalPosts || 0,
    ...stats
  };

  const getPersonalizationStatus = () => {
    if (!preferences?.enabled) {
      return { label: 'Not Personalized', icon: '⚙️', level: 'none' };
    }

    const hasLocation = preferences.home_latitude && preferences.home_longitude && preferences.enable_distance_prioritization;
    const hasCategories = preferences.preferred_categories?.length > 0 && preferences.enable_category_prioritization;

    if (hasLocation && hasCategories) {
      return { label: 'Fully Personalized', icon: '🎯', level: 'full' };
    } else if (hasLocation || hasCategories) {
      return { label: 'Partially Personalized', icon: '✨', level: 'partial' };
    } else {
      return { label: 'Basic Personalization', icon: '⚙️', level: 'basic' };
    }
  };

  const getActiveFilters = () => {
    const filters = [];

    if (preferences?.enabled) {
      if (preferences.enable_distance_prioritization && preferences.max_distance_km) {
        filters.push({
          key: 'distance',
          label: `Within ${preferences.max_distance_km}km`,
          icon: '📍'
        });
      }

      if (preferences.enable_category_prioritization && preferences.preferred_categories?.length > 0) {
        if (preferences.preferred_categories.length === 1) {
          filters.push({
            key: 'category',
            label: preferences.preferred_categories[0],
            icon: '🏷️'
          });
        } else {
          filters.push({
            key: 'categories',
            label: `${preferences.preferred_categories.length} categories`,
            icon: '🏷️'
          });
        }
      }

      // Filtering mode
      filters.push({
        key: 'filtering-mode',
        label: displayStats.filteringMode === 'strict' ? '🔒 Strict Filtering' : '📊 Prioritized',
        icon: displayStats.filteringMode === 'strict' ? '🔒' : '📊'
      });

      // Performance indicator
      if (displayStats.performance === 'optimized') {
        filters.push({
          key: 'performance',
          label: '⚡ Fast',
          icon: '⚡'
        });
      }
    }

    return filters;
  };

  if (loading && !preferences) {
    return (
      <div className="personalized-feed-header">
        <div className="header-skeleton">
          <div className="skeleton-title"></div>
          <div className="skeleton-stats">
            <div className="skeleton-stat"></div>
            <div className="skeleton-stat"></div>
            <div className="skeleton-stat"></div>
          </div>
        </div>
      </div>
    );
  }

  const status = getPersonalizationStatus();
  const activeFilters = getActiveFilters();

  return (
    <div className="personalized-feed-header">
      <div className="header-content">
        <div className="header-top">
          <div>
            <h1 className="header-title">
              Your Personalized Feed
              {preferences?.enabled && (
                <span className={`personalization-badge ${status.level}`}>
                  {status.icon} {status.label}
                  {displayStats.filteringMode === 'strict' && (
                    <span className="strict-filtering-indicator">🔒</span>
                  )}
                  {displayStats.performance === 'optimized' && (
                    <span className="performance-indicator">⚡</span>
                  )}
                </span>
              )}
            </h1>
            <p className="header-subtitle">
              {preferences?.enabled
                ? `Content tailored to your preferences ${displayStats.performance === 'optimized' ? '(fast filtering enabled)' : ''}`
                : 'Set up personalization to see relevant content'
              }
            </p>
          </div>

          <div className="header-actions">
            <PersonalizationButton
              buttonText={hasPreferences ? "Edit Preferences" : "What are you looking for?"}
              buttonVariant={hasPreferences ? "outline" : "primary"}
              buttonSize="medium"
              buttonIcon={hasPreferences ? "⚙️" : "🎯"}
              showIcon={true}
              showBadge={!hasPreferences}
              badgeText="New"
              modalTitle={hasPreferences ? "Edit Your Preferences" : "Set Up Personalization"}
              showGreeting={true}
              user={user}
              hasPreferences={hasPreferences}
              updatePreferences={updatePreferences}
              className="header-personalization-btn"
            />
          </div>
        </div>

        {hasPreferences && preferences?.enabled ? (
          <>
            <div className="header-stats">
              <div className="stat-item">
                <div className="stat-label">📊 Posts Shown</div>
                <p className="stat-value">{displayStats.totalPostsReturned}</p>
              </div>

              {preferences.enable_distance_prioritization && (
                <div className="stat-item">
                  <div className="stat-label">📍 In Range</div>
                  <p className="stat-value">{displayStats.withinRange}</p>
                </div>
              )}

              {preferences.enable_category_prioritization && preferences.preferred_categories?.length > 0 && (
                <div className="stat-item">
                  <div className="stat-label">🏷️ Category Matches</div>
                  <p className="stat-value">{displayStats.categoryMatches}</p>
                </div>
              )}

              <div className="stat-item">
                <div className="stat-label">⭐ Avg. Relevance</div>
                <p className="stat-value">{Math.round(displayStats.avgScore)}%</p>
              </div>

              {/* Filtering mode indicator */}
              <div className="stat-item">
                <div className="stat-label">🎯 Filtering Mode</div>
                <p className="stat-value">
                  <span className={`filtering-mode-indicator ${displayStats.filteringMode === 'strict' ? 'strict' : 'prioritized'}`}>
                    {displayStats.filteringMode === 'strict' ? '🔒 Strict' : '📊 Prioritized'}
                  </span>
                </p>
              </div>

              {/* Performance indicator */}
              {displayStats.performance && (
                <div className="stat-item">
                  <div className="stat-label">⚡ Performance</div>
                  <p className="stat-value">
                    <span className={`performance-indicator ${displayStats.performance}`}>
                      {displayStats.performance === 'optimized' ? 'Fast' : 'Standard'}
                    </span>
                  </p>
                </div>
              )}

              {/* Filtered posts count */}
              {displayStats.filteredOut > 0 && (
                <div className="stat-item">
                  <div className="stat-label">❌ Filtered Out</div>
                  <p className="stat-value">{displayStats.filteredOut}</p>
                </div>
              )}
            </div>

            {activeFilters.length > 0 && (
              <div className="active-filters">
                {activeFilters.map(filter => (
                  <div key={filter.key} className="filter-chip">
                    {filter.icon} {filter.label}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : hasPreferences && !preferences?.enabled ? (
          <div className="header-empty-state">
            <p>Personalization is turned off. You're seeing all posts.</p>
            <div className="setup-cta">
              <PersonalizationButton
                buttonText="Enable Personalization"
                buttonVariant="primary"
                buttonSize="small"
                buttonIcon="🎯"
                showIcon={true}
                modalTitle="Enable Personalization"
                showGreeting={true}
                user={user}
                hasPreferences={true}
                updatePreferences={updatePreferences}
                className="setup-personalization-btn"
              />
            </div>
          </div>
        ) : (
          <div className="header-empty-state">
            <div className="setup-guide">
              <div className="setup-step">
                <span className="step-icon">1️⃣</span>
                <span className="step-text">Set your location for local recommendations</span>
              </div>
              <div className="setup-step">
                <span className="step-icon">2️⃣</span>
                <span className="step-text">Choose your favorite categories</span>
              </div>
              <div className="setup-step">
                <span className="step-icon">3️⃣</span>
                <span className="step-text">Adjust your preferences</span>
              </div>
            </div>
            <div className="setup-cta">
              <PersonalizationButton
                buttonText="Get Started with Personalization"
                buttonVariant="primary"
                buttonSize="medium"
                buttonIcon="🚀"
                showIcon={true}
                showBadge={true}
                badgeText="New"
                modalTitle="Welcome! Let's Personalize Your Feed"
                showGreeting={true}
                user={user}
                hasPreferences={false}
                updatePreferences={updatePreferences}
                className="get-started-btn"
              />
              <p className="setup-note">
                <small>Personalization helps you discover content that matters to you</small>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedFeedHeader;