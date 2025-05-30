import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-cdo-red text-white hover:bg-red-700 focus:ring-cdo-red shadow-sm hover:shadow-md',
    secondary:
      'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 shadow-sm hover:shadow-md',
    outline:
      'bg-transparent text-cdo-red border border-cdo-red hover:bg-cdo-red hover:text-white focus:ring-cdo-red hover:shadow-md',
    ghost:
      'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const spinnerSizes = {
    sm: 'sm',
    md: 'sm',
    lg: 'md',
    xl: 'lg',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <LoadingSpinner size={spinnerSizes[size]} className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;
