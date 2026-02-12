import { useRouteError, Link } from 'react-router';
import { AlertCircle, Home } from 'lucide-react';

export function ErrorBoundary() {
  const error = useRouteError() as any;
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          {error?.statusText || error?.message || 'An unexpected error occurred'}
        </p>
        
        {error?.status === 404 && (
          <p className="text-sm text-gray-500 mb-6">
            The page you're looking for doesn't exist.
          </p>
        )}
        
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
