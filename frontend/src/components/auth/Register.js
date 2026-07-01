import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import { registerValidation } from '../../utils/validation';
import './Register.css';

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

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate each field
    Object.keys(registerValidation).forEach(field => {
      const validation = registerValidation[field];
      const value = formData[field];

      if (validation.required && !value) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      } else if (value && validation.validate && !validation.validate(value)) {
        newErrors[field] = validation.message;
      }
    });

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
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
      await register(registerData);

      showToast('Registration successful! Please check your email for verification.', 'success');
      navigate('/login');
    } catch (error) {
      showToast(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <div className="register-logo">KASI</div>
            <h1 className="register-title">Create Account</h1>
            <p className="register-subtitle">
              Join KASI to discover local businesses and connect with your community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-form__section">
              <div className="register-form__section-header">
                <h2 className="register-form__section-title">Account Information</h2>
              </div>

              <div className="register-form__row">
                <div className="register-form__input-group">
                  <label className="register-form__label">
                    Username
                    <span className="register-form__label-required"> *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className={`register-form__input ${errors.username ? 'register-form__input--error' : ''}`}
                    placeholder="Enter your username"
                    required
                  />
                  {errors.username && (
                    <div className="register-form__error">{errors.username}</div>
                  )}
                </div>
              </div>

              <div className="register-form__row">
                <div className="register-form__input-group">
                  <label className="register-form__label">
                    Email Address
                    <span className="register-form__label-required"> *</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`register-form__input ${errors.email ? 'register-form__input--error' : ''}`}
                    placeholder="Enter your email"
                    required
                  />
                  {errors.email && (
                    <div className="register-form__error">{errors.email}</div>
                  )}
                </div>
              </div>

              <div className="register-form__grid">
                <div className="register-form__row">
                  <div className="register-form__input-group">
                    <label className="register-form__label">
                      Password
                      <span className="register-form__label-required"> *</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={`register-form__input ${errors.password ? 'register-form__input--error' : ''}`}
                      placeholder="Create a password"
                      required
                    />
                    {errors.password && (
                      <div className="register-form__error">{errors.password}</div>
                    )}
                  </div>
                </div>

                <div className="register-form__row">
                  <div className="register-form__input-group">
                    <label className="register-form__label">
                      Confirm Password
                      <span className="register-form__label-required"> *</span>
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className={`register-form__input ${errors.confirmPassword ? 'register-form__input--error' : ''}`}
                      placeholder="Confirm your password"
                      required
                    />
                    {errors.confirmPassword && (
                      <div className="register-form__error">{errors.confirmPassword}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="register-form__section">
              <div className="register-form__section-header">
                <h2 className="register-form__section-title">Account Type</h2>
              </div>

              <p className="register-form__section-description">
                Choose the account type that best fits your needs
              </p>

              <div className="register-form__user-type-options">
                <label className={`register-form__user-type-option ${formData.user_type === 'customer' ? 'register-form__user-type-option--selected' : ''}`}>
                  <input
                    type="radio"
                    name="user_type"
                    value="customer"
                    checked={formData.user_type === 'customer'}
                    onChange={(e) => handleChange('user_type', e.target.value)}
                    className="register-form__user-type-input"
                  />
                  <div className="register-form__user-type-card">
                    <div className="register-form__user-type-icon">👤</div>
                    <div className="register-form__user-type-details">
                      <h3 className="register-form__user-type-title">Customer</h3>
                      <p className="register-form__user-type-description">
                        Discover businesses, follow favorites, and engage with content
                      </p>
                    </div>
                    {formData.user_type === 'customer' && (
                      <div className="register-form__user-type-check">✓</div>
                    )}
                  </div>
                </label>

                <label className={`register-form__user-type-option ${formData.user_type === 'business_owner' ? 'register-form__user-type-option--selected' : ''}`}>
                  <input
                    type="radio"
                    name="user_type"
                    value="business_owner"
                    checked={formData.user_type === 'business_owner'}
                    onChange={(e) => handleChange('user_type', e.target.value)}
                    className="register-form__user-type-input"
                  />
                  <div className="register-form__user-type-card">
                    <div className="register-form__user-type-icon">🏢</div>
                    <div className="register-form__user-type-details">
                      <h3 className="register-form__user-type-title">Business Owner</h3>
                      <p className="register-form__user-type-description">
                        Create business profile, post content, and connect with customers
                      </p>
                    </div>
                    {formData.user_type === 'business_owner' && (
                      <div className="register-form__user-type-check">✓</div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="register-form__actions">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="register-form__submit-btn"
              >
                Create Account
              </Button>
            </div>
          </form>

          <div className="register-footer">
            <p className="register-footer__text">
              Already have an account? <Link to="/login" className="register-footer__link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;