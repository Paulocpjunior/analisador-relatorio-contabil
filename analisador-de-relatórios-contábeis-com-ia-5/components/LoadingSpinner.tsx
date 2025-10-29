import React from 'react';

interface LoadingSpinnerProps {
    message: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col justify-center items-center my-8 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      {message && <p className="text-blue-100">{message}</p>}
    </div>
  );
};