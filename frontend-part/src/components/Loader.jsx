import React from 'react';

const Loader = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-gray-500 text-sm">{text}</p>
  </div>
);

export default Loader;
