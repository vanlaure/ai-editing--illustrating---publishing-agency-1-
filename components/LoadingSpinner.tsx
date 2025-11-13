import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin`} />
      {message && (
        <p className="mt-2 text-sm text-brand-text-secondary animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  children,
}) => {
  if (!isVisible) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
};