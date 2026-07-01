import React, { useState } from 'react';
import './PostScoreIndicator.css';
import distanceUtils from '../../utils/distanceUtils';

const PostScoreIndicator = ({ score, breakdown, variant = 'default', distanceKm = null, useMiles = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!score && score !== 0) return null;

  // Convert score to percentage if it's a decimal
  const scorePercentage = score <= 1 ? Math.round(score * 100) : Math.round(score);

  const getScoreColor = (scoreValue) => {
    if (scoreValue >= 80) return 'excellent';
    if (scoreValue >= 60) return 'high';
    if (scoreValue >= 40) return 'medium';
    return 'low';
  };

  const getScoreLabel = (scoreValue) => {
    if (scoreValue >= 80) return 'Excellent';
    if (scoreValue >= 60) return 'High';
    if (scoreValue >= 40) return 'Medium';
    if (scoreValue >= 20) return 'Low';
    return 'Very Low';
  };

  const scoreColor = getScoreColor(scorePercentage);
  const scoreLabel = getScoreLabel(scorePercentage);

  // Format breakdown data for global personalization
  const formatBreakdown = () => {
    if (!breakdown) return null;

    const breakdownItems = [];

    // Distance score (global)
    if (breakdown.distance !== undefined || breakdown.distanceScore !== undefined) {
      const distanceValue = breakdown.distance !== undefined ? breakdown.distance : breakdown.distanceScore;
      const distanceScore = Math.round(distanceValue * 100);
      let distanceDetails = 'Based on proximity to your location';

      if (distanceKm !== null && !isNaN(distanceKm)) {
        const distanceCategory = distanceUtils.getDistanceCategory(distanceKm);
        distanceDetails = `${distanceUtils.formatDistance(distanceKm, useMiles ? 'miles' : 'km')} away (${distanceCategory.label})`;
      }

      breakdownItems.push({
        label: 'Distance',
        value: distanceScore,
        icon: '📍',
        color: '#3182ce',
        details: distanceDetails,
        weight: breakdown.distance_weight || 0.35
      });
    }

    // Category score
    if (breakdown.category !== undefined || breakdown.categoryScore !== undefined) {
      const categoryValue = breakdown.category !== undefined ? breakdown.category : breakdown.categoryScore;
      const categoryScore = Math.round(categoryValue * 100);
      const categoryDetails = breakdown.categoryDetails ||
                             (breakdown.category_match ? 'Matches your preferred categories' : 'Does not match your categories');

      breakdownItems.push({
        label: 'Category',
        value: categoryScore,
        icon: '🏷️',
        color: '#38a169',
        details: categoryDetails,
        weight: breakdown.category_weight || 0.30
      });
    }

    // Engagement score
    if (breakdown.engagement !== undefined || breakdown.engagementScore !== undefined) {
      const engagementValue = breakdown.engagement !== undefined ? breakdown.engagement : breakdown.engagementScore;
      const engagementScore = Math.round(engagementValue * 100);

      breakdownItems.push({
        label: 'Engagement',
        value: engagementScore,
        icon: '🔥',
        color: '#ed8936',
        details: breakdown.engagementDetails || 'Based on likes, comments, and shares',
        weight: breakdown.engagement_weight || 0.25
      });
    }

    // Recency score
    if (breakdown.recency !== undefined || breakdown.recencyScore !== undefined) {
      const recencyValue = breakdown.recency !== undefined ? breakdown.recency : breakdown.recencyScore;
      const recencyScore = Math.round(recencyValue * 100);

      breakdownItems.push({
        label: 'Recency',
        value: recencyScore,
        icon: '🕒',
        color: '#805ad5',
        details: breakdown.recencyDetails || 'Based on how recent the post is',
        weight: breakdown.recency_weight || 0.10
      });
    }

    return breakdownItems;
  };

  const breakdownItems = formatBreakdown();

  // Calculate weighted total for validation
  const calculateWeightedTotal = () => {
    if (!breakdownItems || breakdownItems.length === 0) return scorePercentage;

    let weightedTotal = 0;
    breakdownItems.forEach(item => {
      weightedTotal += item.value * (item.weight || 1/breakdownItems.length);
    });

    return Math.round(weightedTotal);
  };

  const weightedScore = calculateWeightedTotal();

  const renderDefault = () => (
    <div
      className={`post-score-indicator score-${scoreColor}`}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      onClick={() => setShowDetails(!showDetails)}
    >
      <span className="score-label">Relevance:</span>
      <span className="score-value">{scorePercentage}%</span>
      <div className="score-bar">
        <div
          className="score-fill"
          style={{ width: `${scorePercentage}%` }}
        />
      </div>

      {breakdownItems && showDetails && (
        <div className="score-details">
          <div className="detail-header">
            <h4 className="detail-title">Relevance Score Breakdown</h4>
            <span className="detail-total">{scorePercentage}%</span>
          </div>
          <div className="score-breakdown">
            {breakdownItems.map((item, index) => (
              <div key={index} className="score-factor">
                <div className="factor-header">
                  <div className="factor-label">
                    <span className="factor-icon" style={{ color: item.color }}>{item.icon}</span>
                    {item.label}
                    {item.weight && (
                      <span className="factor-weight">({Math.round(item.weight * 100)}%)</span>
                    )}
                  </div>
                  <span className="factor-value">{item.value}%</span>
                </div>
                <div className="factor-bar">
                  <div
                    className="factor-fill"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
                <div className="factor-breakdown">
                  {item.details}
                </div>
              </div>
            ))}
          </div>
          <div className="score-summary">
            <div className="summary-item">
              <span className="summary-label">Weighted Total:</span>
              <span className="summary-value">{weightedScore}%</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Rating:</span>
              <span className={`summary-rating rating-${scoreColor}`}>{scoreLabel}</span>
            </div>
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#6c757d',
            marginTop: '10px',
            fontStyle: 'italic'
          }}>
            Click anywhere to close details
          </div>
        </div>
      )}
    </div>
  );

  const renderCompact = () => (
    <div
      className={`post-score-indicator score-indicator-compact score-${scoreColor}`}
      title={`Relevance: ${scoreLabel} (${scorePercentage}%)`}
    >
      <span className="score-value">{scorePercentage}%</span>
    </div>
  );

  const renderBadge = () => (
    <div
      className={`score-badge score-badge-${scoreColor}`}
      title={`Relevance: ${scoreLabel} (${scorePercentage}%)`}
    >
      {scorePercentage}
    </div>
  );

  const renderInline = () => (
    <span
      className={`score-inline score-${scoreColor}`}
      title={`Relevance: ${scoreLabel} (${scorePercentage}%)`}
    >
      {scorePercentage}% relevant
    </span>
  );

  const renderDetailed = () => (
    <div
      className={`post-score-indicator score-indicator-detailed score-${scoreColor}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="score-header">
        <span className="score-label">Relevance Score</span>
        <span className="score-value">{scorePercentage}%</span>
      </div>
      <div className="score-bar">
        <div
          className="score-fill"
          style={{ width: `${scorePercentage}%` }}
        />
      </div>
      {breakdownItems && (
        <div className="score-breakdown-mini">
          {breakdownItems.map((item, index) => (
            <div key={index} className="breakdown-item">
              <span className="breakdown-icon" style={{ color: item.color }}>{item.icon}</span>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                />
              </div>
              <span className="breakdown-value">{item.value}%</span>
            </div>
          ))}
        </div>
      )}
      {showDetails && breakdownItems && (
        <div className="score-details-popup">
          {breakdownItems.map((item, index) => (
            <div key={index} className="detail-item">
              <div className="detail-header">
                <span className="detail-icon" style={{ color: item.color }}>{item.icon}</span>
                <span className="detail-label">{item.label}</span>
                <span className="detail-value">{item.value}%</span>
              </div>
              <div className="detail-description">{item.details}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  switch (variant) {
    case 'compact':
      return renderCompact();
    case 'badge':
      return renderBadge();
    case 'inline':
      return renderInline();
    case 'detailed':
      return renderDetailed();
    default:
      return renderDefault();
  }
};

// PropTypes equivalent
PostScoreIndicator.propTypes = {
  score: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== 'number') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected number, got ${typeof value}.`
      );
    }
  },
  breakdown: (props, propName, componentName) => {
    const value = props[propName];
    if (value && typeof value !== 'object') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected object.`
      );
    }
  },
  variant: (props, propName, componentName) => {
    const value = props[propName];
    if (value && !['default', 'compact', 'badge', 'inline', 'detailed'].includes(value)) {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected one of ['default', 'compact', 'badge', 'inline', 'detailed'].`
      );
    }
  },
  distanceKm: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== 'number') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected number.`
      );
    }
  },
  useMiles: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== 'boolean') {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. Expected boolean.`
      );
    }
  }
};

export default PostScoreIndicator;