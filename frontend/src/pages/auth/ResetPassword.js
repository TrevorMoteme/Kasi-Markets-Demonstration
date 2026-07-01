import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { authService } from '../../services/auth';
import { validatePassword } from '../../utils/validation';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const token = searchParams.get('token');

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      showToast('Invalid reset link', 'error');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, formData.password);
      showToast('Password reset successfully! 🎉', 'success');
      navigate('/login');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-logo-wrapper">
              <div className="auth-logo-icon">K</div>
              <span className="auth-logo-text">KASI</span>
            </div>

            <div className="auth-status">
              <div className="auth-status__icon">⚠️</div>
              <h2>Invalid Reset Link</h2>
              <p>The password reset link is invalid or has expired.</p>
              <div className="auth-status__actions">
                <button
                  className="auth-button auth-button--primary"
                  onClick={() => navigate('/forgot-password')}
                >
                  Request New Link
                </button>
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
            <h1 className="auth-title">Create New Password</h1>
            <p className="auth-subtitle">
              Your new password must be different from previously used passwords
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form__row">
              <div className="auth-form__input-group">
                <label className="auth-form__label">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`auth-form__input ${errors.password ? 'auth-form__input--error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  autoFocus
                />
                {errors.password && (
                  <div className="auth-form__error">{errors.password}</div>
                )}
              </div>
            </div>

            <div className="auth-form__row">
              <div className="auth-form__input-group">
                <label className="auth-form__label">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`auth-form__input ${errors.confirmPassword ? 'auth-form__input--error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <div className="auth-form__error">{errors.confirmPassword}</div>
                )}
              </div>
            </div>

            <div className="auth-form__options">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                Show password
              </label>
            </div>

            <button
              type="submit"
              className="auth-button auth-button--primary"
              disabled={loading}
            >
              {loading && <span className="auth-button__spinner" />}
              {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;