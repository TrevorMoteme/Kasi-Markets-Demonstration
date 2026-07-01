import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useBusiness } from '../../contexts/BusinessContext';
import PostForm from '../../components/post/PostForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './CreatePost.css';

const CreatePost = () => {
  const { businessId } = useParams();
  const { showToast } = useApp();
  const { currentBusiness, getBusiness } = useBusiness();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusiness();
  }, [businessId]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      await getBusiness(businessId);
    } catch (error) {
      showToast('Failed to load business', 'error');
      navigate('/business/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    showToast('Post created successfully!', 'success');
    navigate(`/business/${businessId}/posts`);
  };

  const handleCancel = () => {
    navigate(`/business/${businessId}/posts`);
  };

  if (loading) {
    return (
      <div className="create-post-loading">
        <LoadingSpinner size="large" />
        <p>Loading business information...</p>
      </div>
    );
  }

  if (!currentBusiness) {
    return (
      <div className="create-post-error">
        <h2>Business Not Found</h2>
        <p>Unable to create post for this business.</p>
      </div>
    );
  }

  return (
    <div className="create-post">
      <div className="app-container">
        <div className="create-post__header">
          <div className="create-post__breadcrumb">
            <button
              onClick={() => navigate(`/business/${businessId}/posts`)}
              className="create-post__back-btn"
            >
              ← Back to Posts
            </button>
          </div>
          <h1 className="create-post__title">Create New Post</h1>
          <p className="create-post__subtitle">
            Share updates, offers, or events with your followers for {currentBusiness.name}
          </p>
        </div>

        <div className="create-post__content">
          <PostForm
            businessId={businessId}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default CreatePost;

