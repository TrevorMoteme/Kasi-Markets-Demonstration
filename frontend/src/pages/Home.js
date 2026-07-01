import React, { useState, useEffect } from 'react';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate fetching posts from an API
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an actual API call
        const mockPosts = [
          {
            id: 1,
            title: 'Welcome to Our Platform',
            description: 'Discover amazing content and connect with like-minded people.',
            image: '/images/welcome.jpg',
            date: '2024-01-15',
            author: 'Admin'
          },
          {
            id: 2,
            title: 'Getting Started Guide',
            description: 'Learn how to make the most of our platform with this comprehensive guide.',
            image: '/images/guide.jpg',
            date: '2024-01-14',
            author: 'Support Team'
          },
          {
            id: 3,
            title: 'Community Updates',
            description: 'Latest news and updates from our growing community.',
            image: '/images/community.jpg',
            date: '2024-01-13',
            author: 'Community Manager'
          }
        ];

        setTimeout(() => {
          setPosts(mockPosts);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load posts. Please try again later.');
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Welcome Home</h1>
        <p>Discover and explore amazing content from our community</p>
      </div>

      <div className="posts-grid">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <img
              src={post.image}
              alt={post.title}
              className="post-image"
              onError={(e) => {
                e.target.src = '/images/placeholder.jpg';
              }}
            />
            <div className="post-content">
              <h3 className="post-title">{post.title}</h3>
              <p className="post-description">{post.description}</p>
              <div className="post-meta">
                <span>By {post.author}</span>
                <span>{new Date(post.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;






