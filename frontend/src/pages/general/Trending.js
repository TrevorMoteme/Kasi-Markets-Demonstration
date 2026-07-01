import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { postsService } from '../../services/posts';
import { eventsService } from '../../services/events';
import { analyticsService } from '../../services/analytics';
import CategoryFilter from '../../components/common/CategoryFilter';
import { formatRelativeTime, truncateText } from '../../utils/helpers';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Trending.css';

const Trending = () => {
  const { showToast } = useApp();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [trendingData, setTrendingData] = useState({
    hashtags: [],
    popularPosts: [],
    upcomingEvents: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadTrendingData();
    } else {
      setLoading(false);
      setError('Please log in to view trending content');
    }
  }, [selectedCategory]);

  const loadTrendingData = async () => {
    try {
      console.log(`🔍 Loading trending data for category: ${selectedCategory || 'All'}`);
      setLoading(true);
      setError(null);

      const trendingResponse = await analyticsService.getTrendingContent(selectedCategory);

      setTrendingData({
        popularPosts: trendingResponse.popular_posts || [],
        upcomingEvents: trendingResponse.upcoming_events || [],
        hashtags: trendingResponse.hashtags || []
      });

    } catch (error) {
      console.error('💥 Trending loading error:', error);
      setError('Failed to load trending content. Please try again.');
      showToast('Failed to load trending content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    console.log(`🎯 Trending category changed to: ${category || 'All categories'}`);
    setSelectedCategory(category);
  };

  const handleViewPost = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleViewEvent = (eventId) => {
    navigate(`/event/${eventId}`);
  };

  const handleViewBusiness = (businessId) => {
    navigate(`/business/${businessId}`);
  };

  const TrendingPosts = () => (
    <div className="trending-section">
      <div className="trending-section-header">
        <h3>
          {selectedCategory
            ? `Popular ${selectedCategory} Posts`
            : 'Popular Posts'
          }
        </h3>
        <Button
          variant="text"
          size="small"
          onClick={loadTrendingData}
          disabled={loading}
        >
          🔄 Refresh
        </Button>
      </div>

      {trendingData.popularPosts.length === 0 ? (
        <Card className="trending-empty">
          <div className="trending-empty-icon">📝</div>
          <h4>No posts found</h4>
          <p>
            {selectedCategory
              ? `No trending posts in ${selectedCategory} yet. Be the first to post!`
              : 'No trending posts available at the moment.'
            }
          </p>
        </Card>
      ) : (
        <div className="posts-grid">
          {trendingData.popularPosts.map((post, index) => (
            <Card key={post.id} className="trending-post">
              {index === 0 && (
                <div className="trending-post-badge">
                  <span>🔥</span> TOP TRENDING
                </div>
              )}

              <div className="post-header">
                <div className="post-business-info">
                  {post.business_logo && (
                    <img
                      src={post.business_logo}
                      alt={post.business_name}
                      className="post-business-logo"
                    />
                  )}
                  <span
                    className="post-business"
                    onClick={() => handleViewBusiness(post.business_id)}
                  >
                    {post.business_name}
                  </span>
                </div>
                <span className="post-time">{formatRelativeTime(post.created_at)}</span>
              </div>

              <h4 className="post-title">{post.title}</h4>

              {post.content && (
                <p className="post-content">
                  {truncateText(post.content, 150)}
                </p>
              )}

              {post.media_urls && post.media_urls.length > 0 && (
                <div className="post-media">
                  <div className="media-placeholder">
                    📷 {post.media_urls.length} media file(s)
                  </div>
                </div>
              )}

              <div className="post-stats">
                <span className="post-stat">
                  <span className="post-stat-icon">❤️</span>
                  <span className="post-stat-value">{post.likes_count}</span>
                </span>
                <span className="post-stat">
                  <span className="post-stat-icon">💬</span>
                  <span className="post-stat-value">{post.comments_count}</span>
                </span>
                {post.business_category && (
                  <span className="post-stat">
                    <span className="post-stat-icon">🏷️</span>
                    <span className="post-stat-value">{post.business_category}</span>
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="small"
                onClick={() => handleViewPost(post.id)}
                className="post-view-btn"
              >
                View Post
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const TrendingEvents = () => (
    <div className="trending-section">
      <div className="trending-section-header">
        <h3>
          {selectedCategory
            ? `Upcoming ${selectedCategory} Events`
            : 'Upcoming Events'
          }
        </h3>
      </div>

      {trendingData.upcomingEvents.length === 0 ? (
        <Card className="trending-empty">
          <div className="trending-empty-icon">📅</div>
          <h4>No events found</h4>
          <p>
            {selectedCategory
              ? `No upcoming events in ${selectedCategory}. Check back later!`
              : 'No upcoming events at the moment.'
            }
          </p>
        </Card>
      ) : (
        <div className="events-list">
          {trendingData.upcomingEvents.map((event, index) => (
            <Card key={event.id} className="trending-event">
              {index === 0 && (
                <div className="trending-event-badge">
                  <span>🎉</span> FEATURED EVENT
                </div>
              )}

              <div className="event-header">
                <span className={`event-type event-type--${event.event_type}`}>
                  {event.event_type.replace('_', ' ')}
                </span>
                <span className="event-attendees">
                  👥 {event.attendee_count} attending
                </span>
              </div>

              <h4 className="event-title">{event.title}</h4>

              {event.business_name && (
                <p
                  className="event-business"
                  onClick={() => handleViewBusiness(event.business_id)}
                >
                  by {event.business_name}
                </p>
              )}

              <p className="event-time">
                🗓️ {formatRelativeTime(event.start_time)}
              </p>

              {event.location && (
                <p className="event-location">📍 {event.location}</p>
              )}

              <Button
                variant="outline"
                size="small"
                onClick={() => handleViewEvent(event.id)}
                className="event-view-btn"
              >
                View Event Details
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const TrendingHashtags = () => (
    <div className="trending-section">
      <div className="trending-section-header">
        <h3>Trending Hashtags</h3>
      </div>

      <div className="hashtags-grid">
        {trendingData.hashtags.length === 0 ? (
          <Card className="no-hashtags">
            <div className="no-hashtags-icon">🏷️</div>
            <p>No trending hashtags at the moment.</p>
          </Card>
        ) : (
          trendingData.hashtags.map((hashtag, index) => (
            <Card key={hashtag.id} className="hashtag-card">
              {index < 3 && (
                <div className="hashtag-rank">
                  #{index + 1}
                </div>
              )}

              <div className="hashtag-content">
                <span className="hashtag">#{hashtag.name}</span>
                <span className="hashtag-usage">
                  🔥 {hashtag.usage_count || 0} uses
                </span>
              </div>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(`/feed?hashtag=${hashtag.name}`)}
              >
                Explore
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="trending-page">
        <div className="trending-auth-prompt">
          <div className="trending-auth-content">
            <h1>Trending Now</h1>
            <p>Discover what's popular in your area</p>
            <div className="trending-auth-actions">
              <Button
                variant="primary"
                onClick={() => navigate('/login')}
              >
                Log In to View
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="trending-page">
        <div className="trending-error">
          <div className="trending-error-icon">⚠️</div>
          <h3>Unable to Load Trending Content</h3>
          <div className="trending-error-message">{error}</div>
          <div className="trending-error-actions">
            <Button
              variant="primary"
              onClick={loadTrendingData}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="trending-page">
        <div className="trending-loading">
          <LoadingSpinner size="large" />
          <div>
            {selectedCategory
              ? `Loading trending ${selectedCategory} content...`
              : 'Loading trending content...'
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trending-page">
      <div className="trending-header">
        <div className="trending-header-content">
          <h1>
            {selectedCategory
              ? `Trending in ${selectedCategory}`
              : 'Trending Now'
            }
          </h1>
          <p>
            {selectedCategory
              ? `Discover what's popular in ${selectedCategory}`
              : 'Discover what\'s popular in your area'
            }
          </p>
        </div>

        {/* Category Filter */}
        <div className="trending-category-filter">
          <div className="trending-filter-header">
            <h3>
              <span className="trending-filter-icon">📁</span>
              Filter by Category
            </h3>
            {selectedCategory && (
              <Button
                variant="text"
                size="small"
                onClick={() => handleCategoryChange(null)}
              >
                Clear Filter
              </Button>
            )}
          </div>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            showCounts={true}
          />
        </div>
      </div>

      <div className="trending-tabs">
        <button
          className={`tab ${activeTab === 'posts' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <span className="tab-icon">📝</span>
          Popular Posts
          {trendingData.popularPosts.length > 0 && (
            <span className="tab-count">{trendingData.popularPosts.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <span className="tab-icon">🎉</span>
          Upcoming Events
          {trendingData.upcomingEvents.length > 0 && (
            <span className="tab-count">{trendingData.upcomingEvents.length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'hashtags' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('hashtags')}
        >
          <span className="tab-icon">🏷️</span>
          Trending Hashtags
          {trendingData.hashtags.length > 0 && (
            <span className="tab-count">{trendingData.hashtags.length}</span>
          )}
        </button>
      </div>

      <div className="trending-content">
        {activeTab === 'posts' && <TrendingPosts />}
        {activeTab === 'events' && <TrendingEvents />}
        {activeTab === 'hashtags' && <TrendingHashtags />}
      </div>

      <div className="trending-actions">
        <Button
          variant="primary"
          onClick={() => navigate('/feed')}
        >
          {selectedCategory
            ? `View More ${selectedCategory} Content`
            : 'Explore More Content'
          }
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/business/search')}
        >
          Discover Businesses
        </Button>
      </div>
    </div>
  );
};

export default Trending;
