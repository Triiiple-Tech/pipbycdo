import React from 'react';

const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'p-6',
  ...props
}) => {
  const baseClasses =
    'bg-white rounded-xl shadow-sm border border-slate-200 transition-shadow';
  const hoverClasses = hover ? 'hover:shadow-md' : '';

  const classes = `${baseClasses} ${hoverClasses} ${padding} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
