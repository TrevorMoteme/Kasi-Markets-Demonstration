// src/components/search/SearchModal.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDevice } from '../../hooks/useMediaQuery';
import { useApp } from '../../contexts/AppContext';
import {
  BUSINESS_CATEGORIES_ENHANCED,
  getCategoryDisplayName,
  getCategoryIcon
} from '../../utils/constants';
import { mapOldCategoryToId, getAllCategoryIds } from '../../utils/categoryConstants';
import { getCurrentPosition } from '../../utils/geolocation';
import './SearchModal.css';

const SearchModal = ({
  isOpen,
  onClose,
  onSearch,
  initialParams = null,
  loading = false
}) => {
  const { isMobile } = useDevice();
  const { showToast } = useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [isClosing, setIsClosing] = useState(false);
  const drawerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Section configuration
  const sections = [
    { id: 'scale', title: 'Search Scale', step: '1 of 4' },
    { id: 'criteria', title: 'Search Criteria', step: '2 of 4' },
    { id: 'distance', title: 'Distance & Location', step: '3 of 4' },
    { id: 'review', title: 'Review & Search', step: '4 of 4' }
  ];

  // Search state
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: '',
    city: '',
    tags: '',
    max_distance_km: 50
  });
  const [searchScale, setSearchScale] = useState('local');
  const [userLocation, setUserLocation] = useState(null);
  const [useLocation, setUseLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [enableSmartSearch, setEnableSmartSearch] = useState(true);

  const SEARCH_SCALES = {
    local: { id: 'local', label: 'Local Search', maxKm: 2500, description: 'Search within your region' },
    continental: { id: 'continental', label: 'Continental Search', maxKm: 10500, description: 'Search across continents' },
    global: { id: 'global', label: 'Global Search', maxKm: 45000, description: 'Search worldwide' }
  };

  const currentScale = SEARCH_SCALES[searchScale];

  const mainCategories = Object.entries(BUSINESS_CATEGORIES_ENHANCED)
    .map(([key, category]) => ({
      id: key,
      label: category.label,
      displayName: getCategoryDisplayName(key)
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const groupSubcategories = selectedCategoryGroup
    ? BUSINESS_CATEGORIES_ENHANCED[selectedCategoryGroup]?.subcategories || []
    : [];

  const distancePresets = [
    { value: 0, label: 'Anywhere' },
    { value: 5, label: 'Walking' },
    { value: 10, label: 'Local' },
    { value: 50, label: 'Metro' },
    { value: 200, label: 'Regional' },
    { value: 1000, label: 'National' }
  ];

  // Navigation
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

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setCurrentStep(0);
    }, 300);
  };

  // Handle swipe gestures
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

  // Keyboard shortcuts
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

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Load initial params
  useEffect(() => {
    if (isOpen && initialParams) {
      // Map category if needed (convert display name to ID)
      let mappedCategory = initialParams.category || '';
      if (mappedCategory && !getAllCategoryIds().includes(mappedCategory)) {
        mappedCategory = mapOldCategoryToId(mappedCategory);
      }

      setSearchParams({
        query: initialParams.query || '',
        category: mappedCategory,
        city: initialParams.city || '',
        tags: initialParams.tags ? initialParams.tags.join(', ') : '',
        max_distance_km: initialParams.max_distance_km || 50
      });
      setSearchScale(initialParams.search_category || 'local');
      setUseLocation(!!initialParams.latitude);
      if (initialParams.latitude) {
        setUserLocation({
          latitude: initialParams.latitude,
          longitude: initialParams.longitude
        });
      }
      setEnableSmartSearch(initialParams.search_type !== 'advanced');
    }
  }, [isOpen, initialParams]);

  // Form handlers
  const handleSearchChange = (field, value) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
  };

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const position = await getCurrentPosition();
      setUserLocation({
        latitude: position.latitude,
        longitude: position.longitude
      });
      setUseLocation(true);
      showToast('Location detected successfully!', 'success');
    } catch (error) {
      showToast(error.message, 'error');
      setUseLocation(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleDistanceChange = (value) => {
    const numValue = parseInt(value) || 0;
    const maxDistance = currentScale.maxKm;
    const clampedValue = Math.max(0, Math.min(maxDistance, numValue));
    setSearchParams(prev => ({ ...prev, max_distance_km: clampedValue }));
  };

  const toggleDistanceUnit = () => {
    const newUnit = distanceUnit === 'km' ? 'miles' : 'km';
    setDistanceUnit(newUnit);
  };

  const handleScaleChange = (scaleId) => {
    setSearchScale(scaleId);
    const newScale = SEARCH_SCALES[scaleId];
    setSearchParams(prev => ({
      ...prev,
      max_distance_km: Math.min(prev.max_distance_km, newScale.maxKm)
    }));
  };

  const handleSubmit = async () => {
    let searchData = { ...searchParams };
    const searchType = enableSmartSearch ? 'smart' : 'advanced';

    // CRITICAL: Map category to the correct ID
    let mappedCategory = searchParams.category;
    if (mappedCategory && !getAllCategoryIds().includes(mappedCategory)) {
      mappedCategory = mapOldCategoryToId(mappedCategory);
      console.log(`🔄 Category mapped: "${searchParams.category}" -> "${mappedCategory}"`);
    }

    if (searchType === 'smart') {
      const smartQuery = [];
      if (searchParams.query) smartQuery.push(searchParams.query);
      if (searchParams.tags) smartQuery.push(searchParams.tags);
      if (mappedCategory) smartQuery.push(mappedCategory);

      searchData = {
        query: smartQuery.join(' '),
        latitude: useLocation && userLocation ? userLocation.latitude : null,
        longitude: useLocation && userLocation ? userLocation.longitude : null,
        max_distance_km: searchParams.max_distance_km,
        limit: 20,
        offset: 0
      };

      if (mappedCategory) searchData.category = mappedCategory;
      if (searchParams.city) searchData.city = searchParams.city;
      if (searchParams.tags) {
        searchData.tags = searchParams.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    } else {
      searchData = {
        query: searchParams.query || '',
        category: mappedCategory || '',
        city: searchParams.city || '',
        tags: searchParams.tags ? searchParams.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        max_distance_km: searchParams.max_distance_km,
        search_category: searchScale,
        latitude: useLocation && userLocation ? userLocation.latitude : null,
        longitude: useLocation && userLocation ? userLocation.longitude : null,
        limit: 20,
        offset: 0
      };
    }

    searchData.search_type = searchType;

    console.log('📤 Final search payload:', searchData);

    if (onSearch) {
      await onSearch(searchData, searchType);
    }
    handleClose();
  };

  const handleClear = () => {
    setSearchParams({
      query: '',
      category: '',
      city: '',
      tags: '',
      max_distance_km: 50
    });
    setSelectedCategoryGroup('');
    setUseLocation(false);
    setDistanceUnit('km');
    setSearchScale('local');
  };

  const getDisplayDistance = () => {
    if (distanceUnit === 'miles') {
      return Math.round(searchParams.max_distance_km * 0.621371);
    }
    return searchParams.max_distance_km;
  };

  // Render section content
  const renderSection = () => {
    switch (sections[currentStep].id) {
      case 'scale':
        return (
          <div className="search-section">
            <div className="search-section-header">
              <h3>Choose Search Scale</h3>
              <p>Select how wide you want to search</p>
            </div>
            <div className="scale-cards">
              {Object.values(SEARCH_SCALES).map(scale => (
                <div
                  key={scale.id}
                  className={`scale-card ${searchScale === scale.id ? 'active' : ''}`}
                  onClick={() => handleScaleChange(scale.id)}
                >
                  <div className="scale-card-title">{scale.label}</div>
                  <div className="scale-card-desc">{scale.description}</div>
                  <div className="scale-card-range">0-{scale.maxKm.toLocaleString()} km</div>
                </div>
              ))}
            </div>
            <div className="search-field">
              <label className="search-label">
                <input
                  type="checkbox"
                  checked={enableSmartSearch}
                  onChange={(e) => setEnableSmartSearch(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Enable Smart Search
              </label>
              <div className="search-hint">Searches across all business information</div>
            </div>
          </div>
        );

      case 'criteria':
        return (
          <div className="search-section">
            <div className="search-section-header">
              <h3>Search Criteria</h3>
              <p>What are you looking for?</p>
            </div>
            <div className="search-grid">
              <div className="search-field">
                <label className="search-label">Search Query</label>
                <input
                  type="text"
                  value={searchParams.query}
                  onChange={(e) => handleSearchChange('query', e.target.value)}
                  placeholder="Business name, category, or keyword..."
                  className="search-input"
                />
                {enableSmartSearch && <div className="search-hint">Searches across all business info</div>}
              </div>

              <div className="search-field">
                <label className="search-label">Search Tags</label>
                <input
                  type="text"
                  value={searchParams.tags}
                  onChange={(e) => handleSearchChange('tags', e.target.value)}
                  placeholder="kota, burger, pizza (comma-separated)"
                  className="search-input"
                />
                <div className="search-hint">Search by tags like "kota", "burger", "pizza"</div>
              </div>

              <div className="search-field">
                <label className="search-label">Category Group</label>
                <select
                  value={selectedCategoryGroup}
                  onChange={(e) => setSelectedCategoryGroup(e.target.value)}
                  className="search-select"
                >
                  <option value="">All Categories</option>
                  {mainCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.displayName || cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="search-field">
                <label className="search-label">Specific Category</label>
                <select
                  value={searchParams.category}
                  onChange={(e) => handleSearchChange('category', e.target.value)}
                  className="search-select"
                  disabled={!selectedCategoryGroup}
                >
                  <option value="">
                    {selectedCategoryGroup ? 'Select a category...' : 'Select a group first'}
                  </option>
                  {groupSubcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="search-field">
                <label className="search-label">City</label>
                <input
                  type="text"
                  value={searchParams.city}
                  onChange={(e) => handleSearchChange('city', e.target.value)}
                  placeholder="Enter city name"
                  className="search-input"
                />
              </div>
            </div>
          </div>
        );

      case 'distance':
        return (
          <div className="search-section">
            <div className="search-section-header">
              <h3>Distance & Location</h3>
              <p>Where to search</p>
            </div>

            <div className="distance-controls">
              <div className="distance-presets">
                {distancePresets.map(preset => (
                  <button
                    key={preset.value}
                    className={`distance-preset-btn ${searchParams.max_distance_km === preset.value ? 'active' : ''}`}
                    onClick={() => handleDistanceChange(preset.value)}
                  >
                    <div className="distance-preset-label">{preset.label}</div>
                    <div className="distance-preset-value">
                      {preset.value === 0 ? 'No limit' : `${preset.value} km`}
                    </div>
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="0"
                max={currentScale.maxKm}
                value={searchParams.max_distance_km}
                onChange={(e) => handleDistanceChange(e.target.value)}
                className="distance-slider"
              />

              <div className="distance-input-group">
                <div className="distance-input-wrapper">
                  <input
                    type="number"
                    min="0"
                    max={distanceUnit === 'km' ? currentScale.maxKm : Math.round(currentScale.maxKm * 0.621371)}
                    value={getDisplayDistance()}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      const finalValue = distanceUnit === 'miles'
                        ? Math.round(value * 1.60934)
                        : value;
                      handleDistanceChange(finalValue);
                    }}
                    className="distance-input"
                  />
                  <span className="distance-unit">{distanceUnit}</span>
                </div>
                <div className="unit-toggle">
                  <button className={`unit-btn ${distanceUnit === 'km' ? 'active' : ''}`} onClick={() => distanceUnit !== 'km' && toggleDistanceUnit()}>km</button>
                  <button className={`unit-btn ${distanceUnit === 'miles' ? 'active' : ''}`} onClick={() => distanceUnit !== 'miles' && toggleDistanceUnit()}>miles</button>
                </div>
              </div>
            </div>

            <div className="location-controls">
              <label className="search-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={useLocation}
                  onChange={(e) => setUseLocation(e.target.checked)}
                />
                Use my current location
              </label>
              <button
                className="location-btn"
                onClick={handleGetLocation}
                disabled={!useLocation || locationLoading}
              >
                {locationLoading ? 'Getting...' : (userLocation ? 'Update' : 'Get Location')}
              </button>
            </div>

            {userLocation && useLocation && (
              <div className="location-info">
                <span>📍</span>
                <span>{userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</span>
              </div>
            )}
          </div>
        );

      case 'review':
        // Get display category name
        const displayCategory = searchParams.category
          ? getCategoryDisplayName(searchParams.category)
          : 'None';

        return (
          <div className="search-section">
            <div className="search-section-header">
              <h3>Review Your Search</h3>
              <p>Confirm your search criteria</p>
            </div>

            <div className="review-card">
              <div className="review-item">
                <span className="review-label">Search Scale</span>
                <span className="review-badge">{currentScale.label}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Search Type</span>
                <span className="review-badge">{enableSmartSearch ? 'Smart Search' : 'Advanced Search'}</span>
              </div>
              {searchParams.query && (
                <div className="review-item">
                  <span className="review-label">Query</span>
                  <span className="review-value">{searchParams.query}</span>
                </div>
              )}
              {searchParams.category && (
                <div className="review-item">
                  <span className="review-label">Category</span>
                  <span className="review-value">{displayCategory}</span>
                </div>
              )}
              {searchParams.city && (
                <div className="review-item">
                  <span className="review-label">City</span>
                  <span className="review-value">{searchParams.city}</span>
                </div>
              )}
              {searchParams.tags && (
                <div className="review-item">
                  <span className="review-label">Tags</span>
                  <span className="review-value">{searchParams.tags}</span>
                </div>
              )}
              <div className="review-item">
                <span className="review-label">Distance</span>
                <span className="review-value">
                  {searchParams.max_distance_km === 0 ? 'No limit' : `${searchParams.max_distance_km} km`}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">Location</span>
                <span className="review-value">
                  {useLocation && userLocation ? 'Using current location' : 'Not using location'}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  // Desktop layout
  if (!isMobile) {
    return (
      <div className={`search-modal-container ${isClosing ? 'closing' : ''}`}>
        <div className="search-modal-overlay" onClick={handleClose} />
        <div className="search-modal-content">
          <button className="search-modal-close-btn" onClick={handleClose}>✕</button>

          <div className="search-modal-header">
            <h2>Search Businesses</h2>
            <p className="search-modal-subtitle">Find and connect with businesses</p>
          </div>

          <div className="search-modal-tabs">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                className={`search-modal-tab ${currentStep === idx ? 'active' : ''}`}
                onClick={() => goToStep(idx)}
              >
                <span className="tab-label">{section.title}</span>
                {idx < currentStep && <span className="tab-check">✓</span>}
              </button>
            ))}
          </div>

          <div className="search-modal-progress">
            <div
              className="search-modal-progress-bar"
              style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
            />
          </div>

          <div className="search-modal-current-section">
            <span className="current-section-title">{sections[currentStep].title}</span>
            <span className="current-section-step">{sections[currentStep].step}</span>
          </div>

          <div className="search-modal-form-content">
            {renderSection()}
          </div>

          <div className="search-modal-footer">
            <div className="footer-left" />
            <div className="footer-right">
              <button className="btn-cancel" onClick={handleClose}>Cancel</button>
              {currentStep < sections.length - 1 ? (
                <button className="btn-search" onClick={nextStep}>Continue</button>
              ) : (
                <button className="btn-search" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile drawer layout
  return (
    <div className={`search-drawer-container ${isClosing ? 'closing' : ''}`}>
      <div className="search-drawer-overlay" onClick={handleClose} />
      <div
        ref={drawerRef}
        className="search-drawer-content"
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
          {renderSection()}
        </div>

        <div className="drawer-footer">
          {currentStep > 0 && (
            <button className="drawer-nav-prev" onClick={prevStep}>Back</button>
          )}
          {currentStep < sections.length - 1 ? (
            <button className="drawer-nav-next" onClick={nextStep}>Continue</button>
          ) : (
            <button className="drawer-nav-submit" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          )}
        </div>

        {currentStep > 0 && currentStep < sections.length - 1 && (
          <div className="drawer-swipe-hint">← Swipe to navigate →</div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;