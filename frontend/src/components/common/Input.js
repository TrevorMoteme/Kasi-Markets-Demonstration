import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`input-container ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`input ${error ? 'input--error' : ''} ${disabled ? 'input--disabled' : ''} ${className}`}
        disabled={disabled}
        required={required}
        {...props}
      />
      {(error || helperText) && (
        <div className="input-message">
          {error && <span className="input-error">{error}</span>}
          {!error && helperText && <span className="input-helper">{helperText}</span>}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
