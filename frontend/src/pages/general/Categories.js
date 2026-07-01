import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../contexts/AuthContext';
import { postsService } from '../../services/posts';
import { analyticsService } from '../../services/analytics';
import { BUSINESS_CATEGORIES } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CategoryFilter from '../../components/common/CategoryFilter';
import './Categories.css';

const Categories = () => {
  const { showToast } = useApp();
  const { searchBusinesses, searchResults, searchTotal, loading: businessLoading } = useBusiness();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryStats, setCategoryStats] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadCategoryData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadTrendingPosts();
    }
  }, [selectedCategory]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      const [stats, categories] = await Promise.all([
        analyticsService.getCategoryStats().catch(() => []),
        analyticsService.getCategories().catch(() => BUSINESS_CATEGORIES)
      ]);
      setCategoryStats(stats);
    } catch (error) {
      console.error('Error loading category data:', error);
      showToast('Failed to load category data', 'error');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const loadTrendingPosts = async () => {
    try {
      const trending = await analyticsService.getTrendingContent(selectedCategory);
      setTrendingPosts(trending.popular_posts || []);
    } catch (error) {
      console.error('Error loading trending posts:', error);
      setTrendingPosts([]);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    try {
      await searchBusinesses({
        category,
        limit: 12,
        offset: 0
      });
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      await searchBusinesses({
        query: searchQuery,
        limit: 20,
        offset: 0
      });
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleExploreFeed = (category) => {
    navigate(`/feed?category=${encodeURIComponent(category)}`);
  };

  const handleExploreTrending = (category) => {
    navigate(`/trending?category=${encodeURIComponent(category)}`);
  };

  const handleViewBusiness = (businessId) => {
    navigate(`/business/${businessId}`);
  };

  const handleViewPost = (postId) => {
    navigate(`/post/${postId}`);
  };

  const getCategoryStats = (category) => {
    const stats = categoryStats.find(stat => stat.category === category);
    return {
      business_count: stats?.business_count || 0,
      post_count: stats?.post_count || 0
    };
  };

  const renderCategoryCard = (category) => {
    const stats = getCategoryStats(category);
    const isActive = selectedCategory === category;

    return (
      <Card
        key={category}
        className={`category-card ${isActive ? 'category-card--active' : ''}`}
        onClick={() => handleCategorySelect(category)}
      >
        <div className="category-card__icon">
          <div className="category-icon-placeholder">{category.charAt(0).toUpperCase()}</div>
        </div>
        <h3 className="category-card__name">
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </h3>

        <div className="category-card__stats">
          <div className="category-stat">
            <span className="stat-label">Businesses:</span>
            <span className="stat-value">{stats.business_count}</span>
          </div>
          <div className="category-stat">
            <span className="stat-label">Posts:</span>
            <span className="stat-value">{stats.post_count}</span>
          </div>
        </div>

        <div className="category-card__actions">
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleExploreFeed(category);
            }}
          >
            Browse Feed
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleExploreTrending(category);
            }}
          >
            View Trending
          </Button>
        </div>
      </Card>
    );
  };

  const renderBusinessCard = (business) => (
    <Card key={business.id} className="business-card">
      <div className="business-card__header">
        <h3>{business.name}</h3>
        <span className="business-rating">
          {business.rating ? `⭐ ${business.rating}` : 'New'}
        </span>
      </div>

      <p className="business-category">{business.category}</p>
      <p className="business-address">{business.address}, {business.city}</p>

      {business.distance && (
        <p className="business-distance">{business.distance} km away</p>
      )}

      <div className="business-card__actions">
        <Button
          variant="outline"
          size="small"
          onClick={() => handleViewBusiness(business.id)}
        >
          View Details
        </Button>
      </div>
    </Card>
  );

  const renderTrendingPostCard = (post) => (
    <Card key={post.id} className="trending-post-card">
      <div className="trending-post-header">
        <div className="trending-post-logo-placeholder">
          {post.business_name?.charAt(0) || 'B'}
        </div>
        <div className="trending-post-info">
          <span
            className="trending-post-business"
            onClick={() => handleViewBusiness(post.business_id)}
          >
            {post.business_name}
          </span>
          <span className="trending-post-time">
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <h4 className="trending-post-title">{post.title}</h4>

      {post.content && (
        <p className="trending-post-content">
          {post.content.length > 100
            ? `${post.content.substring(0, 100)}...`
            : post.content}
        </p>
      )}

      <div className="trending-post-stats">
        <span className="trending-post-stat">
          <span className="stat-label">Likes:</span>
          <span className="stat-value">{post.likes_count}</span>
        </span>
        <span className="trending-post-stat">
          <span className="stat-label">Comments:</span>
          <span className="stat-value">{post.comments_count}</span>
        </span>
      </div>

      <Button
        variant="outline"
        size="small"
        onClick={() => handleViewPost(post.id)}
        className="trending-post-btn"
      >
        View Post
      </Button>
    </Card>
  );

  if (loading) {
    return (
      <div className="categories-page">
        <div className="categories-loading">
          <LoadingSpinner size="large" />
          <div>Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="categories-header">
        <h1>Business Categories</h1>
        <p>Discover local businesses by category or browse category-specific content</p>
      </div>

      <div className="categories-layout">
        {/* Left Sidebar - Quick Category Filter */}
        <div className="categories-sidebar">
          <div className="categories-filter-section">
            <h3>Quick Filter</h3>
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategorySelect}
              showCounts={true}
            />
          </div>

          {selectedCategory && (
            <div className="category-actions-section">
              <h3>Explore {selectedCategory}</h3>
              <div className="category-actions">
                <Button
                  variant="primary"
                  onClick={() => handleExploreFeed(selectedCategory)}
                  className="category-action-btn"
                >
                  Browse {selectedCategory} Feed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExploreTrending(selectedCategory)}
                  className="category-action-btn"
                >
                  View Trending in {selectedCategory}
                </Button>
                <Button
                  variant="text"
                  onClick={() => navigate('/business/search')}
                  className="category-action-btn"
                >
                  Search All Businesses
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="categories-main">
          {/* search Bar */}
          <form onSubmit={handleSearch} className="categories-search">
            <Input
              placeholder="Search for businesses or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="categories-search__input"
            />
            <Button type="submit" loading={businessLoading}>
              Search
            </Button>
          </form>

          {/* Category Grid */}
          <div className="categories-grid">
            <h2>Browse by Category</h2>
            <p>Click on a category to view businesses and browse content</p>

            <div className="categories-grid__items">
              {BUSINESS_CATEGORIES.map(renderCategoryCard)}
            </div>
          </div>

          {/* Selected Category Results */}
          {(searchResults.length > 0 || selectedCategory) && (
            <div className="category-results">
              <div className="category-results-header">
                <h2>
                  {selectedCategory
                    ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Businesses`
                    : `Search Results (${searchTotal})`
                  }
                </h2>
                {selectedCategory && (
                  <div className="category-results-actions">
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => handleExploreFeed(selectedCategory)}
                    >
                      View Feed →
                    </Button>
                  </div>
                )}
              </div>

              {searchResults.length === 0 ? (
                <Card className="no-results">
                  <div className="no-results-content">
                    <div className="no-results-placeholder">📊</div>
                    <h3>No businesses found</h3>
                    <p>Try a different category or search term</p>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/business/search')}
                    >
                      Browse All Businesses
                    </Button>
                  </div>
                </Card>
              ) : (
                <>
                  <div className="businesses-grid">
                    {searchResults.slice(0, 6).map(renderBusinessCard)}
                  </div>
                  {searchResults.length > 6 && (
                    <div className="view-all-section">
                      <Button
                        variant="text"
                        onClick={() => navigate('/business/search')}
                      >
                        View All {searchTotal} Businesses →
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Trending Posts for Selected Category */}
          {selectedCategory && trendingPosts.length > 0 && (
            <div className="category-trending">
              <div className="category-trending-header">
                <h2>Trending in {selectedCategory}</h2>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleExploreTrending(selectedCategory)}
                >
                  View All Trending →
                </Button>
              </div>

              <div className="trending-posts">
                {trendingPosts.slice(0, 3).map(renderTrendingPostCard)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
