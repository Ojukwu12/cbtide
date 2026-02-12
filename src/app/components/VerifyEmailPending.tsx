import { useState } from 'react';
import { Link } from 'react-router';
import { GraduationCap, Mail, ArrowRight, CheckCircle } from 'lucide-react';

interface VerifyEmailPendingProps {
  email: string;
}

export function VerifyEmailPending({ email }: VerifyEmailPendingProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      // TODO: Call resendVerificationEmail API
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">Confirm your email address to complete registration</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-4">
              We've sent a verification link to:
            </p>
            <p className="text-lg font-semibold text-green-600 mb-6 break-all">{email}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                Click the link in the email to verify your account and activate your profile.
              </p>
            </div>
          </div>

          {resendSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                Verification email resent successfully
              </p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <p className="text-sm text-gray-700">Check your inbox or spam folder</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <p className="text-sm text-gray-700">Click the verification link</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <p className="text-sm text-gray-700">You'll be able to log in</p>
            </div>
          </div>

          <button
            onClick={handleResendEmail}
            disabled={resendLoading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {resendLoading ? 'Resending...' : 'Resend Verification Email'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Already verified your email?{' '}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <p className="text-xs text-center text-gray-500 mt-6">
          Didn't receive an email? Check your spam folder or try resending
        </p>
      </div>
    </div>
  );
}
