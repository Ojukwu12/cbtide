import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function EmailVerified() {
  const [searchParams] = useSearchParams();
  const [displayStatus, setDisplayStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [displayMessage, setDisplayMessage] = useState('');
  const navigate = useNavigate();

  const status = searchParams.get('status');
  const message = searchParams.get('message');

  useEffect(() => {
    // Validate status parameter
    if (!status || !['success', 'error'].includes(status)) {
      setDisplayStatus('error');
      setDisplayMessage('Invalid verification status');
      return;
    }

    // Set the display status
    setDisplayStatus(status as 'success' | 'error');
    setDisplayMessage(message || (status === 'success' ? 'Email verified successfully!' : 'Email verification failed'));

    // Show toast notification
    if (status === 'success') {
      toast.success(displayMessage);
    } else {
      toast.error(displayMessage);
    }

    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [status, message, navigate, displayMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          {displayStatus === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing...</h1>
              <p className="text-gray-600">Please wait while we process your email verification</p>
            </>
          )}

          {displayStatus === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-4">{displayMessage}</p>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </>
          )}

          {displayStatus === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-4">{displayMessage}</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
