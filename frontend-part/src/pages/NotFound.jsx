import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-9xl font-extrabold text-gray-200 select-none">404</p>
        <h1 className="text-2xl font-bold text-gray-700 mt-4">Page Not Found</h1>
        <p className="text-gray-500 mt-2 text-sm">The page you're looking for doesn't exist.</p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={() => navigate(-1)}
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-100 transition text-sm">
            ← Go Back
          </button>
          <Link to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition text-sm">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
