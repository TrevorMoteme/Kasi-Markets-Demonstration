import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessService } from '../../services/business';
import './StoriesBar.css';

const StoriesBar = ({
  stories = [],
  popularPosts = [],
  loading = false
}) => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [businessImages, setBusinessImages] = useState({});

  // ONLY use popularPosts - NO mock stories fallback
  const storyItems = useMemo(() => {
    // Only use popular posts from API
    if (popularPosts && popularPosts.length > 0) {
      return popularPosts.slice(0, 10).map((post, index) => {
        const businessName = post.business_name ||
                            post.business?.name ||
                            post.businesses?.name ||
                            'Business';

        const businessId = post.business_id || post.business?.id || post.businesses?.id;

        return {
          id: `story-${businessId || post.id || index}`,
          businessId: businessId,
          postId: post.id,
          username: businessName.length > 15 ? businessName.substring(0, 12) + '...' : businessName,
          business_background_picture_url: post.business_background_picture_url,
          business_background_picture: post.business_background_picture,
          background_picture_url: post.background_picture_url,
          business_logo: post.business_logo,
          business_logo_url: post.business_logo_url,
          businesses: post.businesses,
          business: post.business,
          isPopular: index < 3,
          trendingRank: index + 1,
          hasStory: true,
          isViewed: false
        };
      });
    }

    // Return empty array if no popular posts - NOTHING shows
    return [];
  }, [popularPosts]);

  // Fetch missing business images
  const fetchBusinessImages = useCallback(async () => {
    const missingItems = storyItems.filter(item =>
      item.businessId &&
      !businessImages[item.businessId] &&
      !item.business_background_picture_url &&
      !item.business_background_picture &&
      !item.background_picture_url &&
      !item.business_logo
    );

    if (missingItems.length === 0) return;

    const uniqueIds = [...new Set(missingItems.map(item => item.businessId))];

    for (const id of uniqueIds) {
      try {
        const business = await businessService.getBusinessById(id);
        if (business) {
          setBusinessImages(prev => ({
            ...prev,
            [id]: {
              background_picture_url: business.background_picture_url,
              logo_url: business.logo_url,
              logo: business.logo
            }
          }));
        }
      } catch (error) {
        console.warn(`Failed to fetch business ${id}:`, error);
      }
    }
  }, [storyItems, businessImages]);

  useEffect(() => {
    if (storyItems.length > 0) {
      fetchBusinessImages();
    }
  }, [storyItems, fetchBusinessImages]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleStoryClick = (story) => {
    if (story.postId) {
      navigate(`/post/${story.postId}`);
    } else if (story.businessId) {
      navigate(`/business/${story.businessId}`);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [storyItems]);

  const resolveMediaUrl = (url) => {
    if (!url || url === 'null' || url === 'undefined') return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const cleanUrl = url.replace(/^\/+/, '');
    if (cleanUrl.startsWith('media/')) return `${baseUrl}/${cleanUrl}`;
    if (cleanUrl.startsWith('uploads/')) return `${baseUrl}/${cleanUrl}`;
    return `${baseUrl}/media/${cleanUrl.split('/').pop()}`;
  };

  const getStoryImage = (story) => {
    if (story.business_background_picture_url) {
      return resolveMediaUrl(story.business_background_picture_url);
    }
    if (story.business_background_picture) {
      return resolveMediaUrl(story.business_background_picture);
    }
    if (story.background_picture_url) {
      return resolveMediaUrl(story.background_picture_url);
    }
    if (story.businesses?.background_picture_url) {
      return resolveMediaUrl(story.businesses.background_picture_url);
    }
    if (story.business_logo) {
      return resolveMediaUrl(story.business_logo);
    }
    if (story.business_logo_url) {
      return resolveMediaUrl(story.business_logo_url);
    }
    if (story.business?.logo_url) {
      return resolveMediaUrl(story.business.logo_url);
    }

    if (story.businessId && businessImages[story.businessId]) {
      const business = businessImages[story.businessId];
      if (business.background_picture_url) {
        return resolveMediaUrl(business.background_picture_url);
      }
      if (business.logo_url) {
        return resolveMediaUrl(business.logo_url);
      }
      if (business.logo) {
        return resolveMediaUrl(business.logo);
      }
    }

    return null;
  };

  // Show loading skeleton only while loading and no items
  if (loading && storyItems.length === 0) {
    return (
      <div className="ig-stories-bar-loading">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="ig-story-skeleton"></div>
        ))}
      </div>
    );
  }

  // Don't render anything if no popular posts
  if (storyItems.length === 0) return null;

  return (
    <div className="ig-stories-bar">
      {showLeftArrow && (
        <button className="ig-story-arrow ig-story-arrow-left" onClick={() => scroll('left')}>
          ‹
        </button>
      )}
      <div className="ig-stories-container" ref={scrollRef}>
        {storyItems.map((story, index) => {
          const storyImage = getStoryImage(story);
          const businessInitial = story.username ? story.username.charAt(0).toUpperCase() : 'B';
          const isTrending = story.isPopular || story.trendingRank <= 3;

          return (
            <div
              key={story.id}
              className="ig-story-item"
              onClick={() => handleStoryClick(story)}
            >
              <div className={`ig-story-ring ${story.isViewed ? 'ig-viewed' : ''}`}>
                <div className="ig-story-ring-inner">
                  {storyImage ? (
                    <img
                      src={storyImage}
                      alt={story.username}
                      className="ig-story-banner"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className = 'ig-story-banner-placeholder';
                        placeholder.textContent = businessInitial;
                        e.target.parentElement.appendChild(placeholder);
                      }}
                    />
                  ) : (
                    <div className="ig-story-banner-placeholder">
                      {businessInitial}
                    </div>
                  )}
                  {isTrending && (
                    <div className="ig-story-badge">
                      🔥
                    </div>
                  )}
                </div>
              </div>
              <span className="ig-story-username">
                {story.username}
              </span>
            </div>
          );
        })}
      </div>
      {showRightArrow && (
        <button className="ig-story-arrow ig-story-arrow-right" onClick={() => scroll('right')}>
          ›
        </button>
      )}
    </div>
  );
};

export default React.memo(StoriesBar);