import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import PostCard from '../../components/post/PostCard';
import CommentSection from '../../components/post/CommentSection';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { postsService } from '../../services/posts';
import './PostDetail.css';

const PostDetail = () => {
  const { postId } = useParams();
  const { showToast } = useApp();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const postData = await postsService.getPost(postId);
      setPost(postData);
    } catch (error) {
      setError(error.message);
      showToast('Failed to load post', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to resolve media URLs
  const resolveMediaUrl = (url) => {
    if (!url) return null;

    if (url.startsWith('http')) {
      return url;
    }

    if (url.startsWith('/media/')) {
      return `${window.location.origin}${url}`;
    }

    return `${window.location.origin}/media/${url}`;
  };

  // Function to render business logo
  const renderBusinessLogo = () => {
    const businessLogo = post?.business_logo || post?.business?.logo_url;
    const businessName = post?.business_name || post?.business?.name || 'Business';
    const businessInitial = businessName ? businessName.charAt(0).toUpperCase() : 'B';

    if (businessLogo) {
      return (
        <img
          src={resolveMediaUrl(businessLogo)}
          alt={`${businessName} logo`}
          className="post-detail__business-logo"
          onError={(e) => {
            console.error('Business logo failed to load:', businessLogo);
            e.target.style.display = 'none';
          }}
        />
      );
    }

    return (
      <div className="post-detail__business-logo-placeholder">
        {businessInitial}
      </div>
    );
  };

  const handlePostUpdate = () => {
    loadPost();
  };

  if (loading) {
    return (
      <div className="post-detail-loading">
        <LoadingSpinner size="large" />
        <p>Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-error">
        <div className="post-detail-error__icon">📝</div>
        <h2>Post Not Found</h2>
        <p>The post you're looking for doesn't exist or has been removed.</p>
        <div className="post-detail-error__actions">
          <Link to="/feed">
            <Button variant="primary">Back to Feed</Button>
          </Link>
          <Link to="/business/search">
            <Button variant="outline">Discover Businesses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const businessName = post.business_name || post.business?.name || 'Business';

  return (
    <div className="post-detail">
      <div className="app-container">
        <div className="post-detail__layout">
          {/* Main Content */}
          <div className="post-detail__main">
            <div className="post-detail__navigation">
              <Link to="/feed" className="post-detail__back-link">
                ← Back to Feed
              </Link>
            </div>

            <PostCard
              post={post}
              onUpdate={handlePostUpdate}
              showBusinessInfo={true}
            />

            <CommentSection postId={postId} />
          </div>

          {/* Sidebar */}
          <div className="post-detail__sidebar">
            {/* Business Info */}
            <div className="post-detail__business-card">
              <h3 className="post-detail__sidebar-title">About the Business</h3>
              <div className="post-detail__business-info">
                <div className="post-detail__business-header">
                  {renderBusinessLogo()}
                  <div className="post-detail__business-details">
                    <Link
                      to={`/business/${post.business_id}`}
                      className="post-detail__business-name"
                    >
                      {businessName}
                    </Link>
                    <p className="post-detail__business-description">
                      View their profile to see more posts and information
                    </p>
                  </div>
                </div>
                <div className="post-detail__business-actions">
                  <Link to={`/business/${post.business_id}`}>
                    <Button variant="outline" size="small">
                      Visit Profile
                    </Button>
                  </Link>
                  <Link to={`/business/${post.business_id}/posts`}>
                    <Button variant="outline" size="small">
                      View All Posts
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Post Stats */}
            <div className="post-detail__stats">
              <h3 className="post-detail__sidebar-title">Post Statistics</h3>
              <div className="post-detail__stats-grid">
                <div className="post-detail__stat">
                  <div className="post-detail__stat-value">
                    {post.likes_count || 0}
                  </div>
                  <div className="post-detail__stat-label">Likes</div>
                </div>
                <div className="post-detail__stat">
                  <div className="post-detail__stat-value">
                    {post.comments_count || 0}
                  </div>
                  <div className="post-detail__stat-label">Comments</div>
                </div>
                <div className="post-detail__stat">
                  <div className="post-detail__stat-value">
                    {post.views_count || 'N/A'}
                  </div>
                  <div className="post-detail__stat-label">Views</div>
                </div>
              </div>
            </div>

            {/* Related Actions */}
            {user?.user_type === 'business_owner' && user?.id === post.owner_id && (
              <div className="post-detail__actions">
                <h3 className="post-detail__sidebar-title">Manage Post</h3>
                <div className="post-detail__action-buttons">
                  <Link to={`/post/${postId}/analytics`}>
                    <Button variant="outline" size="small">
                      View Analytics
                    </Button>
                  </Link>
                  <Button variant="outline" size="small">
                    Edit Post
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;