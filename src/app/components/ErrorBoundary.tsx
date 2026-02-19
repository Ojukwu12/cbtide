import { useRouteError, useNavigate } from 'react-router';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

export function ErrorBoundary() {
  const error = useRouteError() as any;
  const navigate = useNavigate();
  
  const is404 = error?.status === 404;
  const isDevelopment = import.meta.env.DEV;
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {is404 ? 'Page Not Found' : 'Oops! Something went wrong'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {error?.statusText || error?.message || 'An unexpected error occurred'}
        </p>
        
        {isDevelopment && error?.data && (
          <div className="bg-gray-100 rounded-lg p-3 mb-6 text-left overflow-auto max-h-32">
            <p className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-words">
              {typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)}
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
