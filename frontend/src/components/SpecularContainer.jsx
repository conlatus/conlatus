import React from 'react';
import './SpecularContainer.css';

const SpecularContainer = ({
  children,
  radius = 24,
  tint = '#ffffff',
  tintOpacity = 0.02,
  blur = 16,
  className = '',
  contentClassName = '',
  ...props
}) => {
  return (
    <div
      className={`specular-container ${className}`}
      style={{
        '--sb-radius': typeof radius === 'number' ? `${radius}px` : radius,
        '--sb-tint': tint,
        '--sb-tint-opacity': tintOpacity,
        '--sb-blur': `${blur}px`,
      }}
    >
      <div className={`specular-container__content ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default SpecularContainer;
