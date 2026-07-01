import React from 'react';
import PostCard from './PostCard';
import LoadingSpinner from '../common/LoadingSpinner';
import './PostList.css';

const PostList = ({
  posts,
  allPosts, // NEW: Full array of posts for navigation
  loading = false,
  emptyMessage = "No posts found",
  onPostUpdate,
  className = '',
  variant = 'default'
}) => {
  if (loading) {
    return (
      <div className="post-list-loading">
        <LoadingSpinner size="large" />
        <p>Loading posts...</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="post-list-empty">
        <div className="post-list-empty-icon">📝</div>
        <h3 className="post-list-empty-title">No Posts Found</h3>
        <div className="post-list-empty-content">
          {typeof emptyMessage === 'string' ? (
            <p className="post-list-empty-message">{emptyMessage}</p>
          ) : (
            <div className="post-list-empty-custom">{emptyMessage}</div>
          )}
        </div>
      </div>
    );
  }

  // Use allPosts if provided, otherwise fall back to posts
  const navigationPosts = allPosts || posts;

  return (
    <div className={`post-list post-list--${variant} ${className}`}>
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          allPosts={navigationPosts}
          currentPostIndex={index}
          onUpdate={onPostUpdate}
          className={variant === 'compact' ? 'post-card--compact' : ''}
        />
      ))}
    </div>
  );
};

export default PostList;


