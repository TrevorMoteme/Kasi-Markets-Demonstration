import React from 'react';
import './Card.css';

const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  className = '',
  onClick,
  ...props
}) => {
  const baseClass = 'ui-card';
  const variantClass = `ui-card--${variant}`;
  const paddingClass = `ui-card--padding-${padding}`;
  const clickableClass = onClick ? 'ui-card--clickable' : '';

  const classes = [
    baseClass,
    variantClass,
    paddingClass,
    clickableClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;