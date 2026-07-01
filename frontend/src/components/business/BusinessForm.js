// BusinessForm.js - Controlled component for modal
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../contexts/BusinessContext';
import { useApp } from '../../contexts/AppContext';
import { useDevice } from '../../hooks/useMediaQuery';
import Drawer from '../../components/common/Drawer';
import Modal from '../../components/common/Modal';
import {
  BUSINESS_CATEGORIES,
  BUSINESS_CATEGORIES_ENHANCED,
  CATEGORY_CONSTANTS,
  getCategoryDisplayName,
  getCategoryIcon,
  getCategoryColor,
  mapLegacyCategory,
  getCategoryPath
} from '../../utils/constants';
import { businessValidation } from '../../utils/validation';
import { getCoordsFromAddress, getCurrentPosition } from '../../utils/geolocation';
import './BusinessForm.css';

const BusinessForm = ({
  business = null,
  onSuccess,
  onCancel,
  mode = 'create',
  businessId = null,
  showDrawer = true,
  showBottomNav = true,
  // Props for modal control
  compactMode = false,
  activeSection = null,
  onFormChange = null
}) => {
  const navigate = useNavigate();
  const { createBusiness, updateBusiness, getBusiness } = useBusiness();
  const { showToast } = useApp();
  const { isMobile } = useDevice();

  // Drawer state (only for standalone mode)
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Delete modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Location state
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    latitude: '',
    longitude: '',
    tags: []
  });

  const [operatingHours, setOperatingHours] = useState({
    monday: { enabled: true, open: '09:00', close: '18:00' },
    tuesday: { enabled: true, open: '09:00', close: '18:00' },
    wednesday: { enabled: true, open: '09:00', close: '18:00' },
    thursday: { enabled: true, open: '09:00', close: '18:00' },
    friday: { enabled: true, open: '09:00', close: '18:00' },
    saturday: { enabled: true, open: '10:00', close: '16:00' },
    sunday: { enabled: false, open: '09:00', close: '17:00' }
  });

  const [timeFormat, setTimeFormat] = useState('12h');
  const [specialHours, setSpecialHours] = useState([]);
  const [showSpecialHoursModal, setShowSpecialHoursModal] = useState(false);
  const [editingSpecialHour, setEditingSpecialHour] = useState(null);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [viewMode, setViewMode] = useState('byCategory');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);

  const dataLoadedRef = useRef(false);
  const prevBusinessRef = useRef(null);
  const prevModeRef = useRef(null);

  // Auto-save on form changes (for modal)
  useEffect(() => {
    if (onFormChange && !loading && initialized && compactMode) {
      const timeout = setTimeout(() => {
        onFormChange(formData);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [formData, onFormChange, loading, initialized, compactMode]);

  // Navigation tabs for bottom nav (standalone mode)
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', path: `/business/${business?.id || businessId}/dashboard` },
    { id: 'settings', label: 'Settings', path: `/business/${business?.id || businessId}/settings` },
    { id: 'analytics', label: 'Analytics', path: `/business/${business?.id || businessId}/analytics` }
  ];

  // Get greeting based on time of day
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // ============================================
  // LOCATION FUNCTIONS
  // ============================================
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Your browser does not support location services'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps'
          });
        },
        (error) => {
          let userMessage = 'Failed to get location';
          switch(error.code) {
            case 1: userMessage = 'Please allow location access.';
              break;
            case 2: userMessage = 'Location unavailable.';
              break;
            case 3: userMessage = 'Location request timed out.';
              break;
          }
          reject(new Error(userMessage));
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }, []);

  const updateBusinessWithLiveLocation = useCallback(async () => {
    const targetBusinessId = businessId || business?.id;
    if (!targetBusinessId) {
      showToast('No business ID available', 'error');
      return null;
    }

    try {
      setUpdatingLocation(true);
      showToast('Getting your current location...', 'info');

      const location = await getCurrentLocation();

      const updateData = {
        latitude: location.latitude,
        longitude: location.longitude,
        location_source: 'gps',
        location_accuracy: location.accuracy
      };

      const result = await updateBusiness(targetBusinessId, updateData);

      if (result) {
        showToast(`Location saved (${Math.round(location.accuracy)}m accuracy)`, 'success');

        setFormData(prev => ({
          ...prev,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString()
        }));

        if (getBusiness) getBusiness(targetBusinessId, { forceRefresh: true });
        return result;
      } else {
        throw new Error('No result returned from update');
      }
    } catch (error) {
      showToast(`Location update failed: ${error.message}`, 'error');
      return null;
    } finally {
      setUpdatingLocation(false);
    }
  }, [businessId, business, getCurrentLocation, updateBusiness, showToast, getBusiness]);

  // ============================================
  // DELETE BUSINESS FUNCTION
  // ============================================
  const handleDeleteBusiness = useCallback(async () => {
    if (confirmDeleteText !== 'DELETE') {
      showToast('Type DELETE to confirm', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      showToast('Delete functionality coming soon', 'info');
      setDeleteConfirmOpen(false);
      setConfirmDeleteText('');
      setTimeout(() => navigate('/business/create'), 2000);
    } catch (error) {
      showToast('Delete failed', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }, [confirmDeleteText, navigate, showToast]);

  // Get all main categories
  const mainCategories = useMemo(() => {
    return Object.entries(BUSINESS_CATEGORIES_ENHANCED).map(([id, categoryData]) => ({
      id,
      label: categoryData.label,
      icon: getCategoryIcon(id),
      color: getCategoryColor(id),
      subcategories: categoryData.subcategories || []
    }));
  }, []);

  // Get all subcategories flattened
  const allSubcategories = useMemo(() => {
    return mainCategories.flatMap(category =>
      category.subcategories.map(sub => ({
        id: sub.id,
        label: sub.label,
        icon: getCategoryIcon(sub.id),
        color: getCategoryColor(sub.id),
        parentId: category.id,
        parentLabel: category.label
      }))
    );
  }, [mainCategories]);

  // Popular categories
  const popularCategories = useMemo(() => {
    return CATEGORY_CONSTANTS.POPULAR_CATEGORIES
      .map(catId => mainCategories.find(c => c.id === catId))
      .filter(Boolean);
  }, [mainCategories]);

  // Format time for display
  const formatTimeForDisplay = useCallback((time24) => {
    if (!time24) return '';
    if (timeFormat === '24h') return time24;

    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, [timeFormat]);

  // Load business data for edit mode
  useEffect(() => {
    const businessChanged = business !== prevBusinessRef.current;
    const modeChanged = mode !== prevModeRef.current;

    if ((businessChanged || modeChanged) && business && mode === 'edit' && !initialized && !dataLoadedRef.current) {
      const category = business.category || '';
      let mainCategory = '';
      let subcategory = '';

      if (BUSINESS_CATEGORIES_ENHANCED[category]) {
        mainCategory = category;
      } else {
        for (const [mainId, categoryData] of Object.entries(BUSINESS_CATEGORIES_ENHANCED)) {
          const subcat = categoryData.subcategories.find(sub => sub.id === category);
          if (subcat) {
            mainCategory = mainId;
            subcategory = category;
            break;
          }
        }
        if (!mainCategory) {
          mainCategory = mapLegacyCategory(category) || category;
        }
      }

      setFormData({
        name: business.name || '',
        category: mainCategory,
        subcategory: subcategory,
        description: business.description || '',
        address: business.address || '',
        city: business.city || '',
        state: business.state || '',
        zip_code: business.zip_code || '',
        phone: business.phone || '',
        email: business.email || '',
        website: business.website || '',
        latitude: business.latitude?.toString() || '',
        longitude: business.longitude?.toString() || '',
        tags: business.tags || []
      });

      if (business.operating_hours) {
        try {
          const savedHours = typeof business.operating_hours === 'string'
            ? JSON.parse(business.operating_hours)
            : business.operating_hours;
          setOperatingHours(savedHours);
        } catch (e) {
          console.error('Failed to parse operating hours:', e);
        }
      }

      if (business.special_hours) {
        try {
          const savedSpecialHours = typeof business.special_hours === 'string'
            ? JSON.parse(business.special_hours)
            : business.special_hours;
          setSpecialHours(savedSpecialHours);
        } catch (e) {
          console.error('Failed to parse special hours:', e);
        }
      }

      if (business.logo_url) setLogoPreview(business.logo_url);
      if (business.background_picture_url) setBackgroundPreview(business.background_picture_url);

      if (mainCategory && BUSINESS_CATEGORIES_ENHANCED[mainCategory]) {
        setAvailableSubcategories(BUSINESS_CATEGORIES_ENHANCED[mainCategory].subcategories || []);
      }

      setInitialized(true);
      dataLoadedRef.current = true;
      prevBusinessRef.current = business;
      prevModeRef.current = mode;
    } else if (mode === 'create' && initialized) {
      setInitialized(false);
      dataLoadedRef.current = false;
      prevBusinessRef.current = null;
      prevModeRef.current = mode;
    }
  }, [business, mode, initialized]);

  // Update subcategories when main category changes
  useEffect(() => {
    if (formData.category && BUSINESS_CATEGORIES_ENHANCED[formData.category]) {
      const categoryData = BUSINESS_CATEGORIES_ENHANCED[formData.category];
      setAvailableSubcategories(categoryData.subcategories || []);

      if (formData.subcategory) {
        const isValidSubcategory = categoryData.subcategories.some(
          sub => sub.id === formData.subcategory
        );
        if (!isValidSubcategory) {
          setFormData(prev => ({ ...prev, subcategory: '' }));
        }
      }
    } else {
      setAvailableSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  }, [formData.category]);

  // Handle operating hours changes
  const handleHourChange = useCallback((day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  }, []);

  const toggleDayEnabled = useCallback((day) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }));
  }, []);

  const copyHoursToWeekdays = useCallback(() => {
    const sourceDay = operatingHours.monday;
    const weekdays = ['tuesday', 'wednesday', 'thursday', 'friday'];
    const newHours = { ...operatingHours };

    weekdays.forEach(day => {
      newHours[day] = {
        ...newHours[day],
        open: sourceDay.open,
        close: sourceDay.close
      };
    });

    setOperatingHours(newHours);
    showToast('Hours copied to weekdays', 'success');
  }, [operatingHours, showToast]);

  const copyHoursToAll = useCallback(() => {
    const sourceDay = operatingHours.monday;
    const days = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const newHours = { ...operatingHours };

    days.forEach(day => {
      newHours[day] = {
        ...newHours[day],
        open: sourceDay.open,
        close: sourceDay.close
      };
    });

    setOperatingHours(newHours);
    showToast('Hours copied to all days', 'success');
  }, [operatingHours, showToast]);

  const addSpecialHour = useCallback((specialHour) => {
    if (editingSpecialHour) {
      setSpecialHours(prev => prev.map(sh =>
        sh.id === editingSpecialHour.id ? { ...specialHour, id: sh.id } : sh
      ));
      showToast('Special hours updated', 'success');
    } else {
      setSpecialHours(prev => [...prev, { ...specialHour, id: Date.now().toString() }]);
      showToast('Special hours added', 'success');
    }
    setShowSpecialHoursModal(false);
    setEditingSpecialHour(null);
  }, [editingSpecialHour, showToast]);

  const removeSpecialHour = useCallback((id) => {
    setSpecialHours(prev => prev.filter(sh => sh.id !== id));
    showToast('Special hours removed', 'success');
  }, [showToast]);

  const handleLogoSelect = useCallback((file) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleLogoRemove = useCallback(() => {
    setLogoFile(null);
    setLogoPreview(null);
  }, []);

  const handleBackgroundSelect = useCallback((file) => {
    setBackgroundFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBackgroundPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleBackgroundRemove = useCallback(() => {
    setBackgroundFile(null);
    setBackgroundPreview(null);
  }, []);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && tag.length <= 30) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  }, []);

  const handleTagInputKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const validateForm = useCallback(() => {
    const newErrors = {};

    Object.keys(businessValidation).forEach(field => {
      const validation = businessValidation[field];
      const value = formData[field];

      if (validation.required && !value) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      } else if (value && validation.validate && !validation.validate(value)) {
        newErrors[field] = validation.message;
      }
    });

    if (!formData.category && !formData.subcategory) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleGeolocate = useCallback(async () => {
    try {
      setLocationLoading(true);
      const position = await getCurrentPosition();
      setFormData(prev => ({
        ...prev,
        latitude: position.latitude.toString(),
        longitude: position.longitude.toString()
      }));
      showToast('Location detected successfully', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLocationLoading(false);
    }
  }, [showToast]);

  const handleAddressLookup = useCallback(async () => {
    if (!formData.address || !formData.city || !formData.state) {
      showToast('Please enter address, city, and state first', 'error');
      return;
    }

    try {
      setGeocodingLoading(true);
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip_code}`;
      const coords = await getCoordsFromAddress(fullAddress);
      setFormData(prev => ({
        ...prev,
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString()
      }));
      showToast('Coordinates found successfully', 'success');
    } catch (error) {
      showToast('Could not find coordinates for this address', 'error');
    } finally {
      setGeocodingLoading(false);
    }
  }, [formData.address, formData.city, formData.state, formData.zip_code, showToast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors before submitting', 'error');
      return;
    }

    setLoading(true);

    try {
      const finalCategory = formData.subcategory || formData.category;
      const categoryDisplayName = getCategoryDisplayName(finalCategory);

      const submitData = {
        ...formData,
        category: finalCategory,
        category_display: categoryDisplayName,
        main_category: formData.category,
        subcategory: formData.subcategory || null,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        operating_hours: operatingHours,
        special_hours: specialHours
      };

      delete submitData.subcategory;

      let result;
      if (mode === 'create') {
        result = await createBusiness(submitData, logoFile, backgroundFile);
        localStorage.removeItem('business_draft_new');
      } else {
        const targetBusinessId = businessId || business?.id;
        if (!targetBusinessId) {
          throw new Error('Business ID is required for update');
        }
        result = await updateBusiness(targetBusinessId, submitData, logoFile, backgroundFile);
      }

      const targetBusinessId = businessId || business?.id;
      if (targetBusinessId) {
        window.dispatchEvent(new CustomEvent('operating-hours-updated', {
          detail: {
            businessId: targetBusinessId,
            operatingHours: operatingHours,
            specialHours: specialHours
          }
        }));
      }

      showToast(
        mode === 'create' ? 'Business created successfully' : 'Business updated successfully',
        'success'
      );

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Business form error:', error);
      showToast(error.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, mode, logoFile, backgroundFile, businessId, business, operatingHours, specialHours, createBusiness, updateBusiness, showToast, onSuccess]);

  const handleCategoryToggle = useCallback((categoryId, isSubcategory = false) => {
    if (isSubcategory) {
      setFormData(prev => ({ ...prev, subcategory: categoryId }));
    } else {
      setFormData(prev => ({ ...prev, category: categoryId, subcategory: '' }));
    }
  }, []);

  const toggleCategoryExpansion = useCallback((categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  }, []);

  const getSelectedCategoryDisplay = useCallback(() => {
    if (formData.subcategory) {
      return getCategoryPath(formData.subcategory);
    } else if (formData.category) {
      return getCategoryDisplayName(formData.category);
    }
    return 'No category selected';
  }, [formData.subcategory, formData.category]);

  const getSelectedCount = useCallback(() => {
    let count = 0;
    if (formData.category) count++;
    if (formData.subcategory) count++;
    return count;
  }, [formData.category, formData.subcategory]);

  // ============================================
  // RENDER SECTION COMPONENTS
  // ============================================

  const renderBasicSection = () => (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2>Basic Information</h2>
        <p>Tell customers who you are and what you do</p>
      </div>

      <div className="settings-field">
        <label className="settings-label">
          Business Name <span className="required">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`settings-input ${errors.name ? 'error' : ''}`}
          placeholder="Enter your business name"
        />
        {errors.name && <div className="settings-error">{errors.name}</div>}
      </div>

      <div className="settings-field">
        <label className="settings-label">
          Description <span className="required">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`settings-textarea ${errors.description ? 'error' : ''}`}
          placeholder="Describe what makes your business special"
          rows={4}
        />
        {errors.description && <div className="settings-error">{errors.description}</div>}
      </div>
    </div>
  );

  const renderCategorySection = () => (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2>Category</h2>
        <p>Select the category that best describes your business</p>
      </div>

      <div className="category-toggle">
        <button
          type="button"
          className={`toggle-btn ${viewMode === 'simple' ? 'active' : ''}`}
          onClick={() => setViewMode('simple')}
        >
          Simple
        </button>
        <button
          type="button"
          className={`toggle-btn ${viewMode === 'byCategory' ? 'active' : ''}`}
          onClick={() => setViewMode('byCategory')}
        >
          By Category
        </button>
        <button
          type="button"
          className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          All Subcategories
        </button>
      </div>

      {viewMode === 'simple' && (
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={`settings-select ${errors.category ? 'error' : ''}`}
        >
          <option value="">Select a category</option>
          {BUSINESS_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      )}

      {viewMode === 'byCategory' && (
        <div className="categories-list">
          {mainCategories.map(cat => {
            const isExpanded = expandedCategories[cat.id];
            const isSelected = formData.category === cat.id;
            return (
              <div key={cat.id} className="category-group">
                <div
                  className={`category-header ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleCategoryToggle(cat.id, false)}
                >
                  <span className="category-name">{cat.label}</span>
                  {cat.subcategories.length > 0 && (
                    <button
                      type="button"
                      className="expand-btn"
                      onClick={(e) => { e.stopPropagation(); toggleCategoryExpansion(cat.id); }}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  )}
                </div>
                {isExpanded && cat.subcategories.length > 0 && (
                  <div className="subcategories-list">
                    {cat.subcategories.map(sub => (
                      <div
                        key={sub.id}
                        className={`subcategory-item ${formData.subcategory === sub.id ? 'selected' : ''}`}
                        onClick={() => handleCategoryToggle(sub.id, true)}
                      >
                        <span className="subcategory-name">{sub.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'all' && (
        <div className="subcategories-grid">
          {allSubcategories.map(sub => (
            <div
              key={sub.id}
              className={`subcategory-card ${formData.subcategory === sub.id ? 'selected' : ''}`}
              onClick={() => handleCategoryToggle(sub.id, true)}
            >
              <span className="subcategory-name">{sub.label}</span>
              <span className="subcategory-parent">{sub.parentLabel}</span>
            </div>
          ))}
        </div>
      )}

      {(formData.category || formData.subcategory) && (
        <div className="selected-category-display">
          <div className="selected-category-label">Selected Category:</div>
          <div className="selected-category-value">{getSelectedCategoryDisplay()}</div>
        </div>
      )}

      {errors.category && <div className="settings-error">{errors.category}</div>}
    </div>
  );

  const renderContactSection = () => (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2>Contact Details</h2>
        <p>How customers can reach you</p>
      </div>

      <div className="settings-field">
        <label className="settings-label">
          Phone Number <span className="required">*</span>
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          className={`settings-input ${errors.phone ? 'error' : ''}`}
          placeholder="+1 (555) 000-0000"
        />
        {errors.phone && <div className="settings-error">{errors.phone}</div>}
      </div>

      <div className="settings-field">
        <label className="settings-label">
          Email Address <span className="required">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`settings-input ${errors.email ? 'error' : ''}`}
          placeholder="hello@yourbusiness.com"
        />
        {errors.email && <div className="settings-error">{errors.email}</div>}
      </div>

      <div className="settings-field">
        <label className="settings-label">Website</label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => handleChange('website', e.target.value)}
          className="settings-input"
          placeholder="https://www.yourbusiness.com"
        />
      </div>
    </div>
  );

  const renderLocationSection = () => (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2>Location</h2>
        <p>Where customers can find you</p>
      </div>

      <div className="settings-field">
        <label className="settings-label">
          Street Address <span className="required">*</span>
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className={`settings-input ${errors.address ? 'error' : ''}`}
          placeholder="123 Main Street"
        />
        {errors.address && <div className="settings-error">{errors.address}</div>}
      </div>

      <div className="settings-row">
        <div className="settings-field">
          <label className="settings-label">
            City <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className={`settings-input ${errors.city ? 'error' : ''}`}
            placeholder="New York"
          />
          {errors.city && <div className="settings-error">{errors.city}</div>}
        </div>

        <div className="settings-field">
          <label className="settings-label">
            State <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className={`settings-input ${errors.state ? 'error' : ''}`}
            placeholder="NY"
          />
          {errors.state && <div className="settings-error">{errors.state}</div>}
        </div>
      </div>

      <div className="settings-field">
        <label className="settings-label">ZIP Code</label>
        <input
          type="text"
          value={formData.zip_code}
          onChange={(e) => handleChange('zip_code', e.target.value)}
          className="settings-input"
          placeholder="10001"
        />
      </div>

      <div className="settings-divider" />

      <div className="settings-field">
        <label className="settings-label">Coordinates</label>
        <div className="coordinates-grid">
          <input
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => handleChange('latitude', e.target.value)}
            placeholder="Latitude"
            className="settings-input"
          />
          <input
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => handleChange('longitude', e.target.value)}
            placeholder="Longitude"
            className="settings-input"
          />
        </div>
      </div>

      <div className="location-actions">
        <button type="button" className="secondary-btn" onClick={handleGeolocate} disabled={locationLoading}>
          {locationLoading ? 'Detecting...' : 'Use Live Location'}
        </button>
        <button type="button" className="secondary-btn" onClick={handleAddressLookup} disabled={geocodingLoading}>
          {geocodingLoading ? 'Looking up...' : 'Lookup from Address'}
        </button>
      </div>
    </div>
  );

  const renderMediaSection = () => (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2>Media</h2>
        <p>Visual identity of your business</p>
      </div>

      <div className="media-grid">
        <div className="media-card">
          <div className="media-card-header">
            <span className="media-title">Business Logo</span>
            <span className={`media-status ${logoPreview ? 'uploaded' : 'empty'}`}>
              {logoPreview ? 'Uploaded' : 'Not uploaded'}
            </span>
          </div>
          <div className="media-preview">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" />
            ) : (
              <div className="media-placeholder">
                <p>No logo uploaded</p>
                <small>Recommended: 300x300px</small>
              </div>
            )}
          </div>
          <div className="media-actions">
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleLogoSelect(e.target.files[0])}
            />
            <button type="button" className="upload-btn" onClick={() => document.getElementById('logo-upload').click()}>
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </button>
            {logoPreview && (
              <button type="button" className="remove-btn" onClick={handleLogoRemove}>
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="media-card">
          <div className="media-card-header">
            <span className="media-title">Background Picture</span>
            <span className={`media-status ${backgroundPreview ? 'uploaded' : 'empty'}`}>
              {backgroundPreview ? 'Uploaded' : 'Not uploaded'}
            </span>
          </div>
          <div className="media-preview">
            {backgroundPreview ? (
              <img src={backgroundPreview} alt="Background preview" />
            ) : (
              <div className="media-placeholder">
                <p>No background uploaded</p>
                <small>Recommended: 1200x400px</small>
              </div>
            )}
          </div>
          <div className="media-actions">
            <input
              type="file"
              id="background-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleBackgroundSelect(e.target.files[0])}
            />
            <button type="button" className="upload-btn" onClick={() => document.getElementById('background-upload').click()}>
              {backgroundPreview ? 'Change Background' : 'Upload Background'}
            </button>
            {backgroundPreview && (
              <button type="button" className="remove-btn" onClick={handleBackgroundRemove}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHoursSection = () => {
    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' }
    ];

    return (
      <div className="settings-section">
        <div className="settings-section-header">
          <h2>Operating Hours</h2>
          <p>When your business is open</p>
        </div>

        <div className="hours-toolbar">
          <div className="time-format-toggle">
            <button type="button" className={timeFormat === '12h' ? 'active' : ''} onClick={() => setTimeFormat('12h')}>12h</button>
            <button type="button" className={timeFormat === '24h' ? 'active' : ''} onClick={() => setTimeFormat('24h')}>24h</button>
          </div>
          <div className="quick-actions">
            <button type="button" className="quick-action" onClick={copyHoursToWeekdays}>Copy Monday to Weekdays</button>
            <button type="button" className="quick-action" onClick={copyHoursToAll}>Copy to All Days</button>
          </div>
        </div>

        <div className="hours-list">
          {days.map(day => {
            const hourData = operatingHours[day.key];
            return (
              <div key={day.key} className="hour-row">
                <div className="hour-day">
                  <span className="day-label">{day.label}</span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={hourData.enabled} onChange={() => toggleDayEnabled(day.key)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                {hourData.enabled ? (
                  <div className="hour-time">
                    <input
                      type="time"
                      value={hourData.open}
                      onChange={(e) => handleHourChange(day.key, 'open', e.target.value)}
                      className="time-input"
                    />
                    <span>–</span>
                    <input
                      type="time"
                      value={hourData.close}
                      onChange={(e) => handleHourChange(day.key, 'close', e.target.value)}
                      className="time-input"
                    />
                  </div>
                ) : (
                  <div className="hour-closed">
                    <span className="closed-badge">Closed</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="special-hours">
          <div className="special-hours-header">
            <h3>Special Hours</h3>
            <button type="button" className="add-special-btn" onClick={() => { setEditingSpecialHour(null); setShowSpecialHoursModal(true); }}>
              Add Special Hours
            </button>
          </div>

          {specialHours.length > 0 ? (
            <div className="special-hours-list">
              {specialHours.map(special => (
                <div key={special.id} className="special-hour-item">
                  <div className="special-hour-info">
                    <span className="special-date">{new Date(special.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span className="special-time">{special.closed ? 'Closed' : `${formatTimeForDisplay(special.open)} – ${formatTimeForDisplay(special.close)}`}</span>
                    {special.reason && <span className="special-reason">{special.reason}</span>}
                  </div>
                  <div className="special-hour-actions">
                    <button type="button" onClick={() => { setEditingSpecialHour(special); setShowSpecialHoursModal(true); }}>Edit</button>
                    <button type="button" onClick={() => removeSpecialHour(special.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="special-hours-empty">
              <p>No special hours set</p>
              <small>Add special hours for holidays or events</small>
            </div>
          )}
        </div>

        <div className="hours-preview">
          <h3>Preview</h3>
          <div className="preview-grid">
            {days.map(day => {
              const hourData = operatingHours[day.key];
              return (
                <div key={day.key} className="preview-item">
                  <span className="preview-day">{day.label}</span>
                  <span className="preview-time">
                    {hourData.enabled ? `${formatTimeForDisplay(hourData.open)} – ${formatTimeForDisplay(hourData.close)}` : 'Closed'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTagsSection = () => (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2>Tags</h2>
        <p>Help customers discover your business</p>
      </div>

      <div className="tags-container">
        <div className="tags-input-row">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagInputKeyPress}
            placeholder="Add a tag (e.g., cozy, family-friendly, organic)"
          />
          <button type="button" onClick={handleAddTag} disabled={!tagInput.trim()}>Add</button>
        </div>

        <div className="tags-list">
          {formData.tags.length > 0 ? (
            formData.tags.map((tag, index) => (
              <div key={index} className="tag">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
              </div>
            ))
          ) : (
            <div className="tags-empty">
              <p>No tags added yet</p>
              <small>Add your first tag above</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDangerSection = () => (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2>Danger Zone</h2>
        <p>Irreversible actions</p>
      </div>

      <div className="danger-card">
        <div className="danger-info">
          <h3>Delete Business</h3>
          <p>Permanently delete your business and all associated data. This action cannot be undone.</p>
        </div>
        <button type="button" className="danger-btn" onClick={() => setDeleteConfirmOpen(true)}>
          Delete Business
        </button>
      </div>
    </div>
  );

  // Render ONLY the active section when in compactMode (for modal)
  const renderActiveSection = () => {
    switch(activeSection) {
      case 'basic':
        return renderBasicSection();
      case 'category':
        return renderCategorySection();
      case 'contact':
        return renderContactSection();
      case 'location':
        return renderLocationSection();
      case 'media':
        return renderMediaSection();
      case 'hours':
        return renderHoursSection();
      case 'tags':
        return renderTagsSection();
      case 'danger':
        return renderDangerSection();
      default:
        return renderBasicSection();
    }
  };

  // Render ALL sections when in standalone mode
  const renderAllSections = () => (
    <div className="settings-all-sections">
      {renderBasicSection()}
      {renderCategorySection()}
      {renderContactSection()}
      {renderLocationSection()}
      {renderMediaSection()}
      {renderHoursSection()}
      {renderTagsSection()}
      {renderDangerSection()}
    </div>
  );

  // Special Hours Modal Component
  const SpecialHoursModal = () => {
    const [modalFormData, setModalFormData] = useState({
      date: editingSpecialHour?.date || new Date().toISOString().split('T')[0],
      closed: editingSpecialHour?.closed || false,
      open: editingSpecialHour?.open || '09:00',
      close: editingSpecialHour?.close || '17:00',
      reason: editingSpecialHour?.reason || ''
    });

    const handleModalSubmit = (e) => {
      e.preventDefault();
      addSpecialHour(modalFormData);
    };

    if (!showSpecialHoursModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowSpecialHoursModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{editingSpecialHour ? 'Edit Special Hours' : 'Add Special Hours'}</h3>
            <button className="modal-close" onClick={() => setShowSpecialHoursModal(false)}>×</button>
          </div>
          <form onSubmit={handleModalSubmit}>
            <div className="modal-field">
              <label>Date</label>
              <input
                type="date"
                value={modalFormData.date}
                onChange={(e) => setModalFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="modal-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={modalFormData.closed}
                  onChange={(e) => setModalFormData(prev => ({ ...prev, closed: e.target.checked }))}
                />
                Closed all day
              </label>
            </div>
            {!modalFormData.closed && (
              <div className="modal-time-row">
                <div className="modal-time-field">
                  <label>Open Time</label>
                  <input
                    type="time"
                    value={modalFormData.open}
                    onChange={(e) => setModalFormData(prev => ({ ...prev, open: e.target.value }))}
                    required
                  />
                </div>
                <div className="modal-time-field">
                  <label>Close Time</label>
                  <input
                    type="time"
                    value={modalFormData.close}
                    onChange={(e) => setModalFormData(prev => ({ ...prev, close: e.target.value }))}
                    required
                  />
                </div>
              </div>
            )}
            <div className="modal-field">
              <label>Reason (optional)</label>
              <input
                type="text"
                value={modalFormData.reason}
                onChange={(e) => setModalFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Holiday, Special Event, Maintenance"
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setShowSpecialHoursModal(false)}>Cancel</button>
              <button type="submit" className="modal-save">{editingSpecialHour ? 'Save Changes' : 'Add Special Hours'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const isEditMode = mode === 'edit' && business;

  // Return different layouts based on compactMode
  return (
    <>
      <div className="business-form__container">
        {/* Header - only show in standalone mode */}
        {!compactMode && (
          <div className="business-form__header">
            <div className="business-form__header-left">
              {showDrawer && (mode === 'edit' || isEditMode) && (
                <button className="menu-btn" onClick={() => setDrawerOpen(true)}>☰</button>
              )}
              <div className="logo">
                <span className="logo-text">KASI Business</span>
              </div>
            </div>

            <div className="business-form__header-center">
              <h1 className="header-title">
                {mode === 'create' ? 'Create Your Business' : `${getGreeting()}, ${business?.name || 'there'}`}
              </h1>
            </div>

            <div className="business-form__header-right">
              {showDrawer && (mode === 'edit' || isEditMode) && (
                <button className="profile-btn" onClick={() => setDrawerOpen(true)}>
                  <div className="profile-avatar">
                    {logoPreview ? <img src={logoPreview} alt={business?.name} /> : <span>{business?.name?.charAt(0) || 'B'}</span>}
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        <main className="business-form__main">
          <form onSubmit={handleSubmit} className="business-form">
            {/* MODE: Show only active section (for modal) OR all sections (standalone) */}
            {compactMode ? renderActiveSection() : renderAllSections()}

            {/* Submit button (hidden for modal, visible for standalone) */}
            {!compactMode && (
              <div className="form-actions">
                {onCancel && (
                  <button type="button" className="cancel-btn" onClick={onCancel} disabled={loading}>
                    Cancel
                  </button>
                )}
                <button type="submit" id="business-form-submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Saving...' : (mode === 'create' ? 'Create Business' : 'Save Changes')}
                </button>
              </div>
            )}

            {/* Hidden submit button for modal to trigger */}
            <button type="submit" id="business-form-submit" style={{ display: 'none' }} />
          </form>
        </main>

        {/* Bottom Navigation Bar (Mobile - Standalone only) */}
        {showBottomNav && isMobile && (mode === 'edit' || isEditMode) && !compactMode && (
          <nav className="business-form__bottom-nav">
            {navTabs.map(tab => (
              <button key={tab.id} className={`bottom-nav-item ${tab.id === 'settings' ? 'active' : ''}`} onClick={() => navigate(tab.path)}>
                <span className="nav-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Side Drawer (Standalone only) */}
      {showDrawer && (mode === 'edit' || isEditMode) && !compactMode && (
        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} position="right" width="320px">
          <div className="business-form__drawer">
            <div className="drawer-header">
              <div className="drawer-avatar">
                {logoPreview ? <img src={logoPreview} alt={business?.name} /> : <span>{business?.name?.charAt(0) || 'B'}</span>}
              </div>
              <div className="drawer-info">
                <h3>{business?.name || 'Business'}</h3>
                <p>{business?.email || 'No email set'}</p>
              </div>
            </div>
            <div className="drawer-section">
              <div className="section-title">Account</div>
              <button className="drawer-item">Profile</button>
              <button className="drawer-item">Privacy & Security</button>
              <button className="drawer-item">Notifications</button>
            </div>
            <div className="drawer-section">
              <div className="section-title">Business</div>
              <button className="drawer-item">Team Members</button>
              <button className="drawer-item">Billing & Plans</button>
              <button className="drawer-item">Analytics</button>
            </div>
            <div className="drawer-footer">
              <button className="drawer-item danger">Log Out</button>
              <div className="drawer-version">Version 2.0.0 (2026)</div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); setConfirmDeleteText(''); }} title="Delete Business" size="small"
        actions={[
          { label: 'Cancel', variant: 'outline', onClick: () => { setDeleteConfirmOpen(false); setConfirmDeleteText(''); } },
          { label: deleteLoading ? 'Deleting...' : 'Delete Business', variant: 'danger', onClick: handleDeleteBusiness, loading: deleteLoading, disabled: confirmDeleteText !== 'DELETE' }
        ]}
      >
        <div className="delete-confirm">
          <div className="delete-warning">⚠️</div>
          <h3>Are you absolutely sure?</h3>
          <p>You are about to permanently delete <strong>{business?.name}</strong>. This action cannot be undone.</p>
          <p>Type <strong>DELETE</strong> to confirm.</p>
          <input type="text" placeholder="Type DELETE" className="confirm-input" value={confirmDeleteText} onChange={(e) => setConfirmDeleteText(e.target.value)} autoFocus />
        </div>
      </Modal>

      {/* Special Hours Modal */}
      <SpecialHoursModal />
    </>
  );
};

export default React.memo(BusinessForm);