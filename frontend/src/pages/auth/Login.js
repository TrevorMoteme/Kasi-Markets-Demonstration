import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { loginValidation } from '../../utils/validation';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/feed';

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

    Object.keys(loginValidation).forEach(field => {
      const validation = loginValidation[field];
      const value = formData[field];

      if (validation.required && !value) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      } else if (value && validation.validate && !validation.validate(value)) {
        newErrors[field] = validation.message;
      }
    });

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
      const response = await login(formData);

      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      showToast('Welcome back! ✨', 'success');
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      showToast(errorMessage, 'error');

      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = () => {
    showToast('Passkey authentication coming soon! 🔑', 'info');
  };

  const handleGoogleLogin = () => {
    showToast('Google Sign-In coming soon! 🚀', 'info');
  };

  const handleAppleLogin = () => {
    showToast('Apple Sign-In coming soon! 🚀', 'info');
  };

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
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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
                  autoFocus
                  inputMode="email"
                />
                {errors.email && (
                  <div className="auth-form__error">{errors.email}</div>
                )}
              </div>
            </div>

            <div className="auth-form__row">
              <div className="auth-form__input-group">
                <label className="auth-form__label">Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`auth-form__input ${errors.password ? 'auth-form__input--error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <div className="auth-form__error">{errors.password}</div>
                )}
              </div>
            </div>

            <div className="auth-form__options--between">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                Show password
              </label>
              <Link to="/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-button auth-button--primary"
              disabled={loading}
            >
              {loading && <span className="auth-button__spinner" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>

          <div className="auth-social">
            <button className="auth-social__btn" onClick={handleGoogleLogin}>
              G
            </button>
            <button className="auth-social__btn" onClick={handleAppleLogin}>
              🍎
            </button>
            <button className="auth-social__btn" onClick={handlePasskeyLogin}>
              🔑
            </button>
          </div>

          <div className="auth-footer">
            <p className="auth-footer__text">
              Don't have an account?{' '}
              <Link to="/register" className="auth-footer__link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


