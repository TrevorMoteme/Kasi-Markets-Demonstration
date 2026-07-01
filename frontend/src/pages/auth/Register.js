// Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'customer'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await register(registerData);

      console.log('Registration response:', response);

      // Store email for success screen
      setRegisteredEmail(formData.email);

      // Show success message
      showToast(
        response.message || 'Registration successful! Please check your email for verification.',
        'success'
      );

      // Show verification pending screen
      setRegistrationComplete(true);

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show verification pending screen after successful registration
  if (registrationComplete) {
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
              <h2>Verify Your Email</h2>
              <p>
                We've sent a verification link to <strong>{registeredEmail}</strong>
              </p>
              <p style={{ fontSize: '13px', marginTop: '8px', color: 'var(--auth-text-tertiary)' }}>
                Please check your inbox and click the link to verify your account.
              </p>
              <p style={{ fontSize: '12px', marginTop: '16px', color: 'var(--auth-text-tertiary)' }}>
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => {
                    setRegistrationComplete(false);
                    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  try again
                </button>
              </p>
              <div className="auth-status__actions">
                <button
                  className="auth-button auth-button--primary"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
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
          {/* Logo Component - Centered */}
          <div className="auth-logo-wrapper">
            <div className="auth-logo-icon">K</div>
            <span className="auth-logo-text">KASI</span>
          </div>

          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">
              Join KASI to discover local businesses
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username Field */}
            <div className="auth-form__row">
              <div className="auth-form__input-group">
                <label className="auth-form__label">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={`auth-form__input ${errors.username ? 'auth-form__input--error' : ''}`}
                  placeholder="Choose a username"
                  autoComplete="username"
                  autoFocus
                />
                {errors.username && (
                  <div className="auth-form__error">{errors.username}</div>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="auth-form__row">
              <div className="auth-form__input-group">
                <label className="auth-form__label">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`auth-form__input ${errors.email ? 'auth-form__input--error' : ''}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                />
                {errors.email && (
                  <div className="auth-form__error">{errors.email}</div>
                )}
              </div>
            </div>

            {/* Password Fields */}
            <div className="auth-form__row">
              <div className="auth-form__input-group">
                <label className="auth-form__label">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`auth-form__input ${errors.password ? 'auth-form__input--error' : ''}`}
                  placeholder="Create a password"
                  autoComplete="new-password"
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
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <div className="auth-form__error">{errors.confirmPassword}</div>
                )}
              </div>
            </div>

            {/* User Type Selection */}
            <div className="auth-form__row">
              <label className="auth-form__label">Account Type</label>
              <div className="auth-user-type">
                <button
                  type="button"
                  className={`auth-user-type__btn ${formData.user_type === 'customer' ? 'auth-user-type__btn--active' : ''}`}
                  onClick={() => handleChange('user_type', 'customer')}
                >
                  <span className="auth-user-type__icon">👤</span>
                  <span className="auth-user-type__label">Customer</span>
                </button>
                <button
                  type="button"
                  className={`auth-user-type__btn ${formData.user_type === 'business_owner' ? 'auth-user-type__btn--active' : ''}`}
                  onClick={() => handleChange('user_type', 'business_owner')}
                >
                  <span className="auth-user-type__icon">🏢</span>
                  <span className="auth-user-type__label">Business</span>
                </button>
              </div>
            </div>

            {/* Show Password Option */}
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

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-button auth-button--primary"
              disabled={loading}
            >
              {loading && <span className="auth-button__spinner" />}
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="auth-divider">or sign up with</div>

          <div className="auth-social">
            <button className="auth-social__btn" onClick={() => showToast('Google Sign-Up coming soon!', 'info')}>
              G
            </button>
            <button className="auth-social__btn" onClick={() => showToast('Apple Sign-Up coming soon!', 'info')}>
              🍎
            </button>
          </div>

          <div className="auth-footer">
            <p className="auth-footer__text">
              Already have an account?{' '}
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

export default Register;