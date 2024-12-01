import React from 'react';

const Spinner = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    default: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} rounded-full border-primary border-t-transparent animate-spin`}
        role="status"
        aria-label="Cargando"
      />
    </div>
  );
};

export default Spinner;