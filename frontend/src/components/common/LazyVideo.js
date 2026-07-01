// LazyVideo.js - Fixed with proper error handling
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './LazyVideo.css';

const LazyVideo = forwardRef(({
  src,
  poster,
  loop = true,
  className = '',
  onLoad,
  onError,
  threshold = 0.3,
  rootMargin = '50px 0px',
  autoPlay = true,
  muted = true,
  playsInline = true,
  registerVideoElement
}, ref) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const playAttemptRef = useRef(false);

  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [userActivatedSound, setUserActivatedSound] = useState(false);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    isPlaying: () => videoRef.current ? !videoRef.current.paused : false,
    getVideo: () => videoRef.current
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoadedMetadata = () => {
    setLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = (e) => {
    console.error('Video error:', src);
    setError(true);
    if (onError) onError();
  };

  const handleEnded = () => {
    if (loop && videoRef.current && !playAttemptRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.log('Loop replay error:', e));
    }
  };

  useEffect(() => {
    if (registerVideoElement && videoRef.current) {
      registerVideoElement(videoRef.current);
    }
  }, [registerVideoElement]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !loaded || !autoPlay) return;

    if (!isVisible) {
      if (!video.paused) {
        video.pause();
      }
      return;
    }

    if (isVisible && video.paused && !playAttemptRef.current) {
      playAttemptRef.current = true;
      video.muted = !userActivatedSound;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            playAttemptRef.current = false;
          })
          .catch(err => {
            console.log('Play prevented:', err);
            playAttemptRef.current = false;
            if (!video.muted) {
              video.muted = true;
              video.play().catch(e => console.log('Still blocked:', e));
            }
          });
      }
    } else {
      playAttemptRef.current = false;
    }
  }, [isVisible, loaded, autoPlay, userActivatedSound]);

  useEffect(() => {
    playAttemptRef.current = false;
  }, [src]);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      video.muted = false;
      setUserActivatedSound(true);
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const MuteIcon = () => (
    <svg className="lazy-video__icon lazy-video__icon--mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );

  const UnmuteIcon = () => (
    <svg className="lazy-video__icon lazy-video__icon--unmute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  );

  if (!src || src === 'null' || src === 'undefined') {
    return <div className="lazy-video-error"><span>📹</span><span>Video unavailable</span></div>;
  }

  return (
    <div ref={containerRef} className={`lazy-video-container ${className} ${!loaded ? 'lazy-video--loading' : ''} ${error ? 'lazy-video--error' : ''}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        playsInline={playsInline}
        preload="auto"
        muted={muted}
        className={`lazy-video ${loaded ? 'lazy-video--loaded' : ''}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', backgroundColor: '#000' }}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onEnded={handleEnded}
      />
      {loaded && !error && (
        <button className={`lazy-video__sound-btn ${!isMuted ? 'lazy-video__sound-btn--active' : ''}`} onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <MuteIcon /> : <UnmuteIcon />}
        </button>
      )}
      {!loaded && !error && <div className="lazy-video-placeholder"><div className="lazy-video-spinner"></div><span>Loading video...</span></div>}
      {error && <div className="lazy-video-error"><span>❌</span><span>Failed to load video</span></div>}
    </div>
  );
});

LazyVideo.displayName = 'LazyVideo';

export default LazyVideo;