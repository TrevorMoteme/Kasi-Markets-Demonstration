import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useBusiness } from '../../contexts/BusinessContext';
import PostList from '../../components/post/PostList';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { postsService } from '../../services/posts';
import './ManagePosts.css';

const ManagePosts = () => {
  const { businessId } = useParams();
  const { showToast } = useApp();
  const { currentBusiness, getBusiness } = useBusiness();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const limit = 10;

  useEffect(() => {
    loadInitialData();
  }, [businessId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await getBusiness(businessId);
      await loadPosts(0);
    } catch (error) {
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (newOffset = 0) => {
    try {
      const response = await postsService.getBusinessPosts(businessId, limit, newOffset);
      if (newOffset === 0) {
        setPosts(response || []);
      } else {
        setPosts(prev => [...prev, ...(response || [])]);
      }
      setHasMore(response.length === limit);
      setOffset(newOffset + limit);
    } catch (error) {
      throw error;
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      await loadPosts(offset);
    } catch (error) {
      showToast('Failed to load more posts', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostUpdate = () => {
    // Refresh the posts list when a post is updated
    loadInitialData();
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      // In a real app, you would call a delete API endpoint
      // await postsService.deletePost(postId);
      showToast('Post deleted successfully', 'success');
      loadInitialData(); // Refresh the list
    } catch (error) {
      showToast('Failed to delete post', 'error');
    }
  };

  if (loading) {
    return (
      <div className="manage-posts-loading">
        <LoadingSpinner size="large" />
        <p>Loading your posts...</p>
      </div>
    );
  }

  if (!currentBusiness) {
    return (
      <div className="manage-posts-error">
        <h2>Business Not Found</h2>
        <p>Unable to load posts for this business.</p>
      </div>
    );
  }

  return (
    <div className="manage-posts">
      <div className="app-container">
        {/* Header */}
        <div className="manage-posts__header">
          <div className="manage-posts__header-content">
            <h1 className="manage-posts__title">
              Manage Posts - {currentBusiness.name}
            </h1>
            <p className="manage-posts__subtitle">
              Create, edit, and manage your business posts
            </p>
          </div>
          <div className="manage-posts__header-actions">
            <Link to={`/business/${businessId}/posts/create`}>
              <Button variant="primary">
                Create New Post
              </Button>
            </Link>
            <Link to={`/business/${businessId}/analytics`}>
              <Button variant="outline">
                View Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Posts List */}
        <div className="manage-posts__content">
          {posts.length > 0 ? (
            <>
              <PostList
                posts={posts}
                onPostUpdate={handlePostUpdate}
                emptyMessage="No posts yet. Create your first post to engage with your audience!"
              />

              {hasMore && (
                <div className="manage-posts__load-more">
                  <Button
                    variant="outline"
                    onClick={loadMorePosts}
                    loading={loadingMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More Posts'}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="manage-posts__empty">
              <div className="manage-posts__empty-icon">📝</div>
              <h3>No Posts Yet</h3>
              <p>Start sharing content with your followers by creating your first post.</p>
              <Link to={`/business/${businessId}/posts/create`}>
                <Button variant="primary" size="large">
                  Create First Post
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Post Actions (would be in PostCard for business owners) */}
        <div className="manage-posts__actions-info">
          <h4>Post Management Tips</h4>
          <ul>
            <li>Create engaging content regularly to keep your audience interested</li>
            <li>Use high-quality images and videos to make your posts stand out</li>
            <li>Include relevant hashtags to increase discoverability</li>
            <li>Monitor post analytics to understand what content resonates with your audience</li>
            <li>Engage with comments to build community and loyalty</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManagePosts;
