import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { authService } from '../../services/auth';
import './Auth.css';

const ForgotPassword = () => {
  const { showToast } = useApp();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      showToast('Reset instructions sent! 📧', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-logo-wrapper">
              <div className="auth-logo-icon">K</div>
              <span className="auth-logo-text">KASI</span>
            </div>

            <div className="auth-status">
              <div className="auth-status__icon">📧</div>
              <h2>Check Your Email</h2>
              <p>
                We've sent reset instructions to <strong>{email}</strong>
              </p>
              <p style={{ fontSize: '13px', marginTop: '-12px', marginBottom: '24px' }}>
                Didn't receive it? Check your spam folder.
              </p>
              <div className="auth-status__actions">
                <button
                  className="auth-button auth-button--outline"
                  onClick={() => setSubmitted(false)}
                >
                  Try Different Email
                </button>
                <Link to="/login">
                  <button className="auth-button auth-button--primary">
                    Back to Login
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo-wrapper">
            <div className="auth-logo-icon">K</div>
            <span className="auth-logo-text">KASI</span>
          </div>

          <div className="auth-header">
            <h1 className="auth-title">Reset Password</h1>
            <p className="auth-subtitle">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form__row">
              <div className="auth-form__input-group">
                <label className="auth-form__label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-form__input"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  inputMode="email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-button auth-button--primary"
              disabled={loading}
            >
              {loading && <span className="auth-button__spinner" />}
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>

          <div className="auth-footer">
            <p className="auth-footer__text">
              Remember your password?{' '}
              <Link to="/login" className="auth-footer__link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;