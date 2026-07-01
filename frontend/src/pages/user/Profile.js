import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Avatar from '../../components/common/Avatar';
import BottomNav from '../../components/navigation/BottomNav';
import { postsService } from '../../services/posts';
import { businessService } from '../../services/business';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useDevice } from '../../hooks/useMediaQuery';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { showToast } = useApp();
  const { isMobile } = useDevice();

  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [stats, setStats] = useState({ posts: 0, followers: 1245, following: 342 });
  const [userBusiness, setUserBusiness] = useState(null);
  const [followingStatus, setFollowingStatus] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user's saved posts (as their posts for demo)
      const savedPosts = await postsService.getSavedPosts();
      setUserPosts(savedPosts || []);
      setStats(prev => ({ ...prev, posts: savedPosts?.length || 0 }));

      // Load user's business if they own one
      if (user?.user_type === 'business_owner') {
        try {
          const businesses = await businessService.getMyBusinesses();
          if (businesses && businesses.length > 0) {
            setUserBusiness(businesses[0]);
          }
        } catch (error) {
          console.log('No business found');
        }
      }
    } catch (error) {
      showToast('Failed to load profile data', 'error');
      // Set mock data for demo
      setUserPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!userBusiness) return;
    try {
      if (followingStatus) {
        await businessService.unfollowBusiness(userBusiness.id);
        setFollowingStatus(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await businessService.followBusiness(userBusiness.id);
        setFollowingStatus(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const resolveMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return `${baseUrl}/${url}`;
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-top">
            <button className="profile-back-btn" onClick={() => window.history.back()}>
              ‹
            </button>
            <h1 className="profile-username">{user?.username || 'User'}</h1>
            <button className="profile-menu-btn">⋯</button>
          </div>

          {/* Profile Info Row */}
          <div className="profile-info-row">
            <Avatar
              src={user?.avatar}
              alt={user?.username}
              size="xlarge"
              hasStory={false}
            />

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="stat-value">{formatNumber(stats.posts)}</span>
                <span className="stat-label">posts</span>
              </div>
              <div className="profile-stat">
                <span className="stat-value">{formatNumber(stats.followers)}</span>
                <span className="stat-label">followers</span>
              </div>
              <div className="profile-stat">
                <span className="stat-value">{formatNumber(stats.following)}</span>
                <span className="stat-label">following</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="profile-bio">
            <div className="profile-full-name">{user?.full_name || user?.username}</div>
            <p className="profile-bio-text">{user?.bio || 'No bio yet'}</p>
            {user?.website && (
              <a href={user.website} className="profile-website" target="_blank" rel="noopener noreferrer">
                {user.website}
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            <button className="profile-edit-btn">Edit profile</button>
            <button className="profile-share-btn">Share profile</button>
            <button className="profile-add-btn">+</button>
          </div>

          {/* Business Info (if owner) */}
          {userBusiness && (
            <div className="profile-business-info">
              <div className="business-category">{userBusiness.category}</div>
              <div className="business-location">{userBusiness.city}, {userBusiness.state}</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            📷 POSTS
          </button>
          <button
            className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            🔖 SAVED
          </button>
          <button
            className={`profile-tab ${activeTab === 'tagged' ? 'active' : ''}`}
            onClick={() => setActiveTab('tagged')}
          >
            🏷️ TAGGED
          </button>
        </div>

        {/* Posts Grid */}
        <div className="profile-posts-grid">
          {activeTab === 'posts' && userPosts.map((post, index) => {
            const mediaUrl = post.media_urls?.[0] || post.media_url;
            const resolvedUrl = mediaUrl ? resolveMediaUrl(mediaUrl) : null;

            return (
              <div key={post.id || index} className="profile-grid-item" onClick={() => window.location.href = `/post/${post.id}`}>
                {resolvedUrl ? (
                  <img
                    src={resolvedUrl}
                    alt={post.title || 'Post'}
                    className="profile-grid-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="profile-grid-placeholder">📷</div>
                )}
                {post.media_urls?.length > 1 && (
                  <div className="grid-multi-indicator">📷</div>
                )}
              </div>
            );
          })}

          {activeTab === 'posts' && userPosts.length === 0 && (
            <div className="profile-empty-state">
              <div className="empty-icon">📷</div>
              <p>No posts yet</p>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="profile-empty-state">
              <div className="empty-icon">🔖</div>
              <p>Saved posts will appear here</p>
            </div>
          )}

          {activeTab === 'tagged' && (
            <div className="profile-empty-state">
              <div className="empty-icon">🏷️</div>
              <p>Photos of you will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNav onCreateClick={() => window.location.href = '/business/create'} />}

      {/* Logout button (hidden on mobile, shown in menu) */}
      {!isMobile && (
        <button className="profile-logout-btn" onClick={handleLogout}>
          Log Out
        </button>
      )}
    </div>
  );
};

export default Profile;