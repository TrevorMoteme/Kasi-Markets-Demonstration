// PostCard.js - Complete with real-time business data updates (NO LIKE BUTTON)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useBusinessData } from '../../hooks/useBusinessData';
import { useQueryClient } from '@tanstack/react-query';
import LazyVideo from '../common/LazyVideo';
import { formatRelativeTime } from '../../utils/helpers';
import PostModal from './PostModal';
import './PostCard.css';

// SVG Icon Components - NO HEART ICONS
const CommentIcon = () => (
  <svg className="post-card__icon post-card__icon--comment-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ShareIcon = () => (
  <svg className="post-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const PostCard = ({
  post: initialPost,
  allPosts = [],
  currentPostIndex = 0,
  onUpdate,
  scoreData = null,
  useMiles = false,
  showDistanceBadge = true,
  className = ''
}) => {
  const { user } = useAuth();
  const { showToast } = useApp();
  const queryClient = useQueryClient();

  // Get current post data from cache (reactive)
  const cachedPost = queryClient.getQueryData(['posts', 'detail', initialPost.id]);
  const post = cachedPost || initialPost;

  // ========== CRITICAL: Get REAL-TIME business data from cache ==========
  const businessData = useBusinessData(post.business_id, {
    name: post.business_name,
    logo: post.business_logo || post.business_logo_url,
    banner: post.banner_url,
    city: post.city,
    state: post.state,
    address: post.address,
    is_verified: post.is_verified,
  });

  // Local state for UI animations only
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [carouselScrollPosition, setCarouselScrollPosition] = useState(0);
  const [carouselMaxScroll, setCarouselMaxScroll] = useState(0);
  const [logoError, setLogoError] = useState(false);

  // Refs for touch/click handling
  const carouselTrackRef = useRef(null);
  const lastTapRef = useRef(0);
  const tapTimeoutRef = useRef(null);
  const cardRef = useRef(null);

  // Update local state when post changes
  useEffect(() => {
    setLogoError(false);
  }, [post.id]);

  const resolveMediaUrl = useCallback((url) => {
    if (!url || url === 'null' || url === 'undefined') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');
    let cleanUrl = url.replace(/^\/+/, '');
    if (cleanUrl.startsWith('media/')) return `${baseUrl}/${cleanUrl}`;
    const filename = cleanUrl.split('/').pop();
    return `${baseUrl}/media/${filename}`;
  }, []);

  const isVideoUrl = useCallback((url) => {
    if (!url) return false;
    const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v', 'mpeg', 'mpg', 'ogg', 'ogv'];
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
    return videoExtensions.includes(extension);
  }, []);

  const handleShare = useCallback(async (e) => {
    e.stopPropagation();
    const shareData = {
      title: post.title || 'Check out this post',
      text: post.content || `From ${businessData.name || 'KASI'}`,
      url: `${window.location.origin}/post/${post.id}`,
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
  }, [post, businessData.name, showToast]);

  const handleCardTap = useCallback((e) => {
    const now = Date.now();
    const delta = now - lastTapRef.current;

    if (delta < 300 && delta > 0) {
      e.preventDefault();
      e.stopPropagation();
      // Like functionality removed
      lastTapRef.current = 0;
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    } else {
      lastTapRef.current = now;
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => {
        setIsModalOpen(true);
      }, 100);
    }
  }, []);

  const handleCardClick = useCallback((e) => {
    const interactiveSelectors = [
      'button', 'a', 'input', 'textarea',
      '.post-card__carousel-arrow', '.post-card__carousel-dot',
      '.post-card__business-link'
    ];
    const isInteractive = interactiveSelectors.some(selector => {
      try { return e.target.closest(selector); } catch { return false; }
    });
    if (isInteractive) return;
    handleCardTap(e);
  }, [handleCardTap]);

  const handleMediaClick = useCallback((url, index) => {
    setActiveMediaIndex(index);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    lastTapRef.current = 0;
  }, []);

  const handlePostChange = useCallback((newIndex) => {
    console.log('📢 [DEBUG POSTCARD] Post changed to index:', newIndex);
  }, []);

  const scrollCarouselLeft = (e) => {
    e.stopPropagation();
    const track = carouselTrackRef.current;
    if (track) {
      track.scrollTo({ left: track.scrollLeft - track.clientWidth, behavior: 'smooth' });
    }
  };

  const scrollCarouselRight = (e) => {
    e.stopPropagation();
    const track = carouselTrackRef.current;
    if (track) {
      track.scrollTo({ left: track.scrollLeft + track.clientWidth, behavior: 'smooth' });
    }
  };

  const getBusinessInfo = useCallback(() => {
    return {
      id: post.business_id,
      name: businessData.name || 'Business',
      logo: businessData.logo,
      is_verified: businessData.is_verified,
    };
  }, [post.business_id, businessData.name, businessData.logo, businessData.is_verified]);

  const processedMediaUrls = useMemo(() => {
    if (!post.media_urls || post.media_urls.length === 0) return [];
    return post.media_urls.map(url => resolveMediaUrl(url)).filter(url => url !== null);
  }, [post.media_urls, resolveMediaUrl]);

  const containsVideo = useMemo(() => processedMediaUrls.some(url => isVideoUrl(url)), [processedMediaUrls, isVideoUrl]);
  const videoUrl = useMemo(() => processedMediaUrls.find(url => isVideoUrl(url)), [processedMediaUrls, isVideoUrl]);
  const imageUrls = useMemo(() => processedMediaUrls.filter(url => !isVideoUrl(url)), [processedMediaUrls, isVideoUrl]);

  useEffect(() => {
    const track = carouselTrackRef.current;
    if (!track || imageUrls.length <= 1) return;

    const updateScrollInfo = () => {
      setCarouselScrollPosition(track.scrollLeft);
      setCarouselMaxScroll(track.scrollWidth - track.clientWidth);
    };

    const handleScroll = () => {
      updateScrollInfo();
      const itemWidth = track.clientWidth;
      const newIndex = Math.round(track.scrollLeft / itemWidth);
      if (newIndex !== activeMediaIndex && newIndex >= 0 && newIndex < imageUrls.length) {
        setActiveMediaIndex(newIndex);
      }
    };

    updateScrollInfo();
    track.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateScrollInfo);
    return () => {
      track.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollInfo);
    };
  }, [imageUrls.length, activeMediaIndex]);

  const formatNumber = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDistance = useCallback((distanceKm, useMiles) => {
    if (!distanceKm && distanceKm !== 0) return null;
    if (useMiles) {
      const miles = distanceKm * 0.621371;
      if (miles < 0.1) {
        const feet = Math.round(miles * 5280);
        return `${feet} ft`;
      }
      return `${miles.toFixed(1)} mi`;
    } else {
      if (distanceKm < 1) {
        const meters = Math.round(distanceKm * 1000);
        return `${meters} m`;
      }
      return `${distanceKm.toFixed(1)} km`;
    }
  }, []);

  const renderHashtagsPreview = () => {
    if (!post.hashtags || post.hashtags.length === 0) return null;
    const displayHashtags = post.hashtags.slice(0, 3);
    return (
      <div className="post-card__hashtags-preview">
        {displayHashtags.map((tag, index) => (
          <span key={index} className="post-card__hashtag">#{tag}</span>
        ))}
        {post.hashtags.length > 3 && (
          <span className="post-card__hashtag">+{post.hashtags.length - 3}</span>
        )}
      </div>
    );
  };

  const distanceData = post.distance_km || scoreData?.distance_km;
  const formattedDistance = distanceData !== undefined ? formatDistance(distanceData, useMiles) : null;

  const renderBusinessProfileOverlay = () => {
    const businessInfo = getBusinessInfo();
    const businessName = businessInfo.name;
    const businessInitial = businessName ? businessName.charAt(0).toUpperCase() : 'B';
    const businessLogo = businessInfo.logo;
    const hasLogo = !!businessLogo && !logoError;

    return (
      <div className="post-card__overlay-top">
        <div className="post-card__business-info-wrapper">
          <div className="post-card__business-info">
            <div className="post-card__logo-wrapper">
              {hasLogo ? (
                <img
                  src={resolveMediaUrl(businessLogo)}
                  alt={`${businessName} logo`}
                  className="post-card__business-logo"
                  onError={() => setLogoError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="post-card__business-logo-placeholder">{businessInitial}</div>
              )}
            </div>
            <div className="post-card__business-details">
              <div className="post-card__business-name-wrapper">
                <Link to={`/business/${post.business_id}`} className="post-card__business-link" onClick={(e) => e.stopPropagation()}>
                  {businessName}
                </Link>
                {businessInfo.is_verified && <span className="post-card__verified-badge">✓ Verified</span>}
              </div>
              <div className="post-card__meta">
                <span className="post-card__time">{formatRelativeTime(post.created_at)}</span>
              </div>
            </div>
          </div>

          {showDistanceBadge && formattedDistance && (
            <div className="post-card__distance-wrapper">
              <div className="post-card__distance-badge-modern">
                <span className="distance-icon">📍</span>
                <span>{formattedDistance}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 767 : false;

  // ===== DESKTOP RENDER =====
  if (!isMobile) {
    return (
      <>
        <article
          ref={cardRef}
          className={`post-card ${className}`}
          onClick={handleCardClick}
        >
          <div className="post-card__media-container">
            {containsVideo && videoUrl ? (
              <div className="post-card__video-container">
                <LazyVideo
                  src={videoUrl}
                  loop={true}
                  autoPlay={true}
                  muted={true}
                  playsInline
                  className="post-card__video"
                />
              </div>
            ) : imageUrls.length > 0 ? (
              <div className="post-card__carousel-container">
                {imageUrls.length > 1 && carouselScrollPosition > 0 && (
                  <button
                    className="post-card__carousel-arrow post-card__carousel-arrow--left"
                    onClick={scrollCarouselLeft}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                )}
                <div className="post-card__carousel-track" ref={carouselTrackRef}>
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="post-card__carousel-item" onClick={() => handleMediaClick(url, idx)}>
                      <img src={url} alt={`Post media ${idx + 1}`} className="post-card__carousel-media" loading="lazy" />
                    </div>
                  ))}
                </div>
                {imageUrls.length > 1 && carouselScrollPosition < carouselMaxScroll - 10 && (
                  <button
                    className="post-card__carousel-arrow post-card__carousel-arrow--right"
                    onClick={scrollCarouselRight}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                )}
                {imageUrls.length > 1 && (
                  <div className="post-card__carousel-dots" role="tablist">
                    {imageUrls.map((_, idx) => (
                      <button
                        key={idx}
                        className={`post-card__carousel-dot ${activeMediaIndex === idx ? 'active' : ''}`}
                        onClick={() => {
                          setActiveMediaIndex(idx);
                          const track = carouselTrackRef.current;
                          if (track) track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
                        }}
                        aria-label={`Go to image ${idx + 1}`}
                        aria-selected={activeMediaIndex === idx}
                        role="tab"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="post-card__video-container">
                <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>No media</div>
              </div>
            )}

            {renderBusinessProfileOverlay()}

            <div className="post-card__overlay-bottom">
              <div className="post-card__actions-overlay">
                <button
                  className="post-card__action-btn"
                  aria-label="Comments"
                >
                  <CommentIcon />
                  <span className="post-card__action-count">{formatNumber(post.comments_count || 0)}</span>
                </button>
                <button
                  className="post-card__action-btn"
                  onClick={handleShare}
                  aria-label="Share post"
                >
                  <ShareIcon />
                </button>
              </div>
              {renderHashtagsPreview()}
            </div>
          </div>
        </article>

        {isModalOpen && (
          <PostModal
            key={`modal-${currentPostIndex}`}
            posts={allPosts}
            initialPostIndex={currentPostIndex}
            isOpen={isModalOpen}
            onClose={handleModalClose}
            onUpdate={() => {
              console.log('🔄 PostModal onUpdate called');
              if (onUpdate) onUpdate();
            }}
            initialLikeState={{ isLiked: post.is_liked, likesCount: post.likes_count }}
            initialSaveState={false}
            initialCommentsCount={post.comments_count}
            resolveMediaUrl={resolveMediaUrl}
            isVideoUrl={isVideoUrl}
            initialMediaIndex={activeMediaIndex}
            onPostChange={handlePostChange}
            useMiles={useMiles}
            isOwner={false}
          />
        )}
      </>
    );
  }

  // ===== MOBILE RENDER =====
  return (
    <>
      <article ref={cardRef} className={`post-card ${className}`} onClick={handleCardClick}>
        <div className="post-card__media-container">
          {containsVideo && videoUrl ? (
            <div className="post-card__video-container">
              <LazyVideo
                src={videoUrl}
                poster={null}
                loop={true}
                autoPlay={true}
                muted={true}
                playsInline
                className="post-card__video"
                threshold={0.3}
                rootMargin="50px 0px"
              />
            </div>
          ) : imageUrls.length > 0 ? (
            <div className="post-card__carousel-container">
              {imageUrls.length > 1 && carouselScrollPosition > 0 && (
                <button
                  className="post-card__carousel-arrow post-card__carousel-arrow--left"
                  onClick={scrollCarouselLeft}
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}
              <div className="post-card__carousel-track" ref={carouselTrackRef}>
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="post-card__carousel-item" onClick={() => handleMediaClick(url, idx)}>
                    <img src={url} alt={`Post media ${idx + 1}`} className="post-card__carousel-media" loading="lazy" />
                  </div>
                ))}
              </div>
              {imageUrls.length > 1 && carouselScrollPosition < carouselMaxScroll - 10 && (
                <button
                  className="post-card__carousel-arrow post-card__carousel-arrow--right"
                  onClick={scrollCarouselRight}
                  aria-label="Next image"
                >
                  ›
                </button>
              )}
              {imageUrls.length > 1 && (
                <div className="post-card__carousel-dots" role="tablist">
                  {imageUrls.map((_, idx) => (
                    <button
                      key={idx}
                      className={`post-card__carousel-dot ${activeMediaIndex === idx ? 'active' : ''}`}
                      onClick={() => {
                        setActiveMediaIndex(idx);
                        const track = carouselTrackRef.current;
                        if (track) track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
                      }}
                      aria-label={`Go to image ${idx + 1}`}
                      aria-selected={activeMediaIndex === idx}
                      role="tab"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="post-card__video-container">
              <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>No media</div>
            </div>
          )}

          {renderBusinessProfileOverlay()}

          <div className="post-card__overlay-bottom">
            <div className="post-card__actions-overlay">
              <button
                className="post-card__action-btn"
                aria-label="Comments"
              >
                <CommentIcon />
                <span className="post-card__action-count">{formatNumber(post.comments_count || 0)}</span>
              </button>
              <button
                className="post-card__action-btn"
                onClick={handleShare}
                aria-label="Share post"
              >
                <ShareIcon />
              </button>
            </div>
            {renderHashtagsPreview()}
          </div>
        </div>
      </article>

      {isModalOpen && (
        <PostModal
          key={`modal-${currentPostIndex}`}
          posts={allPosts}
          initialPostIndex={currentPostIndex}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onUpdate={() => {
            console.log('🔄 PostModal onUpdate called');
            if (onUpdate) onUpdate();
          }}
          initialLikeState={{ isLiked: post.is_liked, likesCount: post.likes_count }}
          initialSaveState={false}
          initialCommentsCount={post.comments_count}
          resolveMediaUrl={resolveMediaUrl}
          isVideoUrl={isVideoUrl}
          initialMediaIndex={activeMediaIndex}
          onPostChange={handlePostChange}
          useMiles={useMiles}
          isOwner={false}
        />
      )}
    </>
  );
};

export default PostCard;