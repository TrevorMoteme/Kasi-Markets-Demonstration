import React, { useState, useEffect } from 'react';

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching saved posts
    const fetchSavedPosts = async () => {
      try {
        // Mock data - in a real app, this would come from an API
        const mockSavedPosts = [
          {
            id: 1,
            title: 'React Best Practices 2024',
            description: 'Learn the latest React patterns and best practices for modern web development.',
            category: 'Programming',
            savedDate: '2024-01-10',
            readTime: '5 min read',
            image: '/images/react.jpg'
          },
          {
            id: 2,
            title: 'CSS Grid vs Flexbox',
            description: 'When to use CSS Grid and when to use Flexbox for your layouts.',
            category: 'Web Design',
            savedDate: '2024-01-08',
            readTime: '3 min read',
            image: '/images/css.jpg'
          },
          {
            id: 3,
            title: 'JavaScript Performance Tips',
            description: 'Optimize your JavaScript code for better performance and faster load times.',
            category: 'Programming',
            savedDate: '2024-01-05',
            readTime: '7 min read',
            image: '/images/javascript.jpg'
          }
        ];

        setTimeout(() => {
          setSavedPosts(mockSavedPosts);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, []);

  const handleUnsave = (postId) => {
    setSavedPosts(prev => prev.filter(post => post.id !== postId));
    // In a real app, you would also update the backend
  };

  const handleClearAll = () => {
    setSavedPosts([]);
    // In a real app, you would also update the backend
  };

  if (loading) {
    return (
      <div className="saved-posts-container">
        <div className="loading">Loading saved posts...</div>
      </div>
    );
  }

  return (
    <div className="saved-posts-container">
      <div className="saved-posts-header">
        <h1>Saved Posts</h1>
        {savedPosts.length > 0 && (
          <button
            className="clear-all-btn"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      {savedPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h2>No saved posts yet</h2>
          <p>Start saving interesting posts to find them easily later!</p>
        </div>
      ) : (
        <div className="saved-posts-list">
          {savedPosts.map(post => (
            <div key={post.id} className="saved-post-card">
              <img
                src={post.image}
                alt={post.title}
                className="saved-post-image"
                onError={(e) => {
                  e.target.src = '/images/placeholder.jpg';
                }}
              />

              <div className="saved-post-content">
                <div className="saved-post-meta">
                  <span className="category">{post.category}</span>
                  <span className="read-time">{post.readTime}</span>
                </div>

                <h3 className="saved-post-title">{post.title}</h3>
                <p className="saved-post-description">{post.description}</p>

                <div className="saved-post-footer">
                  <span className="saved-date">
                    Saved on {new Date(post.savedDate).toLocaleDateString()}
                  </span>
                  <button
                    className="unsave-btn"
                    onClick={() => handleUnsave(post.id)}
                  >
                    Unsave
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="saved-posts-stats">
        <p>Total saved: {savedPosts.length} posts</p>
      </div>
    </div>
  );
};

export default SavedPosts;

