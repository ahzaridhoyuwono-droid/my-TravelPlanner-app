import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-5 h-5 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
      <div className="w-5 h-5 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin delay-100"></div>
      <div className="w-5 h-5 border-t-2 border-b-2 border-pink-500 rounded-full animate-spin delay-200"></div>
    </div>
  );
};