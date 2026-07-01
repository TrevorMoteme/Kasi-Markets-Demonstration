import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__container">
        <div className="footer__content">
          {/* Brand Section */}
          <div className="footer__section">
            <div className="footer__brand">
              <div className="footer__logo">K</div>
              <span className="footer__title">KASI</span>
            </div>
            <p className="footer__description">
              Connecting local businesses with their communities through meaningful interactions and discoverable content.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="footer__section">
            <h3 className="footer__section-title">Platform</h3>
            <ul className="footer__links">
              <li><Link to="/feed" className="footer__link">Feed</Link></li>
              <li><Link to="/business/search" className="footer__link">Discover</Link></li>
              <li><Link to="/events" className="footer__link">Events</Link></li>
              <li><Link to="/trending" className="footer__link">Trending</Link></li>
            </ul>
          </div>

          {/* Business Links */}
          <div className="footer__section">
            <h3 className="footer__section-title">For Businesses</h3>
            <ul className="footer__links">
              <li><Link to="/business/create" className="footer__link">Get Started</Link></li>
              <li><Link to="/business/dashboard" className="footer__link">Dashboard</Link></li>
              <li><Link to="/business/analytics" className="footer__link">Analytics</Link></li>
              <li><Link to="/business/posts" className="footer__link">Manage Posts</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="footer__section">
            <h3 className="footer__section-title">Support</h3>
            <ul className="footer__links">
              <li><Link to="/help" className="footer__link">Help Center</Link></li>
              <li><Link to="/contact" className="footer__link">Contact Us</Link></li>
              <li><Link to="/privacy" className="footer__link">Privacy Policy</Link></li>
              <li><Link to="/terms" className="footer__link">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer__bottom">
          <div className="footer__copyright">
            © {currentYear} KASI Platform. All rights reserved.
          </div>
          <div className="footer__social">
            <span className="footer__social-text">Follow us:</span>
            <div className="footer__social-links">
              <a href="#" className="footer__social-link" aria-label="Twitter">
                𝕏
              </a>
              <a href="#" className="footer__social-link" aria-label="Instagram">
                📷
              </a>
              <a href="#" className="footer__social-link" aria-label="LinkedIn">
                💼
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;