// BusinessDashboard.js - Auto-detects business and shows full BusinessProfile
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BusinessProfile from '../../components/business/BusinessProfile';
import './BusinessDashboard.css';

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadMyBusinesses, loading: businessLoading } = useBusiness();
  const { showToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        setLoading(true);
        console.log('🔍 BusinessDashboard: Loading business for dashboard...');

        // Load from API - this returns { business: {...}, analytics: {...} }
        const result = await loadMyBusinesses();
        console.log('📡 BusinessDashboard: API result:', result);

        // Extract the ID from the response format
        let id = null;

        if (result && result.business && result.business.id) {
          id = result.business.id;
          console.log('✅ BusinessDashboard: Found business ID:', id);
        } else if (result && result.id) {
          id = result.id;
          console.log('✅ BusinessDashboard: Found business ID (direct):', id);
        }

        if (id) {
          console.log('🎯 BusinessDashboard: Setting businessId to:', id);
          setBusinessId(id);
        } else {
          console.error('❌ BusinessDashboard: Could not find business ID');
          showToast('Could not find your business', 'error');
          navigate('/business/create');
        }
      } catch (error) {
        console.error('❌ BusinessDashboard: Error loading business:', error);
        showToast('Failed to load business data', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user?.user_type === 'business_owner') {
      loadBusiness();
    } else if (user) {
      showToast('Only business owners can access the dashboard', 'error');
      navigate('/');
    } else {
      setLoading(false);
      navigate('/login');
    }
  }, [user, loadMyBusinesses, navigate, showToast]);

  // Show loading state
  if (loading || businessLoading) {
    return (
      <div className="business-dashboard-loading">
        <LoadingSpinner size="large" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // No business found - redirect to create
  if (!businessId) {
    return (
      <div className="business-dashboard-no-business">
        <div className="no-business-card">
          <div className="no-business-icon">🏢</div>
          <h2>No Business Found</h2>
          <p>You haven't created a business profile yet. Create one to access your dashboard.</p>
          <div className="no-business-actions">
            <button className="btn-primary" onClick={() => navigate('/business/create')}>
              Create Business
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pass the business ID to BusinessProfile with owner view enabled
  // This will show the FULL BusinessProfile page (hero, posts, hours, etc.)
  console.log('🎯 BusinessDashboard: Rendering BusinessProfile with businessId:', businessId);
  return <BusinessProfile businessId={businessId} isOwnerView={true} />;
};

export default BusinessDashboard;