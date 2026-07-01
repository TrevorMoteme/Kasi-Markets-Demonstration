import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../contexts/BusinessContext';
import { useApp } from '../../contexts/AppContext';
import BusinessForm from '../../components/business/BusinessForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './CreateBusiness.css';

const CreateBusiness = () => {
  const { createBusiness, hasExistingBusiness, loading, loadMyBusinesses } = useBusiness();
  const { showToast } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user already has a business
    const checkBusiness = async () => {
      await loadMyBusinesses();
    };

    checkBusiness();
  }, [loadMyBusinesses]);

  // Redirect if user already has a business
  useEffect(() => {
    if (hasExistingBusiness && !loading) {
      showToast('You already have a business profile.', 'info');
      navigate('/business/dashboard');
    }
  }, [hasExistingBusiness, loading, navigate, showToast]);

  const handleSuccess = (business) => {
    showToast('Business created successfully!', 'success');
    // Redirect to the new business's settings page
    navigate(`/business/${business.id}/settings`);
  };

  const handleCancel = () => {
    navigate('/business/dashboard');
  };

  // Show loading while checking business status
  if (loading) {
    return (
      <div className="create-business-loading">
        <LoadingSpinner size="large" />
        <p>Checking your business status...</p>
      </div>
    );
  }

  // Don't render form if user has existing business (will redirect)
  if (hasExistingBusiness) {
    return (
      <div className="create-business-redirect">
        <LoadingSpinner size="large" />
        <p>Redirecting to your business dashboard...</p>
      </div>
    );
  }

  return (
    <div className="create-business">
      <div className="app-container">
        <div className="create-business__header">
          <div className="create-business__breadcrumb">
            <button
              onClick={() => navigate('/business/dashboard')}
              className="create-business__back-btn"
            >
              ← Back to Dashboard
            </button>
          </div>
          <h1 className="create-business__title">Create Business Profile</h1>
          <p className="create-business__subtitle">
            Set up your business profile to start connecting with customers and sharing content
          </p>
        </div>

        <div className="create-business__content">
          <BusinessForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            mode="create"
            showLocationCard={false}
            showDrawer={false}
            showBottomNav={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateBusiness;