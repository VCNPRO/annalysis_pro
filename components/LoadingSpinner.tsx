// components/LoadingSpinner.tsx
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2 animate-pulse p-4">
      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
      <span className="text-blue-600 font-semibold text-lg">Carregant...</span>
    </div>
  );
};

export default LoadingSpinner;