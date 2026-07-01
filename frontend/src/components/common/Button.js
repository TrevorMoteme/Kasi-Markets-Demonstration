import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'ui-btn';
  const variantClass = `ui-btn--${variant}`;
  const sizeClass = `ui-btn--${size}`;
  const loadingClass = loading ? 'ui-btn--loading' : '';
  const disabledClass = disabled ? 'ui-btn--disabled' : '';

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    loadingClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="ui-btn__spinner" aria-hidden="true"></span>
      )}
      <span className="ui-btn__content">
        {children}
      </span>
    </button>
  );
};

export default Button;