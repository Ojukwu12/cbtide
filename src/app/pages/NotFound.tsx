import { useNavigate, useLocation } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-green-600">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            {isAdminPath 
              ? "The admin page you're looking for doesn't exist. Please check the URL or use the navigation."
              : "Sorry, the page you're looking for doesn't exist or has been moved."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(isAdminPath ? '/admin' : '/dashboard')}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            {isAdminPath ? 'Back to Admin' : 'Back to Home'}
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
