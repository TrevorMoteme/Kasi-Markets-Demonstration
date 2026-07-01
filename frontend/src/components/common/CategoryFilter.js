// CategoryFilter.js - Updated to match Business Profile design language
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { businessService } from '../../services/business';
import './CategoryFilter.css';

// Category icons mapping
const CATEGORY_ICONS = {
  'Restaurants/Cafes': '🍽️',
  'Retail stores': '🛍️',
  'Services (plumbing, electric, etc.)': '🔧',
  'Entertainment venues': '🎭',
  'Health & wellness': '🧘',
  'All': '📂'
};

// Loading messages (cinematic feel)
const LOADING_MESSAGES = [
  'Loading categories...',
  'Finding your interests...',
  'Organizing content...',
  'Almost ready...'
];

const CategoryFilter = ({
  selectedCategory,
  onCategoryChange,
  showAll = true,
  showCounts = false,
  className = ''
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryStats, setCategoryStats] = useState({});
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  // Rotate loading messages
  useEffect(() => {
    if (loading) {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[index]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const categoriesList = await businessService.getCategories();
      setCategories(categoriesList);

      if (showCounts) {
        const stats = await businessService.getCategoryStats();
        const statsMap = {};
        stats.forEach(stat => {
          statsMap[stat.category] = stat;
        });
        setCategoryStats(statsMap);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Show retry option instead of hardcoded fallback
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [showCounts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCategoryClick = useCallback((category) => {
    if (category === selectedCategory) {
      onCategoryChange(null);
    } else {
      onCategoryChange(category);
    }
  }, [selectedCategory, onCategoryChange]);

  const getCategoryDisplayName = useCallback((category) => {
    if (category.includes('/')) {
      return category;
    }
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  const getCategoryIcon = useCallback((category) => {
    return CATEGORY_ICONS[category] || '📌';
  }, []);

  // Memoize total count for performance
  const totalCount = useMemo(() => {
    return Object.values(categoryStats).reduce((sum, stat) => sum + (stat.post_count || 0), 0);
  }, [categoryStats]);

  // Handle retry
  const handleRetry = useCallback(() => {
    loadCategories();
  }, [loadCategories]);

  if (loading) {
    return (
      <div className={`category-filter ${className}`}>
        <div className="category-filter__loading">
          <div className="loading-spinner"></div>
          <span className="category-filter__loading-message">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={`category-filter ${className}`}>
        <div className="category-filter__loading">
          <span style={{ fontSize: '2rem', marginBottom: '8px' }}>🔌</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
            Could not load categories
          </span>
          <button
            onClick={handleRetry}
            style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: 'white',
              padding: '8px 20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.85rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(139, 92, 246, 0.2)';
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`category-filter ${className}`}>
      <div className="category-filter__list">
        {/* All Categories */}
        {showAll && (
          <button
            className={`category-filter__item ${!selectedCategory ? 'category-filter__item--active' : ''}`}
            onClick={() => onCategoryChange(null)}
            aria-selected={!selectedCategory}
            role="tab"
          >
            <span className="category-filter__icon">{getCategoryIcon('All')}</span>
            <span className="category-filter__label">All Categories</span>
            {showCounts && totalCount > 0 && (
              <span className="category-filter__count">{totalCount}</span>
            )}
          </button>
        )}

        {/* Category List */}
        {categories.map((category) => {
          const displayName = getCategoryDisplayName(category);
          const stats = categoryStats[category] || {};
          const isActive = selectedCategory === category;

          return (
            <button
              key={category}
              className={`category-filter__item ${isActive ? 'category-filter__item--active' : ''}`}
              onClick={() => handleCategoryClick(category)}
              aria-selected={isActive}
              role="tab"
              title={`Browse ${displayName}`}
            >
              <span className="category-filter__icon">{getCategoryIcon(category)}</span>
              <span className="category-filter__label">{displayName}</span>
              {showCounts && stats.post_count > 0 && (
                <span className="category-filter__count">{stats.post_count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(CategoryFilter);