// src/pages/post/FeedSkeleton.js - COMPLETE "COSMIC PURPLE" VERSION
import React from 'react';
import './FeedSkeleton.css';

const FeedSkeleton = ({ count = 5, variant = 'default' }) => {
  return (
    <div className={`feed-skeleton feed-skeleton--${variant}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`feed-skeleton__card feed-skeleton__card--${variant}`}>
          <div className="feed-skeleton__header">
            <div className="feed-skeleton__avatar"></div>
            <div className="feed-skeleton__info">
              <div className="feed-skeleton__line feed-skeleton__line--name"></div>
              <div className="feed-skeleton__line feed-skeleton__line--distance"></div>
            </div>
          </div>
          <div className="feed-skeleton__image"></div>
          <div className="feed-skeleton__content">
            <div className="feed-skeleton__line feed-skeleton__line--title"></div>
            <div className="feed-skeleton__line feed-skeleton__line--subtitle"></div>
            <div className="feed-skeleton__line feed-skeleton__line--subtitle"></div>
          </div>
          <div className="feed-skeleton__footer">
            <div className="feed-skeleton__line feed-skeleton__line--actions"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(FeedSkeleton);