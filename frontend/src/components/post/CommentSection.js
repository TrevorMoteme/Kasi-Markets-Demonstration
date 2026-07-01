// CommentSection.js - Updated with proper comment posting, enter key handling, and dark theme
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import { postsService } from '../../services/posts';
import { formatRelativeTime } from '../../utils/helpers';
import './CommentSection.css';

const CommentSection = ({ postId, postBusinessId, onClose, onCommentCountChange, isModal = false }) => {
  const { user } = useAuth();
  const { showToast } = useApp();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef(null);

  // Check mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 767);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const commentsData = await postsService.getPostComments(postId);
      setComments(commentsData);
      if (onCommentCountChange) {
        onCommentCountChange(commentsData.length);
      }
    } catch (error) {
      showToast('Failed to load comments', 'error');
    } finally {
      setCommentsLoading(false);
    }
  };

  // Handle Enter key for new line (Shift+Enter for new line, Enter to submit)
  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newComment.trim() && !loading) {
        handleSubmitComment(e);
      }
    }
  };

  const handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (replyText.trim() && !loading) {
        handleSubmitReply(e);
      }
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast('Please login to comment', 'error');
      return;
    }

    if (!newComment.trim()) {
      showToast('Please enter a comment', 'error');
      return;
    }

    setLoading(true);

    try {
      const comment = await postsService.addComment(postId, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      showToast('Comment added successfully', 'success');
      if (onCommentCountChange) {
        onCommentCountChange(comments.length + 1);
      }
    } catch (error) {
      showToast(error.message || 'Failed to add comment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReply = (comment) => {
    setReplyingTo(comment);
    setReplyText('');
    // Focus the reply input after render
    setTimeout(() => {
      const replyInput = document.querySelector('.comment-reply-form textarea, .comment-reply-form input');
      if (replyInput) replyInput.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast('Please login to reply', 'error');
      return;
    }

    if (!replyText.trim()) {
      showToast('Please enter a reply', 'error');
      return;
    }

    setLoading(true);

    try {
      const reply = await postsService.addComment(
        postId,
        `@${getCommenterName(replyingTo)} ${replyText.trim()}`
      );

      setComments(prev => [reply, ...prev]);
      setReplyingTo(null);
      setReplyText('');
      showToast('Reply added successfully', 'success');
      if (onCommentCountChange) {
        onCommentCountChange(comments.length + 1);
      }
    } catch (error) {
      showToast(error.message || 'Failed to add reply', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get commenter name with fallbacks
  const getCommenterName = (comment) => {
    return comment.username ||
           comment.user_name ||
           comment.user?.username ||
           comment.user?.name ||
           'Anonymous';
  };

  // Helper function to get commenter user ID
  const getCommenterId = (comment) => {
    return comment.user_id || comment.user?.id;
  };

  // Helper function to get commenter user type
  const getCommenterType = (comment) => {
    return comment.user_type || comment.user?.user_type;
  };

  // Check if user can reply to a specific comment
  const canReplyToComment = (comment) => {
    if (!user) return false;

    // Business users can reply to any comment
    if (user.user_type === 'business_owner') {
      return true;
    }

    // Original commenters can reply to their own comments
    if (user.id === getCommenterId(comment)) {
      return true;
    }

    return false;
  };

  // Check if current user is the comment owner
  const isCommentOwner = (comment) => {
    return user?.id === getCommenterId(comment);
  };

  if (commentsLoading) {
    return (
      <div className="comment-section-loading">
        <LoadingSpinner size="medium" />
        <p>Loading comments...</p>
      </div>
    );
  }

  // Mobile version uses simpler input
  if (isMobile && isModal) {
    return (
      <div className="comment-section comment-section--mobile">
        {/* Mobile Comment Input */}
        <div className="comment-section__input-wrapper">
          <div className="comment-section__input-container">
            <div className="comment-section__avatar-small">
              {user ? (user.name?.charAt(0).toUpperCase() || 'U') : '?'}
            </div>
            <textarea
              className="comment-section__input-simple"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              placeholder="Add a comment..."
              disabled={loading}
              rows={1}
              style={{ resize: 'none' }}
            />
            <button
              className="comment-section__submit-simple"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || loading}
            >
              Post
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="comments-empty">
              <div className="comments-empty-icon">💬</div>
              <p className="comments-empty-text">No comments yet</p>
              <p className="comments-empty-subtext">
                {user ? 'Be the first to share your thoughts!' : 'Login to leave a comment'}
              </p>
            </div>
          ) : (
            comments.map((comment) => {
              const commenterName = getCommenterName(comment);
              const commenterId = getCommenterId(comment);
              const commenterType = getCommenterType(comment);
              const isOwner = isCommentOwner(comment);

              return (
                <div key={comment.id} className="comment">
                  <div className="comment__header">
                    <div className="comment__user">
                      <div className="comment__user-avatar">
                        {commenterName.charAt(0).toUpperCase()}
                      </div>
                      <div className="comment__user-info">
                        <div className="comment__username">
                          {commenterName}
                          {isOwner && <span className="comment__owner-badge">You</span>}
                          {commenterType === 'business_owner' && !isOwner && (
                            <span className="comment__business-badge-small">Business</span>
                          )}
                        </div>
                        <div className="comment__time">
                          {formatRelativeTime(comment.created_at)}
                        </div>
                      </div>
                    </div>
                    {canReplyToComment(comment) && (
                      <button
                        type="button"
                        className="comment__reply-btn"
                        onClick={() => handleStartReply(comment)}
                        disabled={!!replyingTo}
                      >
                        Reply
                      </button>
                    )}
                  </div>
                  <div className="comment__content">{comment.content}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Form */}
        {replyingTo && (
          <div className="comment-reply-form">
            <div className="comment-reply-form__header">
              <span>
                <span className="reply-to-label">Replying to </span>
                <span className="reply-to-name">@{getCommenterName(replyingTo)}</span>
              </span>
              <button
                type="button"
                className="comment-reply-form__cancel"
                onClick={handleCancelReply}
              >
                ✕
              </button>
            </div>
            <div className="comment-section__input-container" style={{ marginTop: '8px' }}>
              <textarea
                className="comment-section__input-simple"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                placeholder="Write your reply..."
                disabled={loading}
                rows={1}
                style={{ resize: 'none' }}
                autoFocus
              />
              <button
                className="comment-section__submit-simple"
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || loading}
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="comment-section">
      <div className="comment-section__header">
        <h3 className="comment-section__title">
          Comments <span className="comment-section__count">{comments.length}</span>
        </h3>
        {!isModal && onClose && (
          <button className="comment-section__close-btn" onClick={onClose} aria-label="Close comments">
            ✕
          </button>
        )}
      </div>

      {/* Add Comment Form - Desktop */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div className="comment-form__input">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              placeholder="Add a comment..."
              disabled={loading}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
          <div className="comment-form__actions">
            <Button
              type="submit"
              variant="primary"
              size="small"
              loading={loading}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <p>Please <Link to="/login">login</Link> to leave a comment</p>
        </div>
      )}

      {/* Reply Form - Desktop */}
      {replyingTo && (
        <div className="comment-reply-form">
          <div className="comment-reply-form__header">
            <span>
              <span className="reply-to-label">Replying to</span>
              <span className="reply-to-name">@{getCommenterName(replyingTo)}</span>
            </span>
            <button
              type="button"
              className="comment-reply-form__cancel"
              onClick={handleCancelReply}
              aria-label="Cancel reply"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmitReply} className="comment-form">
            <div className="comment-form__input">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                placeholder="Write your reply..."
                disabled={loading}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                autoFocus
              />
            </div>
            <div className="comment-form__actions">
              <Button
                type="button"
                variant="outline"
                size="small"
                onClick={handleCancelReply}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="small"
                loading={loading}
                disabled={!replyText.trim()}
              >
                Post Reply
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="comments-empty">
            <div className="comments-empty-icon">💬</div>
            <p className="comments-empty-text">No comments yet</p>
            <p className="comments-empty-subtext">
              {user ? 'Be the first to share your thoughts!' : 'Login to leave a comment'}
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const commenterName = getCommenterName(comment);
            const commenterId = getCommenterId(comment);
            const commenterType = getCommenterType(comment);
            const isOwner = isCommentOwner(comment);

            return (
              <div key={comment.id} className="comment">
                <div className="comment__header">
                  <div className="comment__user">
                    <div
                      className="comment__user-avatar"
                      style={{
                        background: isOwner
                          ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                          : 'linear-gradient(135deg, #6b7280, #9ca3af)'
                      }}
                    >
                      {commenterName.charAt(0).toUpperCase()}
                    </div>
                    <div className="comment__user-info">
                      <div className="comment__username">
                        {commenterName}
                        {isOwner && (
                          <span className="comment__owner-badge">You</span>
                        )}
                        {commenterType === 'business_owner' && !isOwner && (
                          <span className="comment__business-badge-small">Business</span>
                        )}
                      </div>
                      <div className="comment__time">
                        {formatRelativeTime(comment.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Reply Button - Only show for authorized users */}
                  {canReplyToComment(comment) && (
                    <button
                      type="button"
                      className="comment__reply-btn"
                      onClick={() => handleStartReply(comment)}
                      disabled={!!replyingTo}
                    >
                      Reply
                    </button>
                  )}
                </div>

                <div className="comment__content">
                  {comment.content}
                </div>

                {/* Show business owner badge for business comments */}
                {commenterType === 'business_owner' && !isOwner && (
                  <div className="comment__business-badge">
                    Business Account
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentSection;