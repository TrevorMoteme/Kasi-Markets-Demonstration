import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { useApp } from '../../contexts/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDevice } from '../../hooks/useMediaQuery';
import BusinessCard from '../../components/business/BusinessCard';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchModal from '../../components/search/SearchModal';
import { getCategoryDisplayName } from '../../utils/constants';
import './BusinessSearch.css';

const BusinessSearch = () => {
  const { searchResults, searchBusinesses, searchType, loading, clearSearchResults, hasMore, loadMore } = useBusiness();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useDevice();
  const loadMoreRef = useRef();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState(null);
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [sortBy, setSortBy] = useState('popularity');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [visibleResults, setVisibleResults] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [isSticky, setIsSticky] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [touchStart, setTouchStart] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const headerRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const heroRef = useRef(null);

  // SVG Icons matching BusinessProfile
  const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  );

  const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  );

  const StarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  );

  const HeartIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  );

  const TrendingIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
    </svg>
  );

  const LocationIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  );

  const FilterIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
    </svg>
  );

  // Get user location from localStorage or preferences
  useEffect(() => {
    const getUserLocationData = async () => {
      try {
        const savedLocation = localStorage.getItem('user_location');
        if (savedLocation) {
          const locationData = JSON.parse(savedLocation);
          if (locationData.latitude && locationData.longitude) {
            setUserLocation({
              lat: locationData.latitude,
              lng: locationData.longitude
            });
          }
        }

        const sessionLocation = sessionStorage.getItem('user_coordinates');
        if (sessionLocation && !userLocation) {
          const coords = JSON.parse(sessionLocation);
          setUserLocation({
            lat: coords.latitude,
            lng: coords.longitude
          });
        }
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    };

    getUserLocationData();
  }, []);

  // Get search params from URL or state
  useEffect(() => {
    const searchParams = location.state?.searchParams;
    if (searchParams) {
      setCurrentSearchParams(searchParams);
      if (searchParams.category) {
        setSelectedCategory(searchParams.category);
      }
    }
  }, [location.state]);

  // Update visible results when search results change
  useEffect(() => {
    setVisibleResults(searchResults);
  }, [searchResults]);

  // Filter results by category
  useEffect(() => {
    if (selectedCategory && searchResults.length > 0) {
      const filtered = searchResults.filter(b =>
        b.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      applySorting(filtered, sortBy);
    } else {
      applySorting(searchResults, sortBy);
    }
  }, [selectedCategory, searchResults, sortBy, sortDirection, userLocation]);

  // Parallax and scroll effects
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        setParallaxOffset(scrolled * 0.3);
        setShowBackToTop(scrolled > 500);
      }
      if (headerRef.current) {
        const offset = headerRef.current.offsetTop;
        setIsSticky(window.scrollY > offset);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Apply sorting to results
  const applySorting = useCallback((results, sortType) => {
    if (!results || results.length === 0) {
      setVisibleResults([]);
      return;
    }

    let sorted = [...results];

    switch (sortType) {
      case 'popularity':
        sorted.sort((a, b) => {
          const aScore = (a.likes_count || 0) + (a.followers_count || 0) + (a.review_count || 0);
          const bScore = (b.likes_count || 0) + (b.followers_count || 0) + (b.review_count || 0);
          return bScore - aScore;
        });
        break;
      case 'distance':
        if (userLocation && userLocation.lat && userLocation.lng) {
          sorted = sorted.map(business => {
            if (business.latitude && business.longitude) {
              const distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                parseFloat(business.latitude), parseFloat(business.longitude)
              );
              return { ...business, calculated_distance: distance };
            }
            return { ...business, calculated_distance: Infinity };
          });

          sorted.sort((a, b) => {
            const aDist = a.calculated_distance || Infinity;
            const bDist = b.calculated_distance || Infinity;
            return sortDirection === 'asc' ? aDist - bDist : bDist - aDist;
          });
        } else {
          showToast('Enable location to sort by distance', 'info');
          sorted.sort((a, b) => {
            const aScore = (a.likes_count || 0) + (a.followers_count || 0) + (a.review_count || 0);
            const bScore = (b.likes_count || 0) + (b.followers_count || 0) + (b.review_count || 0);
            return bScore - aScore;
          });
        }
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => {
          const aScore = (a.likes_count || 0) + (a.followers_count || 0) + (a.review_count || 0);
          const bScore = (b.likes_count || 0) + (b.followers_count || 0) + (b.review_count || 0);
          return bScore - aScore;
        });
    }

    setVisibleResults(sorted);
  }, [userLocation, calculateDistance, sortDirection, showToast]);

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    applySorting(visibleResults, newSort);
    if (isMobile && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
  };

  // Toggle sort direction for distance
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    applySorting(visibleResults, sortBy);
    if (isMobile && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
  };

  // Handle search from modal
  const handleSearch = async (searchParams, searchType = 'advanced') => {
    try {
      setCurrentSearchParams({ ...searchParams, search_type: searchType });
      if (searchParams.category) {
        setSelectedCategory(searchParams.category);
      }
      await searchBusinesses(searchParams, searchType);
      setIsSearchModalOpen(false);

      navigate('/business/search', {
        state: { searchParams: { ...searchParams, search_type: searchType } },
        replace: true
      });

      if (isMobile && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    } catch (error) {
      showToast('Search failed', 'error');
    }
  };

  // Handle edit search
  const handleEditSearch = () => {
    setIsSearchModalOpen(true);
  };

  // Handle new search
  const handleNewSearch = () => {
    clearSearchResults();
    setCurrentSearchParams(null);
    setSelectedCategory(null);
    setSortBy('popularity');
    setSortDirection('asc');
    setIsSearchModalOpen(true);
  };

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (isMobile && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(20);
    }
  };

  // Handle image error
  const handleImageError = (businessId, type = 'business') => {
    setImageErrors(prev => ({
      ...prev,
      [`${type}_${businessId}`]: true
    }));
  };

  // Mobile swipe gestures for results
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !isMobile) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 100) {
      console.log('Swipe detected:', diff > 0 ? 'left' : 'right');
    }
    setTouchStart(null);
  };

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.3 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore, loadMore]);

  // Get unique categories from results
  const getCategories = () => {
    const categories = new Set();
    searchResults.forEach(b => {
      if (b.category) categories.add(b.category);
    });
    return Array.from(categories);
  };

  const categories = getCategories();
  const hasSearchResults = visibleResults.length > 0;
  const hasActiveSearch = !!currentSearchParams;

  // Format search summary
  const getSearchSummary = () => {
    if (!currentSearchParams) return '';

    const parts = [];
    if (currentSearchParams.query) {
      parts.push(`"${currentSearchParams.query}"`);
    }
    if (currentSearchParams.category) {
      parts.push(getCategoryDisplayName(currentSearchParams.category));
    }
    if (currentSearchParams.city) {
      parts.push(currentSearchParams.city);
    }
    if (currentSearchParams.max_distance_km) {
      const dist = distanceUnit === 'miles'
        ? Math.round(currentSearchParams.max_distance_km * 0.621371)
        : currentSearchParams.max_distance_km;
      parts.push(`within ${dist}${distanceUnit}`);
    }
    return parts.join(' • ');
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="business-search-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* CINEMATIC HERO SECTION */}
      <div className="business-search-full__hero" ref={heroRef}>
        <div
          className="business-search-full__hero-background"
          style={{
            transform: `translateY(${parallaxOffset * 0.1}px) scale(${1 + parallaxOffset * 0.0003})`
          }}
        />
        <div className="business-search-full__hero-content">
          <h1 className="business-search-full__hero-title">Discover Local Businesses</h1>
          <p className="business-search-full__hero-subtitle">
            Find the best restaurants, shops, and services in your area
          </p>
          <div className="business-search-full__hero-search" onClick={handleEditSearch}>
            <SearchIcon />
            <span>{getSearchSummary() || 'Search for businesses...'}</span>
          </div>
          <div className="business-search-full__hero-stats">
            <div className="business-search-full__hero-stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Businesses</span>
            </div>
            <div className="business-search-full__hero-stat">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Reviews</span>
            </div>
            <div className="business-search-full__hero-stat">
              <span className="stat-number">100K+</span>
              <span className="stat-label">Happy Users</span>
            </div>
          </div>
        </div>
        <div className="business-search-full__scroll-indicator" onClick={() => resultsContainerRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          <span />
        </div>
      </div>

      {/* STICKY SEARCH HEADER */}
      <div
        ref={headerRef}
        className={`business-search-full__sticky-header ${isSticky ? 'is-sticky' : ''}`}
      >
        <div className="business-search-full__header-content">
          <div className="business-search-full__search-wrapper" onClick={handleEditSearch}>
            <SearchIcon />
            <span className="business-search-full__search-text">
              {getSearchSummary() || 'Search for businesses...'}
            </span>
          </div>
          <Button
            variant="primary"
            onClick={handleNewSearch}
            className="business-search-full__new-btn"
          >
            New Search
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="business-search-full__main">
        <div className="business-search-full__layout">
          {/* LEFT SIDEBAR - Filters */}
          <div className="business-search-full__sidebar">
            {/* Category Filter Section */}
            <div className="business-search-full__sidebar-section">
              <div className="business-search-full__sidebar-header">
                <h3 className="business-search-full__sidebar-title">
                  <FilterIcon /> Categories
                </h3>
                {selectedCategory && (
                  <button
                    className="business-search-full__clear-btn"
                    onClick={() => handleCategoryChange(null)}
                  >
                    <CloseIcon /> Clear
                  </button>
                )}
              </div>
              <div className="business-search-full__category-list">
                {['All', ...categories.slice(0, 8)].map((cat, idx) => (
                  <button
                    key={idx}
                    className={`business-search-full__category-item ${selectedCategory === cat || (cat === 'All' && !selectedCategory) ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat === 'All' ? null : cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options Section */}
            <div className="business-search-full__sidebar-section">
              <h3 className="business-search-full__sidebar-title">
                <TrendingIcon /> Sort By
              </h3>
              <div className="business-search-full__sort-options">
                <button
                  className={`business-search-full__sort-option ${sortBy === 'popularity' ? 'active' : ''}`}
                  onClick={() => handleSortChange('popularity')}
                >
                  Popularity
                </button>
                <button
                  className={`business-search-full__sort-option ${sortBy === 'distance' ? 'active' : ''}`}
                  onClick={() => handleSortChange('distance')}
                >
                  <LocationIcon /> Distance
                </button>
                <button
                  className={`business-search-full__sort-option ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => handleSortChange('name')}
                >
                  Name A-Z
                </button>
              </div>

              {/* Distance Direction Toggle */}
              {sortBy === 'distance' && (
                <div className="business-search-full__direction-toggle">
                  <button
                    className={`direction-btn ${sortDirection === 'asc' ? 'active' : ''}`}
                    onClick={() => sortDirection !== 'asc' && toggleSortDirection()}
                  >
                    Nearest First
                  </button>
                  <button
                    className={`direction-btn ${sortDirection === 'desc' ? 'active' : ''}`}
                    onClick={() => sortDirection !== 'desc' && toggleSortDirection()}
                  >
                    Farthest First
                  </button>
                </div>
              )}

              {/* Distance Unit Toggle */}
              <div className="business-search-full__unit-toggle">
                <button
                  className={`business-search-full__unit-btn ${distanceUnit === 'km' ? 'active' : ''}`}
                  onClick={() => setDistanceUnit('km')}
                >
                  km
                </button>
                <button
                  className={`business-search-full__unit-btn ${distanceUnit === 'miles' ? 'active' : ''}`}
                  onClick={() => setDistanceUnit('miles')}
                >
                  miles
                </button>
              </div>

              {/* Location Status */}
              {sortBy === 'distance' && !userLocation && (
                <div className="business-search-full__location-warning">
                  <LocationIcon /> Enable location for distance sorting
                </div>
              )}
            </div>

            {/* Results Stats Section */}
            {hasSearchResults && (
              <div className="business-search-full__sidebar-section">
                <h3 className="business-search-full__sidebar-title">
                  <HeartIcon /> Results
                </h3>
                <div className="business-search-full__stats">
                  <div className="business-search-full__stat-item">
                    <div className="business-search-full__stat-value">{visibleResults.length}</div>
                    <div className="business-search-full__stat-label">Businesses</div>
                  </div>
                  <div className="business-search-full__stat-item">
                    <div className="business-search-full__stat-value">{categories.length}</div>
                    <div className="business-search-full__stat-label">Categories</div>
                  </div>
                  <div className="business-search-full__stat-item">
                    <div className="business-search-full__stat-value">
                      {visibleResults.filter(b => b.rating >= 4).length}
                    </div>
                    <div className="business-search-full__stat-label">Top Rated</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="business-search-full__main-content" ref={resultsContainerRef}>
            {loading && searchResults.length === 0 ? (
              <div className="business-search-full__loading">
                <LoadingSpinner size="large" />
                <p>Searching for businesses...</p>
              </div>
            ) : hasSearchResults ? (
              <>
                {/* Results Header */}
                <div className="business-search-full__results-header">
                  <div className="business-search-full__results-count">
                    <span className="business-search-full__count-number">{visibleResults.length}</span>
                    <span className="business-search-full__count-label">
                      {visibleResults.length === 1 ? 'business' : 'businesses'} found
                    </span>
                  </div>
                  {selectedCategory && (
                    <div className="business-search-full__category-badge">
                      <span className="business-search-full__category-label">
                        {getCategoryDisplayName(selectedCategory)}
                      </span>
                      <button
                        className="business-search-full__category-clear"
                        onClick={() => handleCategoryChange(null)}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {/* Results Grid */}
                <div className="business-search-full__grid">
                  {visibleResults.map((business) => (
                    <BusinessCard
                      key={business.id}
                      business={{
                        ...business,
                        calculated_distance: business.calculated_distance
                      }}
                      distanceUnit={distanceUnit}
                      showActions={true}
                      onImageError={handleImageError}
                      hasImageError={imageErrors[`business_${business.id}`]}
                      variant="youtube"
                    />
                  ))}
                </div>

                {/* Loading More Indicator */}
                {loading && (
                  <div className="business-search-full__loading-more">
                    <LoadingSpinner size="small" />
                    <span>Loading more...</span>
                  </div>
                )}

                {/* Load More Trigger */}
                {hasMore && !loading && (
                  <div ref={loadMoreRef} className="business-search-full__load-more-trigger" />
                )}

                {/* End of Results */}
                {!hasMore && searchResults.length > 0 && (
                  <div className="business-search-full__end-results">
                    <p>✨ You've reached the end of the results</p>
                  </div>
                )}
              </>
            ) : hasActiveSearch ? (
              /* No Results State */
              <div className="business-search-full__empty">
                <div className="business-search-full__empty-icon">🔍</div>
                <div className="business-search-full__empty-title">No businesses found</div>
                <p className="business-search-full__empty-message">
                  Try adjusting your search filters or try a different search term.
                </p>
                <div className="business-search-full__empty-actions">
                  <Button variant="primary" onClick={handleEditSearch}>
                    Edit Search
                  </Button>
                  <Button variant="outline" onClick={handleNewSearch}>
                    New Search
                  </Button>
                </div>
              </div>
            ) : (
              /* Initial State - Already handled by hero section */
              null
            )}
          </div>
        </div>
      </div>

      {/* BACK TO TOP BUTTON */}
      <button
        className={`business-search-full__back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
      >
        ↑
      </button>

      {/* SEARCH MODAL */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearch={handleSearch}
        initialParams={currentSearchParams}
        loading={loading}
      />

      {/* MOBILE BOTTOM SHEET */}
      {isMobile && (
        <div className={`business-search-full__bottom-sheet ${bottomSheetOpen ? 'open' : ''}`}>
          <div className="business-search-full__bottom-sheet-handle" onClick={() => setBottomSheetOpen(!bottomSheetOpen)} />
          {!bottomSheetOpen && (
            <div className="business-search-full__swipe-hint">
              ↑ Swipe up for filters ↑
            </div>
          )}
          <div className="business-search-full__bottom-sheet-content">
            {/* Categories Section */}
            <div className="business-search-full__bottom-sheet-section">
              <div className="business-search-full__bottom-sheet-title">
                <FilterIcon /> Categories
              </div>
              <div className="business-search-full__bottom-sheet-categories">
                {['All', ...categories.slice(0, 10)].map((cat, idx) => (
                  <button
                    key={idx}
                    className={`business-search-full__bottom-category ${selectedCategory === cat || (cat === 'All' && !selectedCategory) ? 'active' : ''}`}
                    onClick={() => {
                      handleCategoryChange(cat === 'All' ? null : cat);
                      setBottomSheetOpen(false);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options Section */}
            <div className="business-search-full__bottom-sheet-section">
              <div className="business-search-full__bottom-sheet-title">
                <TrendingIcon /> Sort By
              </div>
              <div className="business-search-full__bottom-sort-options">
                <button
                  className={`bottom-sort-option ${sortBy === 'popularity' ? 'active' : ''}`}
                  onClick={() => {
                    handleSortChange('popularity');
                    setBottomSheetOpen(false);
                  }}
                >
                  Popularity
                </button>
                <button
                  className={`bottom-sort-option ${sortBy === 'distance' ? 'active' : ''}`}
                  onClick={() => {
                    handleSortChange('distance');
                    setBottomSheetOpen(false);
                  }}
                >
                  Distance
                </button>
                <button
                  className={`bottom-sort-option ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => {
                    handleSortChange('name');
                    setBottomSheetOpen(false);
                  }}
                >
                  Name A-Z
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSearch;