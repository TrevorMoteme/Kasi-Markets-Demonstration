// BusinessProfile.js - FINAL VERSION with cache invalidation for real-time updates
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import BusinessFormModal from '../common/BusinessFormModal';
import PostFormModal from '../post/PostFormModal';
import PostModal from '../post/PostModal';
import { formatPhoneNumber, safeGet, formatRelativeTime, formatNumber } from '../../utils/helpers';
import { useDevice } from '../../hooks/useMediaQuery';
import { getOperatingHoursManager } from '../../utils/operatingHoursManager';
import postsService from '../../services/posts';
import './BusinessProfile.css';

const BusinessProfile = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { getBusiness, followBusiness, unfollowBusiness } = useBusiness();
  const { showToast } = useApp();
  const { isMobile } = useDevice();
  const queryClient = useQueryClient();

  // State
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading business profile...');
  const [postsLoading, setPostsLoading] = useState(false);
  const [businessData, setBusinessData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [loadingTopPosts, setLoadingTopPosts] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [postsPerPage] = useState(12);
  const activeTabFromUrl = searchParams.get('tab') || 'posts';
  const [activeTab, setActiveTab] = useState(activeTabFromUrl);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [showPostViewModal, setShowPostViewModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFollowers: 0,
    totalReviews: 0
  });
  const [dataLoadError, setDataLoadError] = useState(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [heroScrolled, setHeroScrolled] = useState(false);
  const [businessCoordinates, setBusinessCoordinates] = useState(null);
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);

  // NO loading state for follow button - just instant updates!

  // Operating Hours State
  const [operatingHours, setOperatingHours] = useState(null);
  const [specialHours, setSpecialHours] = useState(null);
  const [isCurrentlyOpen, setIsCurrentlyOpen] = useState(false);
  const [todayHours, setTodayHours] = useState(null);

  // Manager refs
  const managerRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const stopUpdatesRef = useRef(null);

  // Refs
  const loadMoreRef = useRef(null);
  const fileInputRef = useRef(null);
  const heroRef = useRef(null);
  const tabsRef = useRef(null);

  // Loading messages for cinematic effect
  const loadingMessages = [
    'Pouring the perfect espresso...',
    'Finding the best tables...',
    'Warming up the oven...',
    'Curating amazing content...',
    'Making it special for you...'
  ];

  // Helper function to format WhatsApp number
  const formatWhatsAppNumber = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '27' + cleaned.substring(1);
    }
    return cleaned;
  };

  // ===== DIRECT FOLLOW HANDLERS WITH INSTANT UI UPDATE (NO LOADING SPINNER) =====
  const handleFollow = async () => {
    if (!user) {
      showToast('Please login to follow businesses', 'error');
      navigate('/login');
      return;
    }

    // INSTANT UI UPDATE - Update BOTH fields optimistically (NO LOADING STATE)
    setBusinessData(prev => ({
      ...prev,
      is_following: true,
      followers_count: (prev?.followers_count || 0) + 1
    }));

    // Also update React Query cache for consistency
    queryClient.setQueryData(['business', businessId], (old) => ({
      ...old,
      is_following: true,
      followers_count: (old?.followers_count || 0) + 1
    }));

    // API call in background - don't await, let it happen asynchronously
    followBusiness(businessId)
      .then(result => {
        console.log('Follow API result:', result);
        if (result && result.is_following !== undefined && result.is_following !== true) {
          setBusinessData(prev => ({
            ...prev,
            is_following: result.is_following,
            followers_count: result.followers_count || (prev?.followers_count || 0)
          }));
          queryClient.setQueryData(['business', businessId], (old) => ({
            ...old,
            is_following: result.is_following,
            followers_count: result.followers_count || (old?.followers_count || 0)
          }));
        }
        if (result?.message !== 'Already following this business') {
          showToast(`Now following ${businessData?.name}`, 'success');
        }
      })
      .catch(error => {
        console.error('Follow error:', error);
        setBusinessData(prev => ({
          ...prev,
          is_following: false,
          followers_count: Math.max(0, (prev?.followers_count || 1) - 1)
        }));
        queryClient.setQueryData(['business', businessId], (old) => ({
          ...old,
          is_following: false,
          followers_count: Math.max(0, (old?.followers_count || 1) - 1)
        }));
        showToast(error.message || 'Failed to follow', 'error');
      });
  };

  const handleUnfollow = async () => {
    if (!user) {
      showToast('Please login to follow businesses', 'error');
      navigate('/login');
      return;
    }

    // INSTANT UI UPDATE - Update BOTH fields optimistically (NO LOADING STATE)
    setBusinessData(prev => ({
      ...prev,
      is_following: false,
      followers_count: Math.max(0, (prev?.followers_count || 0) - 1)
    }));

    // Also update React Query cache for consistency
    queryClient.setQueryData(['business', businessId], (old) => ({
      ...old,
      is_following: false,
      followers_count: Math.max(0, (old?.followers_count || 0) - 1)
    }));

    // API call in background - don't await, let it happen asynchronously
    unfollowBusiness(businessId)
      .then(result => {
        console.log('Unfollow API result:', result);
        if (result && result.is_following !== undefined && result.is_following !== false) {
          setBusinessData(prev => ({
            ...prev,
            is_following: result.is_following,
            followers_count: result.followers_count || (prev?.followers_count || 0)
          }));
          queryClient.setQueryData(['business', businessId], (old) => ({
            ...old,
            is_following: result.is_following,
            followers_count: result.followers_count || (old?.followers_count || 0)
          }));
        }
        showToast(`Unfollowed ${businessData?.name}`, 'info');
      })
      .catch(error => {
        console.error('Unfollow error:', error);
        setBusinessData(prev => ({
          ...prev,
          is_following: true,
          followers_count: (prev?.followers_count || 0) + 1
        }));
        queryClient.setQueryData(['business', businessId], (old) => ({
          ...old,
          is_following: true,
          followers_count: (old?.followers_count || 0) + 1
        }));
        showToast(error.message || 'Failed to unfollow', 'error');
      });
  };

  // ===== SVG ICONS =====
  const WhatsAppIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm5.36 14.29c-.26.73-1.52 1.34-2.09 1.4-.53.06-.96.09-1.54-.17-.9-.4-1.78-1.06-2.58-1.66-1.27-1.03-2.39-2.24-3.16-3.63-.42-.75-.72-1.54-.87-2.37-.09-.5.06-1.01.4-1.38.26-.29.6-.45.98-.45h.48c.19 0 .45.06.66.53.28.64.78 1.49.85 1.6.11.18.13.38.04.58-.11.26-.27.46-.44.66-.13.15-.27.31-.39.46-.14.17-.28.35-.12.66.5.99 1.25 1.86 2.1 2.51.29.22.6.41.92.57.2.1.41.19.62.27.21.08.39.07.53-.05.2-.17.48-.56.61-.76.15-.26.31-.26.59-.16.42.16 1.34.63 1.57.74.23.11.38.17.44.26.07.12.07.38-.19 1.11z"/>
    </svg>
  );

  const PhoneIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );

  const StarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  );

  const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </svg>
  );

  const HeartIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  );

  const CommentIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );

  const UsersIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm8 6h-8v-2c0-2.21 1.79-4 4-4 2.21 0 4 1.79 4 4v2zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm8 6H0v-2c0-2.21 1.79-4 4-4 2.21 0 4 1.79 4 4v2z"/>
    </svg>
  );

  const TrendingIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
    </svg>
  );

  const EnvelopeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );

  const GlobeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  );

  const ImageIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
    </svg>
  );

  const VideoIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  );

  const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );

  const CalendarIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM7 11h5v5H7v-5z"/>
    </svg>
  );

  const TagsIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
    </svg>
  );

  // ===== MEDIA URL RESOLVER =====
  const resolveMediaUrl = useCallback((url) => {
    if (!url) return null;
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    if (url.startsWith('http')) {
      if (url.includes('localhost:3000')) {
        const filename = url.split('/media/')[1];
        return `${backendUrl}/media/${filename}`;
      }
      return url;
    }
    if (url.startsWith('/media/')) return `${backendUrl}${url}`;
    if (!url.includes('/')) return `${backendUrl}/media/${url}`;
    return `${backendUrl}/media/${url}`;
  }, []);

  // ===== FORMAT TIME FOR DISPLAY =====
  const formatDisplayTime = useCallback((time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, []);

  // ===== FORMAT OPERATING HOURS FOR DISPLAY =====
  const formattedHoursForLeftSidebar = useCallback(() => {
    if (!operatingHours) return null;

    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekdayHours = weekdays.map(d => operatingHours[d]);
    const allWeekdaysSame = weekdayHours.every(h =>
      h?.enabled === weekdayHours[0]?.enabled &&
      h?.open === weekdayHours[0]?.open &&
      h?.close === weekdayHours[0]?.close
    );

    if (allWeekdaysSame && weekdayHours[0]) {
      const weekdayData = weekdayHours[0];
      return (
        <>
          <div className="business-profile-full__hours-row">
            <span className="business-profile-full__hours-day">Monday - Friday</span>
            {weekdayData.enabled ? (
              <span>{formatDisplayTime(weekdayData.open)} - {formatDisplayTime(weekdayData.close)}</span>
            ) : (
              <span className="status-closed">Closed</span>
            )}
          </div>
          <div className="business-profile-full__hours-row">
            <span className="business-profile-full__hours-day">Saturday</span>
            {operatingHours?.saturday?.enabled ? (
              <span>{formatDisplayTime(operatingHours.saturday.open)} - {formatDisplayTime(operatingHours.saturday.close)}</span>
            ) : (
              <span className="status-closed">Closed</span>
            )}
          </div>
          <div className="business-profile-full__hours-row">
            <span className="business-profile-full__hours-day">Sunday</span>
            {operatingHours?.sunday?.enabled ? (
              <span>{formatDisplayTime(operatingHours.sunday.open)} - {formatDisplayTime(operatingHours.sunday.close)}</span>
            ) : (
              <span className="status-closed">Closed</span>
            )}
          </div>
        </>
      );
    }

    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' }
    ];

    return days.map(day => {
      const hourData = operatingHours[day.key];
      return (
        <div key={day.key} className="business-profile-full__hours-row">
          <span className="business-profile-full__hours-day">{day.label}</span>
          {hourData?.enabled ? (
            <span>{formatDisplayTime(hourData.open)} - {formatDisplayTime(hourData.close)}</span>
          ) : (
            <span className="status-closed">Closed</span>
          )}
        </div>
      );
    });
  }, [operatingHours, formatDisplayTime]);

  // ===== OPERATING HOURS MANAGER INTEGRATION =====
  useEffect(() => {
    if (businessData?.id) {
      const manager = getOperatingHoursManager(businessData.id);
      managerRef.current = manager;

      const savedHours = manager.getOperatingHours();
      const savedSpecialHours = manager.getSpecialHours();

      if (savedHours) {
        setOperatingHours(savedHours);
      }

      if (savedSpecialHours && savedSpecialHours.length > 0) {
        setSpecialHours(savedSpecialHours);
      }

      unsubscribeRef.current = manager.subscribe(({ type, data }) => {
        if (type === 'operatingHours') {
          setOperatingHours(data);
        } else if (type === 'specialHours') {
          setSpecialHours(data);
        }
      });

      stopUpdatesRef.current = manager.startRealTimeUpdates((status) => {
        setIsCurrentlyOpen(status.isOpen);
        if (status.todayHours) {
          setTodayHours(status.todayHours);
        }
      });

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        if (stopUpdatesRef.current) {
          stopUpdatesRef.current();
        }
      };
    }
  }, [businessData?.id]);

  // Listen for operating hours update events
  useEffect(() => {
    const handleOperatingHoursUpdate = (event) => {
      if (event.detail && event.detail.businessId === businessId) {
        if (event.detail.operatingHours && managerRef.current) {
          managerRef.current.saveOperatingHours(event.detail.operatingHours);
        }
        if (event.detail.specialHours && managerRef.current) {
          managerRef.current.saveSpecialHours(event.detail.specialHours);
        }
      }
    };

    window.addEventListener('operating-hours-updated', handleOperatingHoursUpdate);
    return () => {
      window.removeEventListener('operating-hours-updated', handleOperatingHoursUpdate);
    };
  }, [businessId]);

  // ===== HELPER FUNCTIONS =====
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    if (tabsRef.current && !isMobile) {
      tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openGoogleMaps = () => {
    let mapsUrl = '';

    if (businessData?.latitude && businessData?.longitude) {
      mapsUrl = `https://maps.google.com/?q=${businessData.latitude},${businessData.longitude}`;
    }
    else if (businessCoordinates && businessCoordinates.lat && businessCoordinates.lng) {
      mapsUrl = `https://maps.google.com/?q=${businessCoordinates.lat},${businessCoordinates.lng}`;
    }
    else if (businessAddress || businessCity || businessState) {
      const queryParts = [];
      if (businessAddress) queryParts.push(businessAddress);
      if (businessCity) queryParts.push(businessCity);
      if (businessState) queryParts.push(businessState);
      const query = encodeURIComponent(queryParts.join(', '));
      mapsUrl = `https://maps.google.com/?q=${query}`;
    }
    else if (businessName) {
      mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(businessName)}`;
    }
    else {
      showToast('Location not available', 'error');
      return;
    }

    window.open(mapsUrl, '_blank');
  };

  // ===== VIDEO URL DETECTION =====
  const isVideoUrl = useCallback((url) => {
    if (!url) return false;
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'mpeg', 'mpg', 'ogg', 'ogv'];
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
    return videoExtensions.includes(extension);
  }, []);

  const isVideoPost = (post) => {
    if (post.hasVideo) return true;
    if (post.post_type === 'video') return true;
    if (post.media_urls && post.media_urls.some(url => isVideoUrl(url))) return true;
    if (post.mediaUrls && post.mediaUrls.some(url => isVideoUrl(url))) return true;
    return false;
  };

  const getMediaUrl = (post) => {
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      return post.mediaUrls[0];
    }
    if (post.media_urls && post.media_urls.length > 0) {
      return resolveMediaUrl(post.media_urls[0]);
    }
    if (post.firstMediaUrl) {
      return post.firstMediaUrl;
    }
    if (post.business_logo) {
      return post.business_logo;
    }
    return null;
  };

  // ===== PARALLAX AND SCROLL EFFECTS =====
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        setParallaxOffset(scrolled * 0.3);
        setHeroScrolled(scrolled > 100);
        setShowBackToTop(scrolled > 500);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    if (isMobile) return;

    const handleKeyboardShortcuts = (e) => {
      if (e.key === 'Escape' && showPostViewModal) {
        handleClosePostModal();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [isMobile, showPostViewModal]);

  // Extract coordinates from business data
  useEffect(() => {
    if (businessData) {
      const lat = businessData.latitude || businessData.lat || businessData.location?.lat;
      const lng = businessData.longitude || businessData.lng || businessData.location?.lng;

      if (lat && lng) {
        setBusinessCoordinates({ lat: parseFloat(lat), lng: parseFloat(lng) });
      }
    }
  }, [businessData]);

  // Check for returning visitor
  useEffect(() => {
    const lastVisit = sessionStorage.getItem(`business_${businessId}_last_visit`);
    const now = Date.now();
    if (lastVisit && (now - parseInt(lastVisit)) < 86400000) {
      setIsReturningVisitor(true);
    }
    sessionStorage.setItem(`business_${businessId}_last_visit`, now.toString());

    const savedScroll = sessionStorage.getItem(`business_${businessId}_scroll`);
    if (savedScroll && parseInt(savedScroll) > 0) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100);
    }
  }, [businessId]);

  // Save scroll position on leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(`business_${businessId}_scroll`, window.scrollY.toString());
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [businessId]);

  // Rotate loading messages
  useEffect(() => {
    if (loading) {
      let messageIndex = 0;
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // ===== LOAD DATA =====
  useEffect(() => {
    if (businessId) {
      loadBusiness();
      loadBusinessPosts();
    } else {
      setDataLoadError('No business ID provided');
      setLoading(false);
    }
  }, [businessId]);

  // ===== LOAD TOP POSTS =====
  const loadTopPosts = useCallback(async () => {
    if (!businessId) return;
    try {
      setLoadingTopPosts(true);
      const postsData = await postsService.getBusinessPosts(businessId, 50, 0);
      let postsArray = [];
      if (Array.isArray(postsData)) postsArray = postsData;
      else if (postsData && Array.isArray(postsData.posts)) postsArray = postsData.posts;
      else if (postsData && postsData.data) postsArray = postsData.data;

      const sorted = [...postsArray]
        .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
        .slice(0, 5);

      const processed = sorted.map(post => {
        let mediaUrls = [];
        if (post.media_urls && Array.isArray(post.media_urls)) {
          mediaUrls = post.media_urls.map(url => resolveMediaUrl(url)).filter(Boolean);
        } else if (post.media_url) {
          mediaUrls = [resolveMediaUrl(post.media_url)].filter(Boolean);
        }
        const hasVideo = post.media_urls?.some(url => isVideoUrl(url)) || post.post_type === 'video' || false;
        return {
          ...post,
          id: post.id,
          title: post.title || 'Untitled',
          likeCount: post.likes_count || 0,
          commentCount: post.comments_count || 0,
          mediaUrls: mediaUrls,
          firstMediaUrl: mediaUrls.length > 0 ? mediaUrls[0] : null,
          hasVideo: hasVideo,
        };
      });
      setTopPosts(processed);
    } catch (error) {
      console.error('Failed to load top posts:', error);
      setTopPosts([]);
    } finally {
      setLoadingTopPosts(false);
    }
  }, [businessId, resolveMediaUrl, isVideoUrl]);

  useEffect(() => {
    if (businessId && businessData) loadTopPosts();
  }, [businessId, businessData, loadTopPosts]);

  // ===== LOAD BUSINESS FUNCTION WITH STATS =====
  const loadBusiness = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setDataLoadError(null);
      const result = await getBusiness(businessId, forceRefresh);

      if (!result) {
        setDataLoadError('No business data returned');
        setBusinessData(null);
        setLoading(false);
        return;
      }

      let businessInfo = null;

      if (result.success && result.business) {
        businessInfo = result.business.business || result.business;
      } else if (result.business) {
        businessInfo = result.business.business || result.business;
      } else if (result.data && result.data.business) {
        businessInfo = result.data.business;
      } else if (result.id) {
        businessInfo = result;
      } else {
        setDataLoadError('Unknown response format');
        setBusinessData(null);
        setLoading(false);
        return;
      }

      if (!businessInfo) {
        setDataLoadError('No business data available');
        setBusinessData(null);
        setLoading(false);
        return;
      }

      // Ensure media URLs are resolved
      if (businessInfo.logo_url) {
        businessInfo.logo_url = resolveMediaUrl(businessInfo.logo_url);
      }
      if (businessInfo.background_picture_url) {
        businessInfo.background_picture_url = resolveMediaUrl(businessInfo.background_picture_url);
      }

      // Safely get follower count from multiple possible sources
      const followerCount = businessInfo.followers_count ||
                           businessInfo.analytics?.total_followers ||
                           businessInfo.analytics?.followers_count ||
                           0;

      const followingStatus = businessInfo.is_following === true;

      console.log('📊 Business loaded - follow status:', {
        is_following: businessInfo.is_following,
        followers_count: businessInfo.followers_count,
        analytics_followers: businessInfo.analytics?.total_followers,
        followingStatus,
        followerCount
      });

      // Add missing fields to businessInfo if they don't exist
      businessInfo.is_following = followingStatus;
      businessInfo.followers_count = followerCount;

      setBusinessData(businessInfo);

      // Also update React Query cache
      queryClient.setQueryData(['business', businessId], businessInfo);

      // Update stats
      setStats({
        totalPosts: businessInfo.posts_count || businessInfo.analytics?.total_posts || 0,
        totalLikes: businessInfo.likes_count || businessInfo.analytics?.total_likes || 0,
        totalComments: businessInfo.comments_count || businessInfo.analytics?.total_comments || 0,
        totalFollowers: followerCount,
        totalReviews: 0
      });

    } catch (error) {
      console.error('Failed to load business:', error);
      setDataLoadError(error.message || 'Failed to load business');
      showToast(error.message || 'Failed to load business', 'error');
      setBusinessData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessPosts = async (pageNum = 1) => {
    try {
      setPostsLoading(true);
      const offset = (pageNum - 1) * postsPerPage;
      const postsData = await postsService.getBusinessPosts(businessId, postsPerPage, offset);

      let postsArray = [];
      let hasMorePosts = false;

      if (Array.isArray(postsData)) {
        postsArray = postsData;
        hasMorePosts = postsData.length === postsPerPage;
      } else if (postsData && Array.isArray(postsData.posts)) {
        postsArray = postsData.posts;
        hasMorePosts = postsData.has_more || postsData.posts.length === postsPerPage;
      } else if (postsData && postsData.data) {
        postsArray = postsData.data;
        hasMorePosts = postsData.has_more || postsData.data.length === postsPerPage;
      }

      const processedPosts = postsArray.map(post => {
        let mediaUrls = [];
        if (post.media_urls && Array.isArray(post.media_urls)) {
          mediaUrls = post.media_urls.map(url => resolveMediaUrl(url)).filter(Boolean);
        } else if (post.media_url) {
          mediaUrls = [resolveMediaUrl(post.media_url)].filter(Boolean);
        }
        const hasVideo = post.media_urls?.some(url => isVideoUrl(url)) || post.post_type === 'video' || false;

        const businessLogo = post.business_logo_url || post.business_logo || businessData?.logo_url;
        const resolvedBusinessLogo = businessLogo ? resolveMediaUrl(businessLogo) : null;

        return {
          ...post,
          id: post.id,
          title: post.title || 'Untitled',
          content: post.content || '',
          isLiked: post.is_liked || false,
          likeCount: post.likes_count || 0,
          commentCount: post.comments_count || 0,
          mediaUrls: mediaUrls,
          firstMediaUrl: mediaUrls.length > 0 ? mediaUrls[0] : null,
          hasVideo: hasVideo,
          createdAt: post.created_at,
          business_id: post.business_id,
          business_name: post.business_name || businessData?.name || 'Business',
          business_logo: resolvedBusinessLogo,
          business_logo_url: resolvedBusinessLogo,
          business_category: post.business_category || null,
          business_city: post.business_city || null,
        };
      });

      if (pageNum === 1) setPosts(processedPosts);
      else setPosts(prev => [...prev, ...processedPosts]);

      setHasMore(hasMorePosts);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load posts:', error);
      if (pageNum === 1) setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Owner actions
  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const refreshPosts = useCallback(() => {
    loadBusinessPosts(1);
    loadTopPosts();
  }, [loadBusinessPosts, loadTopPosts]);

  const handleImageError = (id, type = 'post') => {
    setImageErrors(prev => ({ ...prev, [`${type}_${id}`]: true }));
  };

  const handlePostClick = (post, index) => {
    const postWithResolvedMedia = {
      ...post,
      media_urls: post.mediaUrls || post.media_urls,
      business_logo: post.business_logo,
      business_name: post.business_name,
      business_id: post.business_id,
    };
    setSelectedPost(postWithResolvedMedia);
    setSelectedPostIndex(index);
    setShowPostViewModal(true);
  };

  const handleClosePostModal = () => {
    setShowPostViewModal(false);
    setSelectedPost(null);
    setSelectedPostIndex(0);
  };

  const handlePostUpdate = () => {
    loadBusinessPosts(1);
    loadTopPosts();
  };

  // CRITICAL: Invalidate cache on edit success to update all PostCards
  const handleEditSuccess = () => {
    setShowEditModal(false);
    loadBusiness(true);

    // Invalidate business cache to update all PostCard components
    queryClient.invalidateQueries({ queryKey: ['business', businessId] });
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
    queryClient.refetchQueries({ queryKey: ['business', businessId] });

    console.log('🔄 Business cache invalidated - all PostCards will update with new business info');
  };

  const handleEditCover = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Uploading:', file);
      showToast('Cover image upload feature coming soon', 'info');
    }
  };

  const isOwner = user?.id === businessData?.owner_id;
  const getFallbackIcon = (post) => isVideoPost(post) ? '▶️' : '📷';
  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Calculate engagement rate using businessData followers count
  const engagementRate = (businessData?.followers_count || 0) > 0
    ? ((stats.totalLikes + stats.totalComments) / (businessData?.followers_count || 1) * 100).toFixed(1)
    : 0;

  // Debug log
  console.log('🎯 RENDER STATE:', {
    businessId,
    isOwner,
    userLoggedIn: !!user,
    isFollowing: businessData?.is_following,
    followersCount: businessData?.followers_count,
    buttonText: businessData?.is_following ? 'Unfollow' : 'Follow +'
  });

  // Skeleton Loader Component
  const PostSkeleton = () => (
    <div className="post-skeleton">
      <div className="skeleton-media shimmer"></div>
      <div className="skeleton-content">
        <div className="skeleton-title shimmer"></div>
        <div className="skeleton-text shimmer"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="business-profile-full__loading">
        <LoadingSpinner size="large" />
        <p className="business-profile-full__loading-message">{loadingMessage}</p>
      </div>
    );
  }

  if (dataLoadError || !businessData) {
    return (
      <div className="business-profile-full__error">
        <div className="business-profile-full__error-icon">🏢</div>
        <h2 className="business-profile-full__error-title">Business Not Found</h2>
        <p className="business-profile-full__error-message">
          {dataLoadError || "The business you're looking for doesn't exist or has been removed."}
        </p>
        <div className="business-profile-full__error-actions">
          <Link to="/business/search">
            <Button variant="primary">Browse Businesses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const businessName = safeGet(businessData, 'name', 'Unknown Business');
  const businessDescription = safeGet(businessData, 'description', 'No description provided.');
  const businessCategory = safeGet(businessData, 'category', '');
  const businessWebsite = safeGet(businessData, 'website', '');
  const businessCity = safeGet(businessData, 'city', '');
  const businessState = safeGet(businessData, 'state', '');
  const businessPhone = safeGet(businessData, 'phone', '');
  const businessEmail = safeGet(businessData, 'email', '');
  const businessAddress = safeGet(businessData, 'address', '');
  const businessTags = safeGet(businessData, 'tags', []);
  const businessLogo = businessData.logo_url ? resolveMediaUrl(businessData.logo_url) : null;
  const businessCover = businessData.background_picture_url ? resolveMediaUrl(businessData.background_picture_url) : null;
  const businessRating = safeGet(businessData, 'rating', null);

  const videoPosts = posts.filter(p => isVideoPost(p));

  const hasHoursSet = operatingHours !== null;
  const todayOpenTime = todayHours?.enabled ? formatDisplayTime(todayHours.open) : null;
  const todayCloseTime = todayHours?.enabled ? formatDisplayTime(todayHours.close) : null;

  // Prepare posts for PostModal
  const allPostsForModal = posts.map(post => ({
    ...post,
    media_urls: post.mediaUrls || post.media_urls,
    business_logo: post.business_logo,
    business_name: post.business_name,
    business_id: post.business_id,
    likes_count: post.likeCount,
    comments_count: post.commentCount,
    is_liked: post.isLiked || false,
  }));

  // Mobile Bottom Sheet
  const BottomSheet = () => {
    if (!isMobile) return null;

    const hasValidCoords = businessCoordinates && businessCoordinates.lat && businessCoordinates.lng;
    const locationText = [businessCity, businessState].filter(Boolean).join(', ');

    return (
      <div className={`business-profile-full__bottom-sheet ${bottomSheetOpen ? 'open' : ''}`}>
        <div className="business-profile-full__bottom-sheet-handle" onClick={() => setBottomSheetOpen(!bottomSheetOpen)} />

        {!bottomSheetOpen && (
          <div className="business-profile-full__swipe-hint">
            ↑ Swipe up for contact & directions ↑
          </div>
        )}

        <div className="business-profile-full__bottom-sheet-content">
          {/* GET DIRECTIONS */}
          <div className="business-profile-full__bottom-sheet-section">
            <div className="business-profile-full__bottom-sheet-title">📍 Get Directions</div>
            <div className="business-profile-full__bottom-sheet-map" onClick={openGoogleMaps}>
              📍
              <p>Tap to open in Google Maps</p>
              {hasValidCoords && <small>{businessCoordinates.lat.toFixed(4)}, {businessCoordinates.lng.toFixed(4)}</small>}
            </div>
            <div className="business-profile-full__bottom-sheet-item">📍 <span>{locationText || 'Location available'}</span></div>
          </div>

          {/* Contact Section with WhatsApp Icon */}
          <div className="business-profile-full__bottom-sheet-section">
            <div className="business-profile-full__bottom-sheet-title"><PhoneIcon /> Contact</div>
            {businessPhone && (
              <div className="business-profile-full__bottom-sheet-item">
                <WhatsAppIcon />
                <a href={`https://wa.me/${formatWhatsAppNumber(businessPhone)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
            )}
            {businessPhone && (
              <div className="business-profile-full__bottom-sheet-item">
                <PhoneIcon />
                <a href={`tel:${businessPhone}`}>{formatPhoneNumber(businessPhone)}</a>
              </div>
            )}
            {businessEmail && (
              <div className="business-profile-full__bottom-sheet-item">
                <EnvelopeIcon />
                <a href={`mailto:${businessEmail}`}>{businessEmail}</a>
              </div>
            )}
          </div>

          {/* Hours Section */}
          {hasHoursSet && operatingHours && (
            <div className="business-profile-full__bottom-sheet-section">
              <div className="business-profile-full__bottom-sheet-title"><ClockIcon /> Hours</div>
              <div className="business-profile-full__bottom-sheet-item">
                <ClockIcon />
                <div>
                  {(() => {
                    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                    const weekdayHours = weekdays.map(d => operatingHours?.[d]);
                    const allWeekdaysSame = weekdayHours.every(h =>
                      h?.enabled === weekdayHours[0]?.enabled &&
                      h?.open === weekdayHours[0]?.open &&
                      h?.close === weekdayHours[0]?.close
                    );

                    if (allWeekdaysSame && weekdayHours[0]) {
                      const weekdayData = weekdayHours[0];
                      return (
                        <>
                          <div style={{ marginBottom: '4px' }}>Monday - Friday: {weekdayData.enabled ? `${formatDisplayTime(weekdayData.open)} - ${formatDisplayTime(weekdayData.close)}` : 'Closed'}</div>
                          <div style={{ marginBottom: '4px' }}>Saturday: {operatingHours?.saturday?.enabled ? `${formatDisplayTime(operatingHours.saturday.open)} - ${formatDisplayTime(operatingHours.saturday.close)}` : 'Closed'}</div>
                          <div style={{ marginBottom: '4px' }}>Sunday: {operatingHours?.sunday?.enabled ? `${formatDisplayTime(operatingHours.sunday.open)} - ${formatDisplayTime(operatingHours.sunday.close)}` : 'Closed'}</div>
                        </>
                      );
                    }

                    const days = [
                      { key: 'monday', label: 'Monday' },
                      { key: 'tuesday', label: 'Tuesday' },
                      { key: 'wednesday', label: 'Wednesday' },
                      { key: 'thursday', label: 'Thursday' },
                      { key: 'friday', label: 'Friday' },
                      { key: 'saturday', label: 'Saturday' },
                      { key: 'sunday', label: 'Sunday' }
                    ];

                    return days.map(day => {
                      const hourData = operatingHours[day.key];
                      return (
                        <div key={day.key} style={{ marginBottom: '4px' }}>
                          {day.label}: {hourData?.enabled ? `${formatDisplayTime(hourData.open)} - ${formatDisplayTime(hourData.close)}` : 'Closed'}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Tags Section */}
          {businessTags && businessTags.length > 0 && (
            <div className="business-profile-full__bottom-sheet-section">
              <div className="business-profile-full__bottom-sheet-title"><TagsIcon /> Tags</div>
              <div className="business-profile-full__sidebar-tags-list">
                {businessTags.slice(0, 8).map((tag, idx) => (
                  <span key={idx} className="business-profile-full__sidebar-tag">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="business-profile-full">
      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

      {/* CINEMATIC HERO SECTION */}
      <div className={`business-profile-full__hero ${heroScrolled ? 'scrolled' : ''}`} ref={heroRef}>
        <div
          className="business-profile-full__hero-background"
          style={{
            backgroundImage: businessCover ? `url(${businessCover})` : 'linear-gradient(135deg, #1a1a2e, #16213e)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            transform: `translateY(${parallaxOffset * 0.1}px) scale(${1 + parallaxOffset * 0.0003})`
          }}
        />
        <div className="business-profile-full__hero-content">
          <div className="business-profile-full__hero-logo">
            {businessLogo && !imageErrors.logo ? (
              <img src={businessLogo} alt={businessName} onError={() => handleImageError('logo', 'business')} />
            ) : (
              <div className="business-profile-full__hero-logo-placeholder">
                {businessName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="business-profile-full__hero-name">{businessName}</h1>
          <p className="business-profile-full__hero-handle">@{businessName.toLowerCase().replace(/\s+/g, '')}</p>
          {businessCategory && (
            <div className="business-profile-full__hero-category">
              <StarIcon /> {businessCategory} {businessCity && `• ${businessCity}`}
            </div>
          )}
          <div className="business-profile-full__hero-actions">
            {isOwner ? (
              // Owner buttons
              <>
                <button className="btn-primary" onClick={() => setShowCreatePostModal(true)}>+ Create Post</button>
                <button className="btn-outline" onClick={handleEditProfile}>Edit Profile</button>
              </>
            ) : user ? (
              // Logged in non-owner - instant update with NO loading spinner
              <button
                key={`follow-btn-${businessId}-${businessData?.is_following}`}
                className={businessData?.is_following ? "btn-outline" : "btn-primary"}
                onClick={businessData?.is_following ? handleUnfollow : handleFollow}
              >
                {businessData?.is_following ? 'Unfollow' : 'Follow +'}
              </button>
            ) : (
              // Not logged in - prompt to login
              <button
                className="btn-outline"
                onClick={() => {
                  showToast('Please login to follow businesses', 'info');
                  navigate('/login');
                }}
              >
                Follow +
              </button>
            )}
          </div>
        </div>
        <div className="business-profile-full__scroll-indicator" onClick={scrollToHero}>
          <span />
        </div>
      </div>

      {/* STICKY NAVIGATION BAR */}
      <div className="business-profile-full__navbar">
        <div className="business-profile-full__navbar-content">
          <div className="business-profile-full__navbar-logo">
            {businessLogo && (
              <img src={businessLogo} alt={businessName} className="business-profile-full__navbar-logo-img" />
            )}
            <span className="business-profile-full__navbar-name">{businessName}</span>
          </div>
          <div className="business-profile-full__navbar-nav">
            <a onClick={() => { setActiveTab('posts'); window.scrollTo({ top: 350, behavior: 'smooth' }); }}>Posts</a>
            <a onClick={() => { setActiveTab('videos'); window.scrollTo({ top: 350, behavior: 'smooth' }); }}>Videos</a>
            <a onClick={() => { setActiveTab('top'); window.scrollTo({ top: 350, behavior: 'smooth' }); }}>Top</a>
            {isOwner && (
              <a onClick={() => setShowCreatePostModal(true)} style={{ color: 'var(--primary)', cursor: 'pointer' }}>+ Create</a>
            )}
          </div>
        </div>
      </div>

      {/* QUICK INFO BAR with WhatsApp Icon */}
      <div className="business-profile-full__quick-info">
        {businessRating && (
          <div className="business-profile-full__quick-info-item">
            <StarIcon /> <strong>{businessRating.toFixed(1)}</strong> <span>rating</span>
          </div>
        )}

        {/* Open/Closed Status */}
        <div className="business-profile-full__quick-info-status">
          {hasHoursSet ? (
            <>
              <span className={`status-dot ${isCurrentlyOpen ? 'open' : 'closed'}`}></span>
              <strong className={isCurrentlyOpen ? 'status-open' : 'status-closed'}>{isCurrentlyOpen ? 'Open Now' : 'Closed'}</strong>
              {todayHours?.enabled && <span className="status-hours">• {todayOpenTime} - {todayCloseTime}</span>}
            </>
          ) : (
            <>
              <span className="status-dot closed"></span>
              <strong className="status-closed">Hours not set</strong>
            </>
          )}
        </div>

        {businessPhone && (
          <div className="business-profile-full__quick-info-item">
            <WhatsAppIcon />
            <a href={`https://wa.me/${formatWhatsAppNumber(businessPhone)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        )}
      </div>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div className="business-profile-full__layout">
        {/* LEFT SIDEBAR - Location, Hours, Contact */}
        <div className="business-profile-full__sidebar">
          <div className="business-profile-full__sidebar-content">
            {(businessCity || businessState || businessAddress) && (
              <div className="business-profile-full__sidebar-location">
                <div
                  className="business-profile-full__location-link business-profile-full__clickable-location"
                  onClick={openGoogleMaps}
                >
                  <span>📍</span>
                  <span className="location-text">
                    {businessAddress ? `${businessAddress}, ` : ''}
                    {[businessCity, businessState].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            )}

            <div className="business-profile-full__sidebar-divider"></div>

            {hasHoursSet && operatingHours && (
              <div className="business-profile-full__sidebar-hours">
                <h4 className="business-profile-full__sidebar-hours-title"><ClockIcon /> Business Hours</h4>
                <div className="business-profile-full__sidebar-hours-list">
                  {formattedHoursForLeftSidebar()}
                </div>
              </div>
            )}

            <div className="business-profile-full__sidebar-divider"></div>

            <div className="business-profile-full__sidebar-contact">
              <h4 className="business-profile-full__sidebar-contact-title"><PhoneIcon /> Contact</h4>
              <div className="business-profile-full__sidebar-contact-content">
                {businessPhone && (
                  <div className="business-profile-full__contact-row">
                    <WhatsAppIcon />
                    <a
                      href={`https://wa.me/${formatWhatsAppNumber(businessPhone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="business-profile-full__contact-link"
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
                {businessPhone && (
                  <div className="business-profile-full__contact-row">
                    <PhoneIcon />
                    <a href={`tel:${businessPhone}`} className="business-profile-full__contact-link">
                      {formatPhoneNumber(businessPhone)}
                    </a>
                  </div>
                )}
                {businessEmail && (
                  <div className="business-profile-full__contact-row">
                    <EnvelopeIcon />
                    <a href={`mailto:${businessEmail}`} className="business-profile-full__contact-link">
                      {businessEmail}
                    </a>
                  </div>
                )}
                {businessWebsite && (
                  <div className="business-profile-full__contact-row">
                    <GlobeIcon />
                    <a href={businessWebsite} target="_blank" rel="noopener noreferrer" className="business-profile-full__contact-link">
                      {businessWebsite.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="business-profile-full__main">
          {/* Welcome Back Message */}
          {isReturningVisitor && (
            <div className="business-profile-full__social-proof-bar">
              ✨ Welcome back! {businessName} has {stats.totalPosts} posts waiting for you.
            </div>
          )}

          {/* STATS SECTION - Desktop */}
          {!isMobile && (
            <div className="business-profile-full__stats-section">
              <div className="business-profile-full__stats-grid">
                <div className="business-profile-full__stat-card">
                  <HeartIcon />
                  <span className="business-profile-full__stat-value">
                    {loading ? '...' : formatNumber(stats.totalLikes)}
                  </span>
                  <span className="business-profile-full__stat-label">Likes</span>
                </div>
                <div className="business-profile-full__stat-card">
                  <CommentIcon />
                  <span className="business-profile-full__stat-value">
                    {loading ? '...' : formatNumber(stats.totalComments)}
                  </span>
                  <span className="business-profile-full__stat-label">Comments</span>
                </div>
                <div className="business-profile-full__stat-card">
                  <UsersIcon />
                  <span className="business-profile-full__stat-value">
                    {loading ? '...' : formatNumber(businessData?.followers_count || 0)}
                  </span>
                  <span className="business-profile-full__stat-label">Followers</span>
                </div>
                <div className="business-profile-full__stat-card">
                  <TrendingIcon />
                  <span className="business-profile-full__stat-value">
                    {loading ? '...' : `${engagementRate}%`}
                  </span>
                  <span className="business-profile-full__stat-label">Engagement</span>
                </div>
              </div>
            </div>
          )}

          {/* STATS SECTION - Mobile (Horizontal Scroll) */}
          {isMobile && (
            <div className="business-profile-full__stats-section-mobile">
              <div className="business-profile-full__stats-scroll">
                <div className="business-profile-full__stat-card-mobile">
                  <HeartIcon />
                  <span className="business-profile-full__stat-value-mobile">
                    {loading ? '...' : formatNumber(stats.totalLikes)}
                  </span>
                  <span className="business-profile-full__stat-label-mobile">Likes</span>
                </div>
                <div className="business-profile-full__stat-card-mobile">
                  <CommentIcon />
                  <span className="business-profile-full__stat-value-mobile">
                    {loading ? '...' : formatNumber(stats.totalComments)}
                  </span>
                  <span className="business-profile-full__stat-label-mobile">Comments</span>
                </div>
                <div className="business-profile-full__stat-card-mobile">
                  <UsersIcon />
                  <span className="business-profile-full__stat-value-mobile">
                    {loading ? '...' : formatNumber(businessData?.followers_count || 0)}
                  </span>
                  <span className="business-profile-full__stat-label-mobile">Followers</span>
                </div>
                <div className="business-profile-full__stat-card-mobile">
                  <TrendingIcon />
                  <span className="business-profile-full__stat-value-mobile">
                    {loading ? '...' : `${engagementRate}%`}
                  </span>
                  <span className="business-profile-full__stat-label-mobile">Engagement</span>
                </div>
                <div className="business-profile-full__stat-card-mobile">
                  <ImageIcon />
                  <span className="business-profile-full__stat-value-mobile">
                    {loading ? '...' : formatNumber(stats.totalPosts)}
                  </span>
                  <span className="business-profile-full__stat-label-mobile">Posts</span>
                </div>
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="business-profile-full__description"><p>{businessDescription}</p></div>

          {/* Social Proof Bar */}
          <div className="business-profile-full__social-proof-bar">🌟 Join {formatNumber(businessData?.followers_count || 0)} others following {businessName}</div>

          {/* TABS SECTION */}
          <div className="business-profile-full__tabs-section" ref={tabsRef}>
            <div className="business-profile-full__tabs-header">
              <button className={`business-profile-full__tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => handleTabChange('posts')}>
                <ImageIcon /> Posts <span className="business-profile-full__tab-count">{stats.totalPosts}</span>
              </button>
              <button className={`business-profile-full__tab ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => handleTabChange('videos')}>
                <VideoIcon /> Videos <span className="business-profile-full__tab-count">{videoPosts.length}</span>
              </button>
              <button className={`business-profile-full__tab ${activeTab === 'top' ? 'active' : ''}`} onClick={() => handleTabChange('top')}>
                <TrendingIcon /> Top Posts <span className="business-profile-full__tab-count">{topPosts.length}</span>
              </button>
            </div>

            {/* POSTS TAB */}
            {activeTab === 'posts' && (
              <>
                {postsLoading && page === 1 ? (
                  <div className="business-profile-full__posts-grid">
                    {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
                  </div>
                ) : posts.length > 0 ? (
                  <div className="business-profile-full__posts-grid">
                    {posts.map((post, index) => {
                      const mediaUrl = getMediaUrl(post);
                      const isVideo = isVideoPost(post);
                      const hasError = imageErrors[`post_${post.id}`];

                      return (
                        <div key={post.id} className="business-profile-full__post-card" onClick={() => handlePostClick(post, index)}>
                          <div className="business-profile-full__post-media">
                            {isVideo && mediaUrl && !hasError ? (
                              <>
                                <video
                                  src={mediaUrl}
                                  className="business-profile-full__post-video"
                                  preload="metadata"
                                  muted
                                  playsInline
                                  onError={() => handleImageError(post.id, 'post')}
                                />
                                <div className="business-profile-full__video-badge">
                                  <VideoIcon /> VIDEO
                                </div>
                                <div className="business-profile-full__video-overlay">
                                  <PlayIcon />
                                </div>
                              </>
                            ) : mediaUrl && !hasError ? (
                              <img
                                src={mediaUrl}
                                alt={post.title}
                                className="business-profile-full__post-image"
                                onError={() => handleImageError(post.id, 'post')}
                                loading="lazy"
                              />
                            ) : (
                              <div className="business-profile-full__post-placeholder">
                                <span className="business-profile-full__post-placeholder-icon">
                                  {getFallbackIcon(post)}
                                </span>
                              </div>
                            )}

                            <div className="business-profile-full__post-overlay">
                              <HeartIcon /> {post.likeCount || 0}
                              <CommentIcon /> {post.commentCount || 0}
                            </div>
                          </div>

                          <div className="business-profile-full__post-info">
                            <h4 className="business-profile-full__post-title">{post.title || 'Untitled'}</h4>
                            <span className="business-profile-full__post-date">
                              <CalendarIcon /> {formatRelativeTime(post.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="business-profile-full__empty">
                    <div className="business-profile-full__empty-icon">📷</div>
                    <h3>No posts yet</h3>
                    <p>This business hasn't posted anything yet.</p>
                    {isOwner && (
                      <button className="btn-primary" onClick={() => setShowCreatePostModal(true)} style={{ marginTop: '16px' }}>
                        Create your first post
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* VIDEOS TAB */}
            {activeTab === 'videos' && (
              <>
                {videoPosts.length > 0 ? (
                  <div className="business-profile-full__posts-grid">
                    {videoPosts.map((post, index) => {
                      const mediaUrl = getMediaUrl(post);
                      const hasError = imageErrors[`video_${post.id}`];

                      return (
                        <div key={post.id} className="business-profile-full__post-card" onClick={() => handlePostClick(post, index)}>
                          <div className="business-profile-full__post-media">
                            {mediaUrl && !hasError ? (
                              <>
                                <video
                                  src={mediaUrl}
                                  className="business-profile-full__post-video"
                                  preload="metadata"
                                  muted
                                  playsInline
                                  onError={() => handleImageError(post.id, 'video')}
                                />
                                <div className="business-profile-full__video-badge">
                                  <VideoIcon /> VIDEO
                                </div>
                                <div className="business-profile-full__video-overlay">
                                  <PlayIcon />
                                </div>
                              </>
                            ) : (
                              <div className="business-profile-full__post-placeholder">
                                <span className="business-profile-full__post-placeholder-icon">▶️</span>
                              </div>
                            )}

                            <div className="business-profile-full__post-overlay">
                              <HeartIcon /> {post.likeCount || 0}
                              <CommentIcon /> {post.commentCount || 0}
                            </div>
                          </div>

                          <div className="business-profile-full__post-info">
                            <h4 className="business-profile-full__post-title">{post.title || 'Untitled'}</h4>
                            <span className="business-profile-full__post-date">
                              <CalendarIcon /> {formatRelativeTime(post.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="business-profile-full__empty">
                    <div className="business-profile-full__empty-icon">▶️</div>
                    <h3>No videos yet</h3>
                    {isOwner && (
                      <button className="btn-primary" onClick={() => setShowCreatePostModal(true)} style={{ marginTop: '16px' }}>
                        Create your first video post
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* TOP POSTS TAB */}
            {activeTab === 'top' && (
              <>
                {loadingTopPosts ? (
                  <div className="business-profile-full__posts-grid">
                    {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
                  </div>
                ) : topPosts.length > 0 ? (
                  <div className="business-profile-full__posts-grid">
                    {topPosts.map((post, index) => {
                      const mediaUrl = getMediaUrl(post);
                      const isVideo = isVideoPost(post);

                      return (
                        <div key={post.id} className="business-profile-full__post-card" onClick={() => handlePostClick(post, index)}>
                          <div className="business-profile-full__post-media">
                            {isVideo && mediaUrl ? (
                              <>
                                <video
                                  src={mediaUrl}
                                  className="business-profile-full__post-video"
                                  preload="metadata"
                                  muted
                                  playsInline
                                />
                                <div className="business-profile-full__video-badge">
                                  <VideoIcon /> VIDEO
                                </div>
                                <div className="business-profile-full__video-overlay">
                                  <PlayIcon />
                                </div>
                              </>
                            ) : mediaUrl ? (
                              <img
                                src={mediaUrl}
                                alt={post.title}
                                className="business-profile-full__post-image"
                                loading="lazy"
                              />
                            ) : (
                              <div className="business-profile-full__post-placeholder">
                                <span className="business-profile-full__post-placeholder-icon">🔥</span>
                              </div>
                            )}

                            {index < 3 && (
                              <div className="business-profile-full__top-badge">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </div>
                            )}

                            <div className="business-profile-full__post-overlay">
                              <HeartIcon /> {post.likeCount || 0}
                              <CommentIcon /> {post.commentCount || 0}
                            </div>
                          </div>
                          <div className="business-profile-full__post-info">
                            <h4 className="business-profile-full__post-title">{post.title}</h4>
                            <span className="business-profile-full__post-date">
                              <HeartIcon /> {post.likeCount || 0} likes
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="business-profile-full__empty">
                    <div className="business-profile-full__empty-icon">🔥</div>
                    <h3>No top posts yet</h3>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR - Tags and Trending Posts */}
        {!isMobile && (
          <div className="business-profile-full__right-sidebar">
            {businessTags && businessTags.length > 0 && (
              <div className="business-profile-full__right-card">
                <div className="business-profile-full__right-card-header"><TagsIcon /> Tags</div>
                <div className="business-profile-full__right-card-content">
                  <div className="business-profile-full__sidebar-tags-list">
                    {businessTags.slice(0, 8).map((tag, idx) => (
                      <span key={idx} className="business-profile-full__sidebar-tag">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {topPosts.length > 0 && (
              <div className="business-profile-full__right-card">
                <div className="business-profile-full__right-card-header"><TrendingIcon /> Trending</div>
                <div className="business-profile-full__right-card-content">
                  {topPosts.slice(0, 3).map((post, idx) => (
                    <div key={post.id} className="business-profile-full__trending-item" onClick={() => handlePostClick(post, idx)}>
                      <div className="business-profile-full__trending-rank">#{idx + 1}</div>
                      <div className="business-profile-full__trending-content">
                        <div className="business-profile-full__trending-title">{post.title}</div>
                        <div className="business-profile-full__trending-stats"><HeartIcon /> {post.likeCount} likes</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BACK TO TOP BUTTON */}
      <button
        className={`business-profile-full__back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>

      {/* MOBILE BOTTOM SHEET */}
      <BottomSheet />

      {/* BUSINESS FORM MODAL - For editing profile */}
      <BusinessFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        business={businessData}
        mode="edit"
        onSuccess={handleEditSuccess}
      />

      {/* CREATE POST MODAL - Opens like BusinessFormModal */}
      <PostFormModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        businessId={businessData?.id}
        businessName={businessData?.name}
        businessLogo={businessData?.logo_url}
        onSuccess={(newPost) => {
          console.log('📦 New post received:', newPost);

          setShowCreatePostModal(false);

          if (newPost && newPost.id) {
            const postWithLogo = {
              ...newPost,
              business_logo: businessData?.logo_url,
              business_logo_url: businessData?.logo_url,
              business_name: businessData?.name,
              business_id: businessData?.id,
            };

            setPosts(prevPosts => [postWithLogo, ...prevPosts]);

            setStats(prev => ({
              ...prev,
              totalPosts: prev.totalPosts + 1
            }));
          }

          refreshPosts();
          showToast('Post created successfully!', 'success');
        }}
      />

      {/* POST VIEW MODAL */}
      {showPostViewModal && selectedPost && (
        <PostModal
          posts={allPostsForModal}
          initialPostIndex={selectedPostIndex}
          post={selectedPost}
          isOpen={showPostViewModal}
          onClose={handleClosePostModal}
          onUpdate={handlePostUpdate}
          initialLikeState={{ isLiked: selectedPost.isLiked || false, likesCount: selectedPost.likeCount || 0 }}
          initialSaveState={false}
          initialCommentsCount={selectedPost.commentCount || 0}
          resolveMediaUrl={resolveMediaUrl}
          isVideoUrl={isVideoUrl}
          initialMediaIndex={0}
          onPostChange={(newIndex) => {
            setSelectedPostIndex(newIndex);
            setSelectedPost(allPostsForModal[newIndex]);
          }}
          useMiles={false}
          isOwner={isOwner}
        />
      )}
    </div>
  );
};

export default BusinessProfile;