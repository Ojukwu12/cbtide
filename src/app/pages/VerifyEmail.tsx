import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const decodeQueryValue = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getVerificationAttemptKey = (token: string, email: string): string => {
  return `verify-email-attempt:${token}:${email}`;
};

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail } = useAuth();
  
  const rawToken = searchParams.get('token');
  const rawEmail = searchParams.get('email');
  const token = decodeQueryValue(rawToken);
  const email = decodeQueryValue(rawEmail);

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setErrorMessage('No verification token or email provided');
      return;
    }

    const attemptKey = getVerificationAttemptKey(token, email);
    const existingAttemptState = sessionStorage.getItem(attemptKey);

    if (existingAttemptState === 'success') {
      setStatus('success');
      return;
    }

    if (existingAttemptState === 'terminal-error') {
      setStatus('error');
      setErrorMessage('This verification link has already failed. Please request a new link.');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token, email);
        sessionStorage.setItem(attemptKey, 'success');
        setStatus('success');
        setTimeout(() => navigate(`/login${location.search}`), 3000);
      } catch (error: any) {
        setStatus('error');
        const statusCode = Number(error?.response?.status || 0);
        if (statusCode === 400 || statusCode === 401 || statusCode === 403 || statusCode === 404 || statusCode === 410 || statusCode === 422) {
          sessionStorage.setItem(attemptKey, 'terminal-error');
        }
        setErrorMessage(error.response?.data?.message || 'Email verification failed');
      }
    };

    verify();
  }, [token, email, verifyEmail, navigate, location.search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h1>
              <p className="text-gray-600">Please wait while we verify your email</p>
              {email && <p className="text-sm text-gray-500 mt-2">{email}</p>}
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-4">Your email has been successfully verified</p>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <button
                onClick={() => navigate(`/login${location.search}`)}
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
