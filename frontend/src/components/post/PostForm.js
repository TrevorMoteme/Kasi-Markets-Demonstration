// src/components/post/PostForm.js
import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import postsService from '../../services/posts';
import { POST_TYPES } from '../../utils/constants';
import { postValidation } from '../../utils/validation';
import { extractHashtags } from '../../utils/helpers';
import './PostForm.css';

// SVG Icons matching BusinessForm style
const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="2.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polygon points="10 8 16 12 10 16" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PostForm = ({
  businessId,
  onSuccess,
  onCancel,
  initialData = null,
  isModal = false,
  activeSection = null,
  onFormChange = null
}) => {
  const { showToast } = useApp();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    post_type: initialData?.post_type || 'post',
    media_urls: initialData?.media_urls || [],
    hashtags: initialData?.hashtags || []
  });

  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Auto-save effect for modal
  useEffect(() => {
    if (onFormChange && !loading && isModal) {
      const timeout = setTimeout(() => {
        onFormChange(formData);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [formData, onFormChange, loading, isModal]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    if (field === 'content') {
      const extractedHashtags = extractHashtags(value);
      if (extractedHashtags.length > 0) {
        setFormData(prev => ({
          ...prev,
          hashtags: [...new Set([...prev.hashtags, ...extractedHashtags])]
        }));
      }
    }
  };

  const handleMediaSelect = (files) => {
    setMediaFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setMediaPreviewUrls(previews);
  };

  const handleMediaRemove = (index) => {
    const newFiles = [...mediaFiles];
    const newPreviews = [...mediaPreviewUrls];
    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setMediaFiles(newFiles);
    setMediaPreviewUrls(newPreviews);

    if (newFiles.length === 0) {
      setFormData(prev => ({
        ...prev,
        media_urls: []
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(postValidation).forEach(field => {
      const validation = postValidation[field];
      const value = formData[field];

      if (validation.required && !value) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      } else if (value && validation.validate && !validation.validate(value)) {
        newErrors[field] = validation.message;
      }
    });

    if (mediaFiles && mediaFiles.length > 0) {
      const maxSize = 50 * 1024 * 1024;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/webm'];

      mediaFiles.forEach((file, index) => {
        if (file.size > maxSize) {
          newErrors[`media_${index}`] = `${file.name} is too large (max 50MB)`;
        } else if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
          newErrors[`media_${index}`] = `${file.name} has unsupported format`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors before submitting', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await postsService.createPost(businessId, formData, mediaFiles);
      console.log('✅ Post created successfully:', result);
      console.log('🔍 Business logo in response:', result?.business_logo);
      console.log('🔍 Business logo URL:', result?.business_logo_url);

      showToast('Post created successfully!', 'success');
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error('Create post failed:', error);
      showToast(error.message || 'Failed to create post', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeDescription = () => {
    switch (formData.post_type) {
      case 'offer':
        return 'Share special offers, discounts, or promotions';
      case 'event':
        return 'Announce upcoming events or gatherings';
      case 'announcement':
        return 'Make important business announcements';
      default:
        return 'Share general updates and content';
    }
  };

  // Render only active section for modal
  const renderBasicSection = () => (
    <div className="post-form__section">
      <div className="post-form__section-header">
        <h3>Post Type</h3>
        <p>Choose the type of post you want to create</p>
      </div>

      <div className="post-form__type-selector">
        {Object.entries(POST_TYPES).map(([key, value]) => (
          <button
            key={key}
            type="button"
            className={`post-form__type-btn ${formData.post_type === value ? 'active' : ''}`}
            onClick={() => handleChange('post_type', value)}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      <div className="post-form__type-description">{getPostTypeDescription()}</div>

      <div className="post-form__field">
        <label className="post-form__label">
          Title <span className="required">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className={`post-form__input ${errors.title ? 'error' : ''}`}
          placeholder="Enter a compelling title..."
          maxLength={200}
        />
        <div className="post-form__char-count">{formData.title.length}/200 characters</div>
        {errors.title && <div className="post-form__error">{errors.title}</div>}
      </div>

      <div className="post-form__field">
        <label className="post-form__label">
          Content <span className="required">*</span>
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          className={`post-form__textarea ${errors.content ? 'error' : ''}`}
          placeholder="Share your message with the community..."
          rows={6}
          maxLength={2000}
        />
        <div className="post-form__char-count">{formData.content.length}/2000 characters</div>
        {errors.content && <div className="post-form__error">{errors.content}</div>}
      </div>
    </div>
  );

  const renderMediaSection = () => (
    <div className="post-form__section">
      <div className="post-form__section-header">
        <h3>Media</h3>
        <p>Add images or videos to make your post more engaging</p>
      </div>

      <div className="post-form__media-upload">
        <input
          type="file"
          id="media-upload"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleMediaSelect(Array.from(e.target.files));
            }
          }}
        />
        <button
          type="button"
          className="post-form__upload-btn"
          onClick={() => document.getElementById('media-upload').click()}
        >
          <ImageIcon />
          <VideoIcon />
          <span>Upload Media</span>
        </button>
        <p className="post-form__upload-hint">
          Supported: JPG, PNG, GIF, WebP, MP4, MOV, WebM. Max 50MB per file
        </p>
      </div>

      {mediaPreviewUrls.length > 0 && (
        <div className="post-form__preview-grid">
          {mediaPreviewUrls.map((url, index) => (
            <div key={index} className="post-form__preview-item">
              {mediaFiles[index]?.type?.startsWith('video/') ? (
                <video src={url} className="post-form__preview-video" />
              ) : (
                <img src={url} alt={`Preview ${index + 1}`} className="post-form__preview-image" />
              )}
              <button
                type="button"
                className="post-form__preview-remove"
                onClick={() => handleMediaRemove(index)}
              >
                <CloseIcon />
              </button>
              {mediaFiles[index]?.type?.startsWith('video/') && (
                <div className="post-form__video-badge">Video</div>
              )}
            </div>
          ))}
        </div>
      )}

      {Object.keys(errors).filter(key => key.startsWith('media_')).map(key => (
        <div key={key} className="post-form__error">{errors[key]}</div>
      ))}
    </div>
  );

  const renderReviewSection = () => (
    <div className="post-form__section">
      <div className="post-form__section-header">
        <h3>Review & Publish</h3>
        <p>Review your post before publishing</p>
      </div>

      <div className="post-form__review-card">
        <div className="post-form__review-badge">{formData.post_type.toUpperCase()}</div>
        <h4 className="post-form__review-title">{formData.title || 'No title yet'}</h4>
        <p className="post-form__review-content">{formData.content || 'No content yet'}</p>

        {mediaPreviewUrls.length > 0 && (
          <div className="post-form__review-media">
            <div className="post-form__review-media-count">
              📷 {mediaPreviewUrls.length} media file(s) attached
            </div>
          </div>
        )}

        {formData.hashtags.length > 0 && (
          <div className="post-form__review-hashtags">
            {formData.hashtags.map((tag, idx) => (
              <span key={idx} className="post-form__hashtag">#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render based on activeSection (modal mode) or all sections
  const renderContent = () => {
    if (isModal && activeSection) {
      switch(activeSection) {
        case 'basic':
          return renderBasicSection();
        case 'media':
          return renderMediaSection();
        case 'review':
          return renderReviewSection();
        default:
          return renderBasicSection();
      }
    }

    // Full form for standalone page
    return (
      <>
        {renderBasicSection()}
        {renderMediaSection()}
        {renderReviewSection()}
      </>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="post-form">
      {renderContent()}

      {/* Hidden submit button for modal to trigger */}
      <button type="submit" id="post-form-submit" style={{ display: 'none' }} />

      {/* Form Actions - Only show in standalone mode */}
      {!isModal && (
        <div className="post-form__actions">
          {onCancel && (
            <button type="button" className="post-form__cancel-btn" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
          )}
          <button type="submit" className="post-form__submit-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      )}
    </form>
  );
};

export default PostForm;