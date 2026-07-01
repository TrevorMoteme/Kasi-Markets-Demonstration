import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { emailVerificationService } from '../../services/emailVerification';
import './Auth.css';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    try {
      setLoading(true);
      await emailVerificationService.verifyEmail(token);
      setStatus('success');
      showToast('Email verified successfully!', 'success');
    } catch (error) {
      setStatus('error');
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    showToast('Please try signing up again or contact support.', 'info');
  };

  const getContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="auth-status">
            <div className="auth-status__icon">✨</div>
            <h2>Verifying Your Email</h2>
            <p>Please wait while we verify your email address...</p>
            <div className="auth-status__actions">
              <button className="auth-button auth-button--secondary" disabled>
                <span className="auth-button__spinner" />
                Verifying...
              </button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="auth-status">
            <div className="auth-status__icon">✅</div>
            <h2>Email Verified!</h2>
            <p>Your email has been successfully verified. You can now access all features of KASI.</p>
            <div className="auth-status__actions">
              <button
                className="auth-button auth-button--primary"
                onClick={() => navigate('/login')}
              >
                Continue to Login →
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="auth-status">
            <div className="auth-status__icon">❌</div>
            <h2>Verification Failed</h2>
            <p>The verification link is invalid or has expired. Please request a new one.</p>
            <div className="auth-status__actions">
              <button
                className="auth-button auth-button--primary"
                onClick={resendVerification}
                disabled={loading}
              >
                {loading && <span className="auth-button__spinner" />}
                {loading ? 'Sending...' : 'Resend Verification'}
              </button>
              <button
                className="auth-button auth-button--outline"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="auth-status">
            <div className="auth-status__icon">⚠️</div>
            <h2>Invalid Link</h2>
            <p>The verification link is missing or malformed. Please check your email and try again.</p>
            <div className="auth-status__actions">
              <button
                className="auth-button auth-button--primary"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">KASI</div>
            <h1 className="auth-title">Email Verification</h1>
          </div>
          {getContent()}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
