import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react'; // Icon for warning

const UnauthorizedPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="relative p-8 text-center bg-white rounded-lg shadow-xl dark:bg-gray-800 max-w-md mx-auto">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <ShieldAlert className="w-24 h-24 text-red-500" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Access Denied
        </h1>
        <h2 className="mt-2 text-xl font-semibold text-red-600 dark:text-red-400">
          403 Forbidden
        </h2>

        {/* Message */}
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          You do not have the necessary permissions to access this page.
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          We saw what were you trying to do there! 😏
        </p>

        {/* Action Button */}
        <div className="mt-8">
          <Link
            to="/" // Link to your home page
            className="inline-block px-6 py-3 font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          >
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;