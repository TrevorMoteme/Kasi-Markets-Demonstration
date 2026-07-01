import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import BusinessProfile from '../../components/business/BusinessProfile';
import PostCard from '../../components/post/PostCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useBusiness } from '../../contexts/BusinessContext';
import { postsService } from '../../services/posts';
import { useApp } from '../../contexts/AppContext';
import './BusinessDetail.css';

const BusinessDetail = () => {
  const { businessId } = useParams();
  const { getBusiness, currentBusiness } = useBusiness();
  const { showToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [topPosts, setTopPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    loadBusinessData();
  }, [businessId]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      await getBusiness(businessId);
      await loadTopPosts();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTopPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      // Get business posts and sort by likes to get top 15
      const posts = await postsService.getBusinessPosts(businessId, 50, 0);

      // Sort by likes count and take top 15
      const sortedPosts = posts
        .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        .slice(0, 15);

      setTopPosts(sortedPosts);
    } catch (error) {
      console.error('Error loading top posts:', error);
      showToast('Failed to load business posts', 'error');
    } finally {
      setLoadingPosts(false);
    }
  }, [businessId, showToast]);

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  if (loading) {
    return (
      <div className="business-detail-loading">
        <LoadingSpinner size="large" />
        <p>Loading business profile...</p>
      </div>
    );
  }

  const businessData = currentBusiness?.business || currentBusiness;

  // Function to render grid item (can be moved to a separate component)
  const renderGridItem = (post) => {
    const hasMedia = post.media_urls && post.media_urls.length > 0;
    const firstMediaUrl = hasMedia ? post.media_urls[0] : null;

    const resolveMediaUrl = (url) => {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      if (url.startsWith('/media/')) return `${window.location.origin}${url}`;
      return `${window.location.origin}/media/${url}`;
    };

    const resolvedUrl = firstMediaUrl ? resolveMediaUrl(firstMediaUrl) : null;

    return (
      <div
        key={post.id}
        className="post-grid-item"
        onClick={() => handlePostClick(post)}
      >
        {hasMedia && resolvedUrl ? (
          <>
            <img
              src={resolvedUrl}
              alt={post.title}
              className="post-grid-image"
              loading="lazy"
              onError={(e) => {
                console.log('❌ Grid image failed to load:', firstMediaUrl);
                e.target.style.display = 'none';
              }}
            />
            <div className="post-grid-overlay">
              <div className="post-grid-stats">
                <span className="post-grid-stat">♥ {post.likes_count || 0}</span>
                <span className="post-grid-stat">💬 {post.comments_count || 0}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="post-grid-no-media">
            <div className="post-grid-text">
              {post.title}
            </div>
            <div className="post-grid-stats-no-media">
              <span className="post-grid-stat">♥ {post.likes_count || 0}</span>
              <span className="post-grid-stat">💬 {post.comments_count || 0}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="business-detail">
      {/* Business Profile Card */}
      <BusinessProfile mode="full" />

      {/* Top Posts Gallery Section */}
      <div className="business-posts-gallery">
        <div className="gallery-header">
          <h2 className="gallery-title">Top Posts</h2>
          <p className="gallery-subtitle">Most liked posts from this business</p>
        </div>

        {loadingPosts ? (
          <div className="gallery-loading">
            <LoadingSpinner />
            <p>Loading posts...</p>
          </div>
        ) : topPosts.length === 0 ? (
          <div className="gallery-empty">
            <div className="gallery-empty-icon">📷</div>
            <h3>No posts yet</h3>
            <p>This business hasn't posted any content yet.</p>
          </div>
        ) : (
          <>
            {/* Instagram-style Grid Gallery */}
            <div className="posts-grid">
              {topPosts.map((post) => renderGridItem(post))}
            </div>

            {/* Post Detail Modal */}
            {selectedPost && (
              <div className="post-modal-overlay" onClick={handleCloseModal}>
                <div className="post-modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="post-modal-close" onClick={handleCloseModal}>
                    ✕
                  </button>
                  <PostCard
                    post={selectedPost}
                    showBusinessInfo={true}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessDetail;
