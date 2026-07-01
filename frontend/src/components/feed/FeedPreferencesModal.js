// GlobalFeedPreferences.js - Complete Fixed Version
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import feedService from '../../services/feed';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import Toast from '../common/Toast';
import { detectUserLocation, getAddressFromCoords, geocodeAddress } from '../../utils/geolocation';
import { DISTANCE_CONSTANTS } from '../../utils/constants';
import './GlobalFeedPreferences.css';

// Distance configurations matching SearchModal
const DISTANCE_CATEGORIES = {
  local: {
    id: 'local',
    label: 'Local Range',
    maxKm: 2500,
    maxMiles: 1553,
    icon: '📍',
    description: 'Within your region (0-2,500km)',
    color: '#10B981',
    presets: [
      { value: 0, label: 'Anywhere', description: 'Show all posts regardless of distance', icon: '🌐' },
      { value: 5, label: 'Walking', description: 'Within walking distance (~5km)', icon: '🚶' },
      { value: 10, label: 'Local', description: 'Your local area (~10km)', icon: '🏘️' },
      { value: 50, label: 'City', description: 'City area (~50km)', icon: '🚗' },
      { value: 200, label: 'Regional', description: 'Regional area (~200km)', icon: '🗺️' },
      { value: 1000, label: 'State', description: 'State level (~1000km)', icon: '🏞️' },
      { value: 2500, label: 'Maximum', description: 'Full local range (2500km)', icon: '📍' }
    ]
  },
  continental: {
    id: 'continental',
    label: 'Continental Range',
    maxKm: 10500,
    maxMiles: 6524,
    icon: '🗺️',
    description: 'Across continents (0-10,500km)',
    color: '#3B82F6',
    presets: [
      { value: 0, label: 'Anywhere', description: 'Show all posts regardless of distance', icon: '🌐' },
      { value: 100, label: 'State', description: 'State level (~100km)', icon: '🏙️' },
      { value: 500, label: 'Regional', description: 'Regional (~500km)', icon: '🚗' },
      { value: 2000, label: 'Country', description: 'Country scale (~2000km)', icon: '🗺️' },
      { value: 5000, label: 'Subcontinent', description: 'Subcontinent (~5000km)', icon: '🌍' },
      { value: 10500, label: 'Maximum', description: 'Full continental range (10500km)', icon: '🗺️' }
    ]
  },
  global: {
    id: 'global',
    label: 'Global Range',
    maxKm: 45000,
    maxMiles: 27962,
    icon: '🌎',
    description: 'Worldwide (0-45,000km)',
    color: '#8B5CF6',
    presets: [
      { value: 0, label: 'Worldwide', description: 'Show posts from anywhere in the world', icon: '🌐' },
      { value: 1000, label: 'National', description: 'National level (~1000km)', icon: '🇺🇸' },
      { value: 5000, label: 'Continental', description: 'Continental scale (~5000km)', icon: '🌎' },
      { value: 15000, label: 'Hemisphere', description: 'Hemispheric scale (~15000km)', icon: '🌍' },
      { value: 30000, label: 'Global', description: 'Global coverage (~30000km)', icon: '🪐' },
      { value: 45000, label: 'Maximum', description: 'Worldwide coverage (45,000km)', icon: '🌌' }
    ]
  }
};

// Category hierarchy mapping for parent-child relationships
const CATEGORY_HIERARCHY = {
  'Food & Beverage': {
    parent: null,
    subcategories: ['Restaurant', 'Cafe', 'Bar', 'Fast Food', 'Bakery', 'Coffee Shop', 'Pizzeria', 'Diner']
  },
  'Retail': {
    parent: null,
    subcategories: ['Clothing', 'Electronics', 'Grocery', 'Department Store', 'Jewelry', 'Furniture']
  },
  'Services': {
    parent: null,
    subcategories: ['Plumbing', 'Electric', 'Cleaning', 'Repair', 'Consulting', 'Legal', 'Accounting']
  },
  'Health & Wellness': {
    parent: null,
    subcategories: ['Gym', 'Spa', 'Doctor', 'Dentist', 'Pharmacy', 'Yoga', 'Meditation']
  },
  'Entertainment': {
    parent: null,
    subcategories: ['Movies', 'Concerts', 'Theatre', 'Gaming', 'Sports', 'Events']
  },
  'Technology': {
    parent: null,
    subcategories: ['Software', 'Hardware', 'IT Services', 'Web Development', 'App Development']
  },
  'Education': {
    parent: null,
    subcategories: ['School', 'University', 'Tutoring', 'Training', 'Workshop']
  },
  'Automotive': {
    parent: null,
    subcategories: ['Repair', 'Sales', 'Rental', 'Parts', 'Service Center']
  },
  'Arts': {
    parent: null,
    subcategories: ['Gallery', 'Museum', 'Studio', 'Theatre', 'Music']
  },
  'Travel': {
    parent: null,
    subcategories: ['Hotel', 'Flight', 'Tour', 'Agency', 'Rental']
  },
  'Beauty': {
    parent: null,
    subcategories: ['Salon', 'Spa', 'Barber', 'Nail', 'Makeup']
  },
  'Fitness': {
    parent: null,
    subcategories: ['Gym', 'Yoga', 'Pilates', 'Crossfit', 'Personal Training']
  },
  'Finance': {
    parent: null,
    subcategories: ['Bank', 'Insurance', 'Investment', 'Loan', 'Accounting']
  }
};

// Build a flat list of all available categories with hierarchy info
const buildCategoryList = () => {
  const categories = [];

  Object.keys(CATEGORY_HIERARCHY).forEach(mainCat => {
    categories.push({
      id: mainCat,
      name: mainCat,
      type: 'main',
      parent: null,
      icon: getCategoryIcon(mainCat)
    });

    CATEGORY_HIERARCHY[mainCat].subcategories.forEach(subCat => {
      categories.push({
        id: subCat,
        name: subCat,
        type: 'sub',
        parent: mainCat,
        icon: getCategoryIcon(subCat)
      });
    });
  });

  return categories;
};

const getCategoryIcon = (category) => {
  const icons = {
    'Food & Beverage': '🍔',
    'Restaurant': '🍽️',
    'Cafe': '☕',
    'Bar': '🍺',
    'Fast Food': '🍟',
    'Bakery': '🥐',
    'Coffee Shop': '☕',
    'Retail': '🛍️',
    'Clothing': '👕',
    'Electronics': '📱',
    'Grocery': '🛒',
    'Services': '🔧',
    'Health & Wellness': '🧘',
    'Gym': '💪',
    'Spa': '💆',
    'Doctor': '👨‍⚕️',
    'Entertainment': '🎬',
    'Technology': '💻',
    'Education': '📚',
    'Automotive': '🚗',
    'Arts': '🎨',
    'Travel': '✈️',
    'Beauty': '💄',
    'Fitness': '🏋️',
    'Finance': '💰'
  };
  return icons[category] || '📌';
};

const ALL_CATEGORIES = buildCategoryList();

const getExpandedCategories = (selectedCategories) => {
  const expanded = new Set(selectedCategories);

  selectedCategories.forEach(cat => {
    for (const [mainCat, data] of Object.entries(CATEGORY_HIERARCHY)) {
      if (data.subcategories.includes(cat)) {
        expanded.add(mainCat);
      }
    }
  });

  return Array.from(expanded);
};

const GlobalFeedPreferences = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();

  const [localPreferences, setLocalPreferences] = useState({
    enabled: true,
    distanceRange: 50,
    distanceCategory: 'local',
    useMiles: false,
    categories: [],
    expandedCategories: [],
    locationType: 'auto',
    manualLocation: '',
    prioritizeDistance: true,
    prioritizeCategories: true,
    location: null
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [expandedMainCategories, setExpandedMainCategories] = useState({});

  const currentDistanceCategory = DISTANCE_CATEGORIES[localPreferences.distanceCategory];
  const sliderPercentage = (localPreferences.distanceRange / currentDistanceCategory.maxKm) * 100;

  const getDistancePresetInfo = (distance) => {
    const sortedPresets = [...currentDistanceCategory.presets].sort((a, b) => a.value - b.value);
    for (let i = 0; i < sortedPresets.length; i++) {
      const preset = sortedPresets[i];
      if (distance <= preset.value || i === sortedPresets.length - 1) {
        return preset;
      }
    }
    return sortedPresets[sortedPresets.length - 1];
  };

  const getDistanceCategoryInfo = (distance) => {
    const maxDistance = currentDistanceCategory.maxKm;
    const percentage = (distance / maxDistance) * 100;
    if (distance === 0) return { label: 'Worldwide', icon: '🌐', color: '#6B7280' };
    if (percentage <= 10) return { label: 'Very Close', icon: '🚶', color: '#10B981' };
    if (percentage <= 30) return { label: 'Nearby', icon: '📍', color: '#3B82F6' };
    if (percentage <= 60) return { label: 'Regional', icon: '🗺️', color: '#F59E0B' };
    if (percentage <= 90) return { label: 'Distant', icon: '✈️', color: '#EF4444' };
    return { label: 'Maximum Range', icon: currentDistanceCategory.icon, color: currentDistanceCategory.color };
  };

  const presetInfo = getDistancePresetInfo(localPreferences.distanceRange);
  const distanceCategoryInfo = getDistanceCategoryInfo(localPreferences.distanceRange);

  useEffect(() => {
    if (isOpen && !initialized) {
      loadPreferences();
    }
  }, [isOpen, initialized]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      console.log('Loading preferences for modal...');
      const result = await feedService.getFeedPreferences();

      if (result.success && result.data) {
        const distance = result.data.distanceRange || result.data.max_distance_km || 50;
        let distanceCategory = 'local';
        if (distance <= 2500) distanceCategory = 'local';
        else if (distance <= 10500) distanceCategory = 'continental';
        else distanceCategory = 'global';

        const selectedCategories = result.data.categories || result.data.preferred_categories || [];
        const expandedCategories = getExpandedCategories(selectedCategories);

        setLocalPreferences({
          enabled: result.data.enabled !== false,
          distanceRange: distance,
          distanceCategory: distanceCategory,
          useMiles: result.data.useMiles || result.data.use_miles || false,
          categories: selectedCategories,
          expandedCategories: expandedCategories,
          prioritizeDistance: result.data.prioritizeDistance !== false || result.data.enable_distance_prioritization !== false,
          prioritizeCategories: result.data.prioritizeCategories !== false || result.data.enable_category_prioritization !== false,
          location: result.data.location || null,
          locationType: result.data.locationType || result.data.location_type || 'auto',
          manualLocation: result.data.manualLocation || result.data.manual_location || ''
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      setToast({ type: 'error', message: 'Failed to load preferences' });
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen]);

  const handleToggle = (field) => {
    setLocalPreferences(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleDistanceChange = (distance) => {
    const numValue = parseInt(distance) || 0;
    const maxDistance = currentDistanceCategory.maxKm;
    const clampedValue = Math.max(0, Math.min(maxDistance, numValue));
    setLocalPreferences(prev => ({ ...prev, distanceRange: clampedValue }));
  };

  const handleDistanceCategoryChange = (categoryId) => {
    const newCategory = DISTANCE_CATEGORIES[categoryId];
    const defaultPreset = newCategory.presets.find(p =>
      p.label === 'Local' || p.label === 'City' || p.label === 'National'
    ) || newCategory.presets[1];
    setLocalPreferences(prev => ({
      ...prev,
      distanceCategory: categoryId,
      distanceRange: Math.min(prev.distanceRange, newCategory.maxKm, defaultPreset?.value || 50)
    }));
  };

  const handleDistancePresetClick = (presetValue) => {
    handleDistanceChange(presetValue);
  };

  const handleUnitToggle = () => {
    setLocalPreferences(prev => ({ ...prev, useMiles: !prev.useMiles }));
  };

  const handleCategoryToggle = (categoryId) => {
    setLocalPreferences(prev => {
      let newCategories;
      if (prev.categories.includes(categoryId)) {
        newCategories = prev.categories.filter(c => c !== categoryId);
      } else {
        newCategories = [...prev.categories, categoryId];
      }
      const expandedCategories = getExpandedCategories(newCategories);
      return { ...prev, categories: newCategories, expandedCategories: expandedCategories };
    });
  };

  const toggleMainCategory = (mainCat) => {
    setExpandedMainCategories(prev => ({ ...prev, [mainCat]: !prev[mainCat] }));
  };

  const handleLocationTypeChange = (type) => {
    setLocalPreferences(prev => ({ ...prev, locationType: type }));
    if (type === 'auto') {
      detectLocation();
    }
  };

  // FIXED: Correct detectLocation function using detectUserLocation
  const detectLocation = async () => {
    setToast({ type: 'info', message: 'Detecting your location...' });

    try {
      // Use the correct function from geolocation.js
      const locationResult = await detectUserLocation();

      if (locationResult.success) {
        const { latitude: lat, longitude: lng, accuracy } = locationResult;

        // Get address from coordinates
        let address = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          const addressInfo = await getAddressFromCoords(lat, lng);
          if (addressInfo && addressInfo.address) {
            address = addressInfo.address;
          }
        } catch (addrError) {
          console.log('Could not get address from coordinates:', addrError);
        }

        setLocalPreferences(prev => ({
          ...prev,
          location: { lat, lng, address }
        }));

        setToast({ type: 'success', message: `Location detected! Accuracy: ${Math.round(accuracy)}m` });
      } else {
        throw new Error(locationResult.error || 'Location detection failed');
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      setToast({ type: 'error', message: error.message || 'Could not detect location. Please enter manually.' });
      setLocalPreferences(prev => ({ ...prev, locationType: 'manual' }));
    }
  };

  const handleManualAddressChange = async (address) => {
    setLocalPreferences(prev => ({ ...prev, manualLocation: address }));
    if (address.length > 5) {
      try {
        const coords = await geocodeAddress(address);
        if (coords) {
          setLocalPreferences(prev => ({
            ...prev,
            location: { lat: coords.lat, lng: coords.lng, address: coords.address || address }
          }));
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
      }
    }
  };

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    setToast(null);

    try {
      const categoriesToSave = localPreferences.expandedCategories.length > 0
        ? localPreferences.expandedCategories
        : localPreferences.categories;

      const preferencesToSave = {
        enabled: localPreferences.enabled !== false,
        max_distance_km: localPreferences.distanceRange || 50,
        use_miles: localPreferences.useMiles || false,
        preferred_categories: categoriesToSave,
        enable_distance_prioritization: localPreferences.prioritizeDistance !== false,
        enable_category_prioritization: localPreferences.prioritizeCategories !== false,
        location_type: localPreferences.locationType || 'auto',
        manual_location: localPreferences.manualLocation || '',
        distance_category: localPreferences.distanceCategory
      };

      if (localPreferences.location && localPreferences.location.lat && localPreferences.location.lng) {
        preferencesToSave.home_latitude = localPreferences.location.lat;
        preferencesToSave.home_longitude = localPreferences.location.lng;
        preferencesToSave.home_address = localPreferences.location.address || localPreferences.manualLocation || '';
      }

      console.log('Saving preferences:', preferencesToSave);
      const result = await feedService.updateFeedPreferences(preferencesToSave);

      if (result && result.success) {
        setToast({ type: 'success', message: 'Preferences saved successfully!' });

        if (onSave) {
          onSave(result);
        }

        window.dispatchEvent(new CustomEvent('preferences-updated', {
          detail: { preferences: preferencesToSave }
        }));

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(result?.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setToast({ type: 'error', message: error.message || 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPreferences({
      enabled: true,
      distanceRange: 50,
      distanceCategory: 'local',
      useMiles: false,
      categories: [],
      expandedCategories: [],
      locationType: 'auto',
      manualLocation: '',
      prioritizeDistance: true,
      prioritizeCategories: true,
      location: null
    });
    setToast({ type: 'info', message: 'Reset to default preferences' });
  };

  const handleClose = () => {
    setInitialized(false);
    onClose();
  };

  const getFormattedDistance = () => {
    if (localPreferences.distanceRange === 0) return 'Worldwide';
    const value = localPreferences.useMiles
      ? Math.round(localPreferences.distanceRange * DISTANCE_CONSTANTS.KM_TO_MILES)
      : localPreferences.distanceRange;
    if (value >= 1000) {
      const inThousands = (value / 1000).toFixed(1);
      return `${inThousands.replace('.0', '')}k ${localPreferences.useMiles ? 'mi' : 'km'}`;
    }
    return `${value} ${localPreferences.useMiles ? 'mi' : 'km'}`;
  };

  const getDistanceDescription = () => {
    if (localPreferences.distanceRange === 0) return 'Shows posts from anywhere in the world';
    const formatted = getFormattedDistance();
    const category = distanceCategoryInfo;
    return `Shows posts within ${formatted} (${category.label})`;
  };

  const categoriesByMain = {};
  ALL_CATEGORIES.forEach(cat => {
    if (cat.type === 'main') {
      categoriesByMain[cat.id] = {
        ...cat,
        subcategories: ALL_CATEGORIES.filter(c => c.parent === cat.id)
      };
    }
  });

  if (!isOpen) return null;

  const formattedDistance = getFormattedDistance();
  const distanceDescription = getDistanceDescription();

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content global-feed-preferences-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Feed Preferences</h2>
          <p className="modal-subtitle">Customize your feed experience with intelligent filtering</p>
          <button className="modal-close" onClick={handleClose} type="button">×</button>
        </div>

        <div className="global-feed-preferences-content">
          {loading ? (
            <div className="loading-overlay">
              <LoadingSpinner />
              <p>Loading preferences...</p>
            </div>
          ) : (
            <>
              <div className="feed-preferences-section">
                <div className="toggle-control">
                  <div className="toggle-label">
                    <span>Personalized Feed</span>
                    <span>Enable intelligent content filtering and prioritization</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={localPreferences.enabled} onChange={() => handleToggle('enabled')} disabled={saving} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {localPreferences.enabled && (
                <>
                  <div className="feed-preferences-section">
                    <div className="section-header">
                      <h3 className="section-title">Distance Range</h3>
                      <div className="unit-toggle">
                        <button className={`unit-btn ${!localPreferences.useMiles ? 'active' : ''}`} onClick={handleUnitToggle} disabled={saving} type="button">km</button>
                        <button className={`unit-btn ${localPreferences.useMiles ? 'active' : ''}`} onClick={handleUnitToggle} disabled={saving} type="button">miles</button>
                      </div>
                    </div>
                    <p className="section-subtitle">{distanceDescription}</p>

                    <div className="search-category-grid">
                      {Object.values(DISTANCE_CATEGORIES).map(cat => (
                        <div key={cat.id} className={`search-category-card ${localPreferences.distanceCategory === cat.id ? 'active' : ''}`} onClick={() => handleDistanceCategoryChange(cat.id)} style={{ borderColor: localPreferences.distanceCategory === cat.id ? cat.color : '#e2e8f0', backgroundColor: localPreferences.distanceCategory === cat.id ? `${cat.color}10` : 'white' }}>
                          <div className="search-category-card-header">
                            <span className="search-category-card-icon" style={{ color: cat.color, backgroundColor: `${cat.color}15` }}>{cat.icon}</span>
                            <div className="search-category-card-content">
                              <h4>{cat.label}</h4>
                              <p className="search-category-card-desc">{cat.description}</p>
                              <div className="search-category-card-range"><span>0–{cat.maxKm.toLocaleString()} km</span></div>
                            </div>
                          </div>
                          {localPreferences.distanceCategory === cat.id && <div className="search-category-card-active">✓ Selected</div>}
                        </div>
                      ))}
                    </div>

                    <div className="global-distance-display">
                      <div className="distance-category"><span className="distance-icon">{distanceCategoryInfo.icon}</span><span className="distance-label">{distanceCategoryInfo.label}</span></div>
                      <div className="distance-value">{formattedDistance}</div>
                    </div>

                    <div className="distance-slider-container">
                      <div className="slider-labels"><span>Worldwide</span><span>Global</span></div>
                      <input type="range" min="0" max={currentDistanceCategory.maxKm} step="1" value={localPreferences.distanceRange} onChange={(e) => handleDistanceChange(parseInt(e.target.value))} className="distance-slider" disabled={saving} style={{ background: `linear-gradient(to right, ${currentDistanceCategory.color} 0%, ${currentDistanceCategory.color} ${sliderPercentage}%, #f1f5f9 ${sliderPercentage}%, #f1f5f9 100%)` }} />
                      <div className="slider-scale"><span>0</span><span>5km</span><span>50km</span><span>500km</span><span>5,000km</span><span>{currentDistanceCategory.maxKm.toLocaleString()}km</span></div>
                    </div>

                    <div className="global-distance-presets">
                      <h4>Quick Presets:</h4>
                      <div className="preset-grid">
                        {currentDistanceCategory.presets.map(preset => {
                          const isActive = Math.abs(localPreferences.distanceRange - preset.value) < 1;
                          const displayValue = preset.value === 0 ? 'Anywhere' : preset.value >= 1000 ? `${(preset.value / 1000).toFixed(0)}k km` : `${preset.value} km`;
                          return (
                            <button key={preset.value} className={`global-preset ${isActive ? 'active' : ''}`} onClick={() => handleDistancePresetClick(preset.value)} disabled={saving} type="button" title={preset.description} style={{ borderColor: isActive ? currentDistanceCategory.color : '#e2e8f0', backgroundColor: isActive ? `${currentDistanceCategory.color}10` : 'white' }}>
                              <span className="preset-icon">{preset.icon}</span>
                              <span className="preset-label">{preset.label}</span>
                              <span className="preset-value">{displayValue}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="toggle-control">
                      <div className="toggle-label"><span>Prioritize by Distance</span><span>Show closer posts first in your feed</span></div>
                      <label className="toggle-switch"><input type="checkbox" checked={localPreferences.prioritizeDistance} onChange={() => handleToggle('prioritizeDistance')} disabled={saving} /><span className="toggle-slider"></span></label>
                    </div>

                    <div className="search-modal-distance-info">
                      <div className="search-modal-distance-summary"><span className="search-modal-preset-icon">{presetInfo.icon}</span><div><span className="search-modal-preset-name">{presetInfo.label}</span><span className="search-modal-preset-desc">{presetInfo.description}</span></div></div>
                      <div className="search-modal-distance-category" style={{ color: distanceCategoryInfo.color, backgroundColor: `${distanceCategoryInfo.color}15` }}><span className="search-modal-category-icon">{distanceCategoryInfo.icon}</span><span className="search-modal-category-label">{distanceCategoryInfo.label}</span></div>
                    </div>
                  </div>

                  <div className="feed-preferences-section">
                    <div className="section-header">
                      <h3 className="section-title">Preferred Categories</h3>
                      <div className="toggle-control"><span>Prioritize Categories</span><label className="toggle-switch"><input type="checkbox" checked={localPreferences.prioritizeCategories} onChange={() => handleToggle('prioritizeCategories')} disabled={saving} /><span className="toggle-slider"></span></label></div>
                    </div>
                    <p className="section-subtitle">Select categories you're interested in (subcategories will automatically include parent categories)</p>

                    <div className="category-hierarchy-container">
                      {Object.keys(categoriesByMain).map(mainCat => {
                        const catData = categoriesByMain[mainCat];
                        const isExpanded = expandedMainCategories[mainCat];
                        const hasSelectedSubcategories = catData.subcategories.some(sub => localPreferences.categories.includes(sub.id));
                        const isMainSelected = localPreferences.categories.includes(mainCat);

                        return (
                          <div key={mainCat} className="category-group">
                            <div className={`category-group-header ${isMainSelected ? 'selected' : ''}`} onClick={() => toggleMainCategory(mainCat)}>
                              <div className="category-group-header-left">
                                <span className="category-group-expand-icon">{isExpanded ? '▼' : '▶'}</span>
                                <span className="category-group-icon">{catData.icon}</span>
                                <span className="category-group-name">{mainCat}</span>
                                {hasSelectedSubcategories && <span className="category-group-badge">Includes subcategories</span>}
                              </div>
                              <div className={`category-group-checkbox ${isMainSelected ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); handleCategoryToggle(mainCat); }}>{isMainSelected && '✓'}</div>
                            </div>
                            {isExpanded && (
                              <div className="category-subcategories">
                                {catData.subcategories.map(subCat => (
                                  <div key={subCat.id} className={`category-subcategory ${localPreferences.categories.includes(subCat.id) ? 'selected' : ''}`} onClick={() => handleCategoryToggle(subCat.id)}>
                                    <span className="category-subcategory-icon">{subCat.icon}</span>
                                    <span className="category-subcategory-name">{subCat.name}</span>
                                    {localPreferences.categories.includes(subCat.id) && <span className="check-icon">✓</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="feed-preferences-section">
                    <h3 className="section-title">Location Settings</h3>
                    <p className="section-subtitle">Set your location for distance calculations</p>

                    <div className="location-controls">
                      <div className="location-type-toggle">
                        <button className={`location-btn ${localPreferences.locationType === 'auto' ? 'active' : ''}`} onClick={() => handleLocationTypeChange('auto')} disabled={saving} type="button"><span className="location-icon">🌐</span><span>Use My Location</span></button>
                        <button className={`location-btn ${localPreferences.locationType === 'manual' ? 'active' : ''}`} onClick={() => handleLocationTypeChange('manual')} disabled={saving} type="button"><span className="location-icon">📍</span><span>Enter Address</span></button>
                      </div>

                      {localPreferences.locationType === 'manual' && (
                        <div className="manual-location-input">
                          <Input type="text" placeholder="Enter your address, city, or ZIP code" value={localPreferences.manualLocation} onChange={(e) => handleManualAddressChange(e.target.value)} disabled={saving} />
                        </div>
                      )}

                      {localPreferences.location?.address && (
                        <div className="location-display">
                          <p><strong>Current Location:</strong></p>
                          <p>{localPreferences.location.address}</p>
                          {localPreferences.location.lat && localPreferences.location.lng && <p>Coordinates: {localPreferences.location.lat.toFixed(4)}, {localPreferences.location.lng.toFixed(4)}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="modal-footer">
                <Button variant="outline" onClick={handleReset} disabled={saving || loading} type="button">Reset to Defaults</Button>
                <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving} type="button">Save Preferences</Button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} duration={3000} />}
    </div>
  );
};

export default GlobalFeedPreferences;