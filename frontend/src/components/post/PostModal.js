// PostModal.js - COMPLETE with real-time business data and proper scrolling
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { postKeys } from '../../hooks/usePostLike';
import { useBusinessData } from '../../hooks/useBusinessData';
import { useQueryClient } from '@tanstack/react-query';
import postsService from '../../services/posts';
import CommentSection from './CommentSection';
import LazyVideo from '../common/LazyVideo';
import './PostModal.css';

const PostModal = ({
  postId: propPostId,
  posts = [],
  initialPostIndex = 0,
  post: singlePost,
  isOpen,
  onClose,
  onUpdate,
  initialLikeState,
  initialSaveState,
  initialCommentsCount,
  initialMediaIndex = 0,
  isVideoUrl: propIsVideoUrl,
  resolveMediaUrl: propResolveMediaUrl,
  onPostChange,
  useMiles = false,
  isOwner: propIsOwner = false
}) => {
  // ========== STATE DECLARATIONS ==========
  const [activePostIndex, setActivePostIndex] = useState(initialPostIndex);
  const [activeMediaIndex, setActiveMediaIndex] = useState(initialMediaIndex);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Current post state from cache
  const [currentPost, setCurrentPost] = useState(null);
  const [cachedLikeState, setCachedLikeState] = useState({ is_liked: false, likes_count: 0 });

  // Swipe detection state
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const [mediaDimensions, setMediaDimensions] = useState({ width: 0, height: 0 });
  const [mediaAspectRatio, setMediaAspectRatio] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [expandedText, setExpandedText] = useState(false);
  const [showFullComments, setShowFullComments] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [isOwner, setIsOwner] = useState(propIsOwner);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const lastLikeClickRef = useRef(0);

  // Volume button state
  const [isMuted, setIsMuted] = useState(true);
  const [showVolumeButton, setShowVolumeButton] = useState(true);

  // ========== CONTEXT & HOOKS ==========
  const { user } = useAuth();
  const { showToast } = useApp();
  const queryClient = useQueryClient();

  // ========== GET CURRENT POST ID ==========
  const getCurrentPostId = useCallback(() => {
    if (posts.length > 0 && activePostIndex >= 0 && activePostIndex < posts.length) {
      return posts[activePostIndex]?.id;
    }
    if (singlePost) return singlePost?.id;
    return propPostId;
  }, [posts, activePostIndex, singlePost, propPostId]);

  const currentPostId = getCurrentPostId();

  // ========== REAL-TIME BUSINESS DATA ==========
  const businessData = useBusinessData(currentPost?.business_id, {
    name: currentPost?.business_name,
    logo: currentPost?.business_logo || currentPost?.business_logo_url,
    is_verified: currentPost?.is_verified,
  });

  // ========== READ FROM CACHE DIRECTLY ==========
  const getCurrentPostFromCache = useCallback(() => {
    if (!currentPostId) return null;
    return queryClient.getQueryData(postKeys.detail(currentPostId));
  }, [currentPostId, queryClient]);

  // Subscribe to cache updates
  useEffect(() => {
    if (!currentPostId || !isOpen) return;

    const cached = getCurrentPostFromCache();
    if (cached) {
      console.log('📦 [PostModal] Loaded from cache:', { id: cached.id, is_liked: cached.is_liked, likes_count: cached.likes_count });
      setCurrentPost(cached);
      setCachedLikeState({ is_liked: cached.is_liked || false, likes_count: cached.likes_count || 0 });
    } else if (posts[activePostIndex]) {
      const fallback = posts[activePostIndex];
      console.log('📦 [PostModal] Using fallback from props:', { id: fallback.id, is_liked: fallback.is_liked });
      setCurrentPost(fallback);
      setCachedLikeState({ is_liked: fallback.is_liked || false, likes_count: fallback.likes_count || 0 });
      queryClient.setQueryData(postKeys.detail(currentPostId), fallback);
    } else {
      console.log('🔄 [PostModal] Fetching post from API:', currentPostId);
      postsService.getPost(currentPostId).then(post => {
        queryClient.setQueryData(postKeys.detail(currentPostId), post);
        setCurrentPost(post);
        setCachedLikeState({ is_liked: post.is_liked || false, likes_count: post.likes_count || 0 });
      }).catch(err => console.error('Failed to fetch post:', err));
    }

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' &&
          event.query.queryKey[0] === 'posts' &&
          event.query.queryKey[1] === 'detail' &&
          event.query.queryKey[2] === currentPostId) {
        const updated = queryClient.getQueryData(postKeys.detail(currentPostId));
        if (updated) {
          console.log('🔄 [PostModal] Cache update detected:', {
            id: updated.id,
            is_liked: updated.is_liked,
            likes_count: updated.likes_count
          });
          setCurrentPost(updated);
          setCachedLikeState({ is_liked: updated.is_liked || false, likes_count: updated.likes_count || 0 });
        }
      }
    });

    return () => unsubscribe();
  }, [currentPostId, isOpen, queryClient, getCurrentPostFromCache, posts, activePostIndex]);

  const currentIsLiked = cachedLikeState.is_liked;
  const currentLikesCount = cachedLikeState.likes_count;

  // ========== REFS ==========
  const videoRefs = useRef({});
  const imgRef = useRef(null);
  const mediaContainerRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const volumeHideTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // ========== HELPER FUNCTIONS ==========
  const resolveMediaUrl = useCallback((url) => {
    if (propResolveMediaUrl) return propResolveMediaUrl(url);
    if (!url || url === 'null' || url === 'undefined') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');
    let cleanUrl = url.replace(/^\/+/, '');
    if (cleanUrl.startsWith('media/')) return `${baseUrl}/${cleanUrl}`;
    const filename = cleanUrl.split('/').pop();
    return `${baseUrl}/media/${filename}`;
  }, [propResolveMediaUrl]);

  const isVideoUrl = useCallback((url) => {
    if (propIsVideoUrl) return propIsVideoUrl(url);
    if (!url) return false;
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'mpeg', 'mpg', 'ogg', 'ogv'];
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
    return videoExtensions.includes(extension);
  }, [propIsVideoUrl]);

  const getCurrentMediaUrl = useCallback(() => {
    if (!currentPost?.media_urls || currentPost.media_urls.length === 0) return null;
    const rawUrl = currentPost.media_urls[activeMediaIndex];
    return resolveMediaUrl(rawUrl);
  }, [currentPost, activeMediaIndex, resolveMediaUrl]);

  const isCurrentMediaVideo = useCallback(() => {
    const url = getCurrentMediaUrl();
    return isVideoUrl(url);
  }, [getCurrentMediaUrl, isVideoUrl]);

  const updateMediaDimensions = useCallback(() => {
    let width = 0, height = 0;
    if (imgRef.current) {
      width = imgRef.current.naturalWidth || imgRef.current.clientWidth;
      height = imgRef.current.naturalHeight || imgRef.current.clientHeight;
      setMediaDimensions({ width, height });
      setMediaAspectRatio(width / height);
    } else if (videoRefs.current[currentPostId] && videoRefs.current[currentPostId].getVideo) {
      const video = videoRefs.current[currentPostId].getVideo();
      if (video) {
        width = video.videoWidth || video.clientWidth;
        height = video.videoHeight || video.clientHeight;
        setMediaDimensions({ width, height });
        setMediaAspectRatio(width / height);
      }
    }
  }, [currentPostId]);

  const isPortrait = useCallback(() => {
    if (!mediaAspectRatio) return false;
    return mediaAspectRatio < 0.8;
  }, [mediaAspectRatio]);

  const getMediaObjectFit = useCallback(() => {
    if (isPortrait()) return 'cover';
    return 'contain';
  }, [isPortrait]);

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // ========== BUSINESS INFO WITH REAL-TIME DATA ==========
  const businessLogoUrl = useMemo(() => {
    if (!currentPost) return null;
    const logoUrl = businessData.logo ||
                    currentPost.business_logo ||
                    currentPost.business_logo_url ||
                    currentPost.business?.logo_url ||
                    currentPost.business?.logo;
    if (!logoUrl || logoUrl === 'null' || logoUrl === 'undefined') return null;
    if (logoError) return null;
    return resolveMediaUrl(logoUrl);
  }, [currentPost, businessData.logo, logoError, resolveMediaUrl]);

  const hasBusinessLogo = !!businessLogoUrl && !logoError;
  const businessName = useMemo(() => {
    return businessData.name || currentPost?.business_name || 'Business';
  }, [businessData.name, currentPost?.business_name]);

  const businessInitial = useMemo(() => {
    return businessName.charAt(0).toUpperCase();
  }, [businessName]);

  // ========== VOLUME BUTTON HANDLER ==========
  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const video = videoRefs.current[currentPostId];
    if (video && video.getVideo) {
      const videoElement = video.getVideo();
      if (videoElement) {
        const newMutedState = !isMuted;
        videoElement.muted = newMutedState;
        setIsMuted(newMutedState);
        setShowVolumeButton(true);
        if (volumeHideTimeoutRef.current) clearTimeout(volumeHideTimeoutRef.current);
        volumeHideTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) setShowVolumeButton(false);
        }, 2000);
      }
    }
  }, [isMuted, currentPostId]);

  // ========== LIKE HANDLER ==========
  const handleLike = useCallback(async () => {
    const wasLiked = currentIsLiked;
    const currentCount = currentLikesCount;

    console.log('🔘 [LIKE HANDLER] Triggered', {
      postId: currentPostId,
      wasLiked,
      currentCount,
      hasUser: !!user
    });

    const now = Date.now();
    if (now - lastLikeClickRef.current < 300) {
      console.log('⚠️ Rate limiting - too many clicks');
      return;
    }
    lastLikeClickRef.current = now;

    if (!currentPost) {
      console.log('❌ No current post');
      return;
    }

    if (!user) {
      console.log('❌ No user, showing login toast');
      showToast('Please login to like posts', 'warning');
      return;
    }

    if (window.navigator?.vibrate) {
      window.navigator.vibrate(30);
    }

    const newIsLiked = !wasLiked;
    const newLikesCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    console.log(`⚡ Optimistic update: ${newIsLiked ? 'Liked' : 'Unliked'} (${newLikesCount} likes)`);

    queryClient.setQueryData(postKeys.detail(currentPostId), (old) => ({
      ...old,
      is_liked: newIsLiked,
      likes_count: newLikesCount,
    }));

    try {
      let result;
      if (wasLiked) {
        result = await postsService.unlikePost(currentPostId);
        console.log('Unlike result:', result);
      } else {
        result = await postsService.likePost(currentPostId);
        console.log('Like result:', result);
      }

      queryClient.setQueryData(postKeys.detail(currentPostId), (old) => ({
        ...old,
        is_liked: result.is_liked,
        likes_count: result.likes_count,
      }));

      await queryClient.invalidateQueries({ queryKey: ['posts'] });

    } catch (error) {
      console.error(`${wasLiked ? 'Unlike' : 'Like'} failed:`, error);
      queryClient.setQueryData(postKeys.detail(currentPostId), (old) => ({
        ...old,
        is_liked: wasLiked,
        likes_count: currentCount,
      }));
      showToast(error.message || `Failed to ${wasLiked ? 'unlike' : 'like'}`, 'error');
    }
  }, [currentPost, currentPostId, currentIsLiked, currentLikesCount, user, showToast, queryClient]);

  // ========== SAVE HANDLER ==========
  const handleSave = useCallback(async () => {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(30);
    setIsSaved(prev => !prev);
    showToast(isSaved ? 'Removed from saved' : 'Saved to your collection', 'success');
  }, [isSaved, showToast]);

  // ========== SHARE HANDLER ==========
  const handleShare = useCallback(async () => {
    if (!currentPost) return;
    const shareData = {
      title: currentPost.title || 'Check out this post',
      text: currentPost.content || `From ${businessName}`,
      url: `${window.location.origin}/post/${currentPost.id}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully!', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(shareData.url);
          showToast('Link copied to clipboard!', 'success');
        }
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
      showToast('Link copied to clipboard!', 'success');
    }
  }, [currentPost, businessName, showToast]);

  // ========== DELETE POST HANDLER ==========
  const handleDeletePost = useCallback(async () => {
    if (!currentPost?.id) {
      showToast('Cannot delete: No post ID found', 'error');
      return;
    }
    setDeleting(true);
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      const url = `${baseURL}/posts/${currentPost.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        showToast('Post deleted successfully!', 'success');
        setShowDeleteConfirm(false);
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        const newPosts = posts.filter((_, idx) => idx !== activePostIndex);
        if (newPosts.length > 0) {
          const newIndex = activePostIndex >= newPosts.length ? newPosts.length - 1 : activePostIndex;
          setActivePostIndex(newIndex);
          setActiveMediaIndex(0);
          if (onPostChange) onPostChange(newIndex);
        } else {
          onClose();
        }
        if (onUpdate) onUpdate();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showToast(error.message || 'Failed to delete post', 'error');
    } finally {
      setDeleting(false);
    }
  }, [currentPost, activePostIndex, posts, queryClient, onPostChange, onUpdate, onClose, showToast]);

  // ========== NAVIGATION FUNCTIONS ==========
  const goToPreviousPost = useCallback(() => {
    let currentTransitioning = isTransitioning;
    if (currentTransitioning) {
      console.log('⚠️ [DEBUG] goToPreviousPost - isTransitioning is stuck! Forcing reset');
      setIsTransitioning(false);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      currentTransitioning = false;
    }
    if (currentTransitioning || posts.length === 0) return;
    let newIndex = activePostIndex - 1;
    if (newIndex < 0) newIndex = posts.length - 1;
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    setIsTransitioning(true);
    setActivePostIndex(newIndex);
    setActiveMediaIndex(0);
    setMediaAspectRatio(null);
    setExpandedText(false);
    setLogoError(false);
    if (onPostChange) onPostChange(newIndex);
    transitionTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) setIsTransitioning(false);
    }, 300);
  }, [activePostIndex, posts.length, isTransitioning, onPostChange]);

  const goToNextPost = useCallback(() => {
    let currentTransitioning = isTransitioning;
    if (currentTransitioning) {
      console.log('⚠️ [DEBUG] goToNextPost - isTransitioning is stuck! Forcing reset');
      setIsTransitioning(false);
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      currentTransitioning = false;
    }
    if (currentTransitioning || posts.length === 0) return;
    let newIndex = activePostIndex + 1;
    if (newIndex >= posts.length) newIndex = 0;
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    setIsTransitioning(true);
    setActivePostIndex(newIndex);
    setActiveMediaIndex(0);
    setMediaAspectRatio(null);
    setExpandedText(false);
    setLogoError(false);
    if (onPostChange) onPostChange(newIndex);
    transitionTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) setIsTransitioning(false);
    }, 300);
  }, [activePostIndex, posts.length, isTransitioning, onPostChange]);

  const handlePreviousMedia = useCallback(() => {
    if (!currentPost?.media_urls || currentPost.media_urls.length === 0) return;
    setActiveMediaIndex(prev => Math.max(0, prev - 1));
    setMediaAspectRatio(null);
  }, [currentPost]);

  const handleNextMedia = useCallback(() => {
    if (!currentPost?.media_urls || currentPost.media_urls.length === 0) return;
    setActiveMediaIndex(prev => Math.min(currentPost.media_urls.length - 1, prev + 1));
    setMediaAspectRatio(null);
  }, [currentPost]);

  // ========== TOUCH HANDLERS - NO INTERFERENCE WITH VERTICAL SCROLL ==========
  const handleTouchStart = useCallback((e) => {
    if (isTransitioning) return;
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setIsSwiping(true);
    setSwipeDirection(null);
  }, [isTransitioning]);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartX || !touchStartY || !isSwiping || isTransitioning) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - touchStartX);
    const diffY = Math.abs(currentY - touchStartY);

    if (!swipeDirection && (diffX > 10 || diffY > 10)) {
      if (diffX > diffY && diffX > 30) {
        setSwipeDirection('horizontal');
        e.preventDefault();
      } else if (diffY > diffX && diffY > 30) {
        setSwipeDirection('vertical');
        // DO NOT prevent default for vertical swipes
      }
    }

    if (swipeDirection === 'horizontal') {
      e.preventDefault();
    }
  }, [touchStartX, touchStartY, isSwiping, isTransitioning, swipeDirection]);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartX || !touchStartY || !isSwiping || isTransitioning) {
      setIsSwiping(false);
      setTouchStartX(null);
      setTouchStartY(null);
      setSwipeDirection(null);
      return;
    }

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchStartX;
    const diffY = endY - touchStartY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);
    const minSwipeDistance = 50;

    if (absDiffX > minSwipeDistance && absDiffX > absDiffY) {
      if (diffX > 0 && activeMediaIndex > 0) {
        handlePreviousMedia();
      } else if (diffX < 0 && activeMediaIndex < (currentPost?.media_urls?.length || 0) - 1) {
        handleNextMedia();
      }
    } else if (absDiffY > minSwipeDistance && absDiffY > absDiffX && posts.length > 1) {
      if (diffY > 0) {
        goToPreviousPost();
      } else if (diffY < 0) {
        goToNextPost();
      }
    }

    setIsSwiping(false);
    setTouchStartX(null);
    setTouchStartY(null);
    setSwipeDirection(null);
  }, [touchStartX, touchStartY, isSwiping, isTransitioning, activeMediaIndex, currentPost, posts.length, handlePreviousMedia, handleNextMedia, goToPreviousPost, goToNextPost]);

  // ========== EFFECTS ==========
  useEffect(() => {
    if (propIsOwner !== undefined) {
      setIsOwner(propIsOwner);
    } else if (currentPost && user) {
      setIsOwner(currentPost.user_id === user.id || currentPost.business_user_id === user.id);
    }
  }, [propIsOwner, currentPost, user]);

  useEffect(() => {
    if (currentPost) {
      setIsSaved(initialSaveState || currentPost.is_saved || false);
      setCommentsCount(initialCommentsCount !== undefined ? initialCommentsCount : (currentPost.comments_count || 0));
      setLogoError(false);
      if (!isMobile) setShowFullComments(true);
    }
  }, [currentPost, initialSaveState, initialCommentsCount, isMobile]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      if (!mobile) setShowFullComments(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      setActiveMediaIndex(initialMediaIndex);
      setActivePostIndex(initialPostIndex);
      setMediaAspectRatio(null);
      setExpandedText(false);
      setLogoError(false);
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [isOpen, initialMediaIndex, initialPostIndex]);

  const prevPostIdRef = useRef();
  useEffect(() => {
    if (prevPostIdRef.current !== currentPostId && currentPostId) {
      console.log('📌 [DEBUG] Post changed, resetting media index');
      setActiveMediaIndex(0);
      setMediaAspectRatio(null);
      setExpandedText(false);
      setLogoError(false);
      prevPostIdRef.current = currentPostId;
    }
  }, [currentPostId]);

  useEffect(() => {
    if (!isCurrentMediaVideo() && imgRef.current) {
      const img = imgRef.current;
      if (img.complete) {
        updateMediaDimensions();
      } else {
        img.addEventListener('load', updateMediaDimensions);
        return () => img.removeEventListener('load', updateMediaDimensions);
      }
    }
  }, [activeMediaIndex, isCurrentMediaVideo, updateMediaDimensions]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (volumeHideTimeoutRef.current) clearTimeout(volumeHideTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentPostId && isOpen) {
      console.log('🏗️ [PostModal] Current state:', {
        postId: currentPostId,
        is_liked: currentIsLiked,
        likes_count: currentLikesCount,
        businessName: businessName,
        businessId: currentPost?.business_id
      });
    }
  }, [currentPostId, currentIsLiked, currentLikesCount, isOpen, businessName, currentPost]);

  // ========== RENDER FUNCTIONS ==========
  const renderVolumeButton = () => {
    if (!isCurrentMediaVideo()) return null;
    return (
      <button onClick={toggleMute} className="post-modal__volume-button" style={{ opacity: showVolumeButton ? 1 : 0 }} aria-label={isMuted ? 'Unmute' : 'Mute'}>
        {isMuted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    );
  };

  const renderMedia = () => {
    if (!currentPost?.media_urls || currentPost.media_urls.length === 0) {
      return <div style={{ color: 'white', textAlign: 'center' }}><div style={{ fontSize: '48px' }}>📷</div><p>No media</p></div>;
    }
    const currentMedia = getCurrentMediaUrl();
    const isVideo = isCurrentMediaVideo();
    const objectFit = getMediaObjectFit();

    if (isVideo) {
      return (
        <LazyVideo
          key={`video-${currentPostId}-${activeMediaIndex}`}
          ref={(el) => { videoRefs.current[currentPostId] = el; }}
          src={currentMedia} loop={true} autoPlay={true} muted={isMuted} playsInline
          className="post-modal__video" onLoad={updateMediaDimensions}
          onError={(e) => console.error('Video failed to load:', currentMedia, e)}
          threshold={0.5} rootMargin="0px" preload="auto"
        />
      );
    }
    return <img key={`img-${currentPostId}-${activeMediaIndex}`} ref={imgRef} src={currentMedia} alt={`${currentPost.title} - ${activeMediaIndex + 1}`} onLoad={updateMediaDimensions} style={{ width: '100%', height: '100%', objectFit }} onError={(e) => console.error('Image failed to load:', currentMedia, e)} />;
  };

  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null;
    return ReactDOM.createPortal(
      <div className="post-modal__delete-overlay" onClick={() => setShowDeleteConfirm(false)}>
        <div className="post-modal__delete-modal" onClick={(e) => e.stopPropagation()}>
          <div className="post-modal__delete-icon">⚠️</div>
          <h3 className="post-modal__delete-title">Delete Post?</h3>
          <p className="post-modal__delete-message">Are you sure you want to delete this post? This action cannot be undone.</p>
          <div className="post-modal__delete-actions">
            <button className="post-modal__delete-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button className="post-modal__delete-confirm" onClick={handleDeletePost} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderHorizontalActionButtons = () => {
    return (
      <div className="post-modal__actions-horizontal">
        <div className="post-modal__action-item">
          <button onClick={handleLike} className={`post-modal__action-btn ${currentIsLiked ? 'liked' : ''}`} aria-label={currentIsLiked ? 'Unlike' : 'Like'}>
            <svg width="28" height="28" viewBox="0 0 24 24"
              fill={currentIsLiked ? '#ed4956' : 'none'}
              stroke={currentIsLiked ? '#ed4956' : 'white'}
              strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <span className="post-modal__action-count">{currentLikesCount.toLocaleString()}</span>
        </div>
        <div className="post-modal__action-item">
          <button className="post-modal__action-btn" aria-label="Comments">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <span className="post-modal__action-count">{commentsCount.toLocaleString()}</span>
        </div>
        <div className="post-modal__action-item">
          <button onClick={handleShare} className="post-modal__action-btn" aria-label="Share">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <span className="post-modal__action-count">Share</span>
        </div>
        <div className="post-modal__action-item">
          <button onClick={handleSave} className={`post-modal__action-btn ${isSaved ? 'saved' : ''}`} aria-label={isSaved ? 'Remove from saved' : 'Save post'}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={isSaved ? '#f9c74f' : 'none'} stroke={isSaved ? '#f9c74f' : 'white'} strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <span className="post-modal__action-count">Save</span>
        </div>
        {isOwner && (
          <div className="post-modal__action-item">
            <button onClick={() => setShowDeleteConfirm(true)} className="post-modal__action-btn post-modal__delete-btn" aria-label="Delete post">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
            <span className="post-modal__action-count delete">Delete</span>
          </div>
        )}
      </div>
    );
  };

  const renderVerticalActionButtons = () => {
    return (
      <div className="post-modal__actions-vertical">
        <div className="post-modal__action-item">
          <button onClick={handleLike} className={`post-modal__action-btn ${currentIsLiked ? 'liked' : ''}`} aria-label={currentIsLiked ? 'Unlike' : 'Like'}>
            <svg width="26" height="26" viewBox="0 0 24 24"
              fill={currentIsLiked ? '#ed4956' : 'none'}
              stroke={currentIsLiked ? '#ed4956' : 'white'}
              strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <span className="post-modal__action-count">{currentLikesCount.toLocaleString()}</span>
        </div>
        <div className="post-modal__action-item">
          <button onClick={() => setShowFullComments(!showFullComments)} className="post-modal__action-btn" aria-label="Comments">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <span className="post-modal__action-count">{commentsCount.toLocaleString()}</span>
        </div>
        <div className="post-modal__action-item">
          <button onClick={handleShare} className="post-modal__action-btn" aria-label="Share">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <span className="post-modal__action-count">Share</span>
        </div>
        <div className="post-modal__action-item">
          <button onClick={handleSave} className={`post-modal__action-btn ${isSaved ? 'saved' : ''}`}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill={isSaved ? '#f9c74f' : 'none'} stroke={isSaved ? '#f9c74f' : 'white'} strokeWidth="1.8">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <span className="post-modal__action-count">Save</span>
        </div>
        {isOwner && (
          <div className="post-modal__action-item">
            <button onClick={() => setShowDeleteConfirm(true)} className="post-modal__action-btn post-modal__delete-btn">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
            <span className="post-modal__action-count delete">Delete</span>
          </div>
        )}
      </div>
    );
  };

  // ========== LOADING AND ERROR STATES ==========
  if (!isOpen) return null;
  if (!currentPost) return null;

  const hasMultipleMedia = currentPost?.media_urls && currentPost.media_urls.length > 1;
  const hasMultiplePosts = posts.length > 1;
  const postText = currentPost.content || '';
  const needsTruncation = postText.length > 100;
  const displayText = expandedText ? postText : truncateText(postText, 100);
  const hasHashtags = currentPost.hashtags && currentPost.hashtags.length > 0;

  // ========== DESKTOP LAYOUT ==========
  if (!isMobile) {
    return ReactDOM.createPortal(
      <div className="post-modal__desktop-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="post-modal__desktop-container">
          <button onClick={onClose} className="post-modal__close-btn" aria-label="Close modal">✕</button>
          {hasMultiplePosts && (
            <div className="post-modal__nav-buttons">
              <button onClick={goToPreviousPost} className="post-modal__nav-btn" aria-label="Previous post">↑</button>
              <button onClick={goToNextPost} className="post-modal__nav-btn" aria-label="Next post">↓</button>
            </div>
          )}
          <div className="post-modal__desktop-content">
            <div className="post-modal__media-section">
              {renderMedia()}
              {renderVolumeButton()}
              {hasMultipleMedia && (
                <>
                  <button onClick={handlePreviousMedia} className={`post-modal__media-nav post-modal__media-nav--left ${activeMediaIndex === 0 ? 'disabled' : ''}`} disabled={activeMediaIndex === 0} aria-label="Previous image">←</button>
                  <button onClick={handleNextMedia} className={`post-modal__media-nav post-modal__media-nav--right ${activeMediaIndex === currentPost.media_urls.length - 1 ? 'disabled' : ''}`} disabled={activeMediaIndex === currentPost.media_urls.length - 1} aria-label="Next image">→</button>
                </>
              )}
              {hasMultipleMedia && <div className="post-modal__media-counter">{activeMediaIndex + 1} / {currentPost.media_urls.length}</div>}
            </div>
            <div className="post-modal__info-section">
              <Link to={`/business/${currentPost.business_id}`} onClick={(e) => e.stopPropagation()} className="post-modal__business-link">
                <div className="post-modal__business-header">
                  <div className="post-modal__business-logo">
                    {hasBusinessLogo ? <img src={businessLogoUrl} alt={businessName} onError={() => setLogoError(true)} /> : <span>{businessInitial}</span>}
                  </div>
                  <div className="post-modal__business-info">
                    <h3 className="post-modal__business-name">{businessName}</h3>
                    <div className="post-modal__business-meta">
                      <span className="post-modal__date">{new Date(currentPost.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="post-modal__content-section">
                <h2 className="post-modal__title">{currentPost.title}</h2>
                {currentPost.content && <p className="post-modal__text">{currentPost.content}</p>}
                {hasHashtags && <div className="post-modal__hashtags">{currentPost.hashtags.map((tag, i) => <span key={i} className="post-modal__hashtag">#{tag}</span>)}</div>}
              </div>
              <div className="post-modal__comments-section">
                <CommentSection
                  key={`comments-${currentPost.id}`}
                  postId={currentPost.id}
                  postBusinessId={currentPost.business_id}
                  onCommentCountChange={(count) => setCommentsCount(count)}
                  isModal={true}
                />
              </div>
              {renderHorizontalActionButtons()}
            </div>
          </div>
          {renderDeleteConfirmModal()}
        </div>
      </div>,
      document.getElementById('modal-root') || document.body
    );
  }

  // ========== MOBILE LAYOUT ==========
  return ReactDOM.createPortal(
    <div className="post-modal__mobile-container" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {isTransitioning && <div className="post-modal__transition-overlay" />}
      <div ref={mediaContainerRef} className="post-modal__mobile-media-area">
        <div className="post-modal__mobile-media-wrapper">{renderMedia()}</div>
        <div className="post-modal__gradient-top" /><div className="post-modal__gradient-bottom" />
        <button onClick={onClose} className="post-modal__mobile-close" aria-label="Close">✕</button>
        <Link to={`/business/${currentPost.business_id}`} onClick={(e) => e.stopPropagation()} className="post-modal__mobile-business">
          <div className="post-modal__mobile-business-logo">
            {hasBusinessLogo ? <img src={businessLogoUrl} alt={businessName} onError={() => setLogoError(true)} /> : <span>{businessInitial}</span>}
          </div>
          <div className="post-modal__mobile-business-info">
            <h3 className="post-modal__mobile-business-name">{businessName}</h3>
          </div>
        </Link>
        {hasMultiplePosts && <div className="post-modal__mobile-counter">{activePostIndex + 1} / {posts.length}</div>}
        {hasMultipleMedia && (
          <div className="post-modal__mobile-media-indicators">
            {currentPost.media_urls.map((_, index) => (
              <button key={index} onClick={() => setActiveMediaIndex(index)} className={`post-modal__mobile-media-dot ${activeMediaIndex === index ? 'active' : ''}`} aria-label={`Go to media ${index + 1}`} />
            ))}
          </div>
        )}
        {renderVolumeButton()}
        <div className="post-modal__mobile-text-overlay">
          {currentPost.title && <h2 className="post-modal__mobile-title">{currentPost.title}</h2>}
          {postText && (
            <div className="post-modal__mobile-text">
              <p className="post-modal__mobile-text-content">{displayText}</p>
              {needsTruncation && !expandedText && <button onClick={() => setExpandedText(true)} className="post-modal__mobile-text-more">more</button>}
              {expandedText && <button onClick={() => setExpandedText(false)} className="post-modal__mobile-text-less">less</button>}
            </div>
          )}
          {hasHashtags && (
            <div className="post-modal__mobile-hashtags">
              {currentPost.hashtags.slice(0, 5).map((tag, i) => <span key={i} className="post-modal__mobile-hashtag">#{tag}</span>)}
              {currentPost.hashtags.length > 5 && <span className="post-modal__mobile-hashtag-more">+{currentPost.hashtags.length - 5} more</span>}
            </div>
          )}
        </div>
        <div className="post-modal__mobile-actions">{renderVerticalActionButtons()}</div>
      </div>
      {showFullComments && (
        <div className="post-modal__comments-panel">
          <div className="post-modal__comments-header">
            <h3 className="post-modal__comments-title">Comments</h3>
            <button onClick={() => setShowFullComments(false)} className="post-modal__comments-close" aria-label="Close comments">✕</button>
          </div>
          <div className="post-modal__comments-list">
            <CommentSection
              key={`comments-${currentPost.id}`}
              postId={currentPost.id}
              postBusinessId={currentPost.business_id}
              onCommentCountChange={(count) => setCommentsCount(count)}
              isModal={true}
            />
          </div>
        </div>
      )}
      {renderDeleteConfirmModal()}
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default PostModal;