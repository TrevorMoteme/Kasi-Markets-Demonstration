import React from 'react';

const MediaDebug = ({ post }) => {
  return (
    <div style={{
      background: '#ffebee',
      padding: '10px',
      margin: '10px 0',
      borderRadius: '4px',
      fontSize: '12px',
      border: '1px solid #ffcdd2'
    }}>
      <strong>Media Debug for Post {post.id}:</strong>
      <div>Media URLs: {JSON.stringify(post.media_urls)}</div>
      <div>Media Files: {JSON.stringify(post.media_files)}</div>
      <div>Full post data: {JSON.stringify(post, null, 2)}</div>
    </div>
  );
};

export default MediaDebug;