import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { GraduationCap, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../lib/services';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const reason = searchParams.get('reason');
  const token = searchParams.get('token');
  const emailFromQuery = searchParams.get('email') || '';
  const resolvedEmailFromQuery = decodeURIComponent(emailFromQuery || '').trim();
  const isLinkSuccess = status === 'success';
  const shouldUseTokenMode = isLinkSuccess ? Boolean(token && resolvedEmailFromQuery) : Boolean(token && resolvedEmailFromQuery && !status);
  const canUseOtpFallback = status === 'error' && (reason === 'expired' || reason === 'invalid_token');

  const reasonMessageMap: Record<string, string> = {
    expired: 'This reset link has expired. Use the OTP sent to your email to reset your password.',
    invalid_token: 'This reset link is invalid. Use the OTP sent to your email to reset your password.',
    user_not_found: 'No user was found for this reset request. Please request a new reset link.',
  };

  const topMessage =
    status === 'error' && reason
      ? reasonMessageMap[reason] || 'Reset link is not valid. You can try OTP reset below.'
      : shouldUseTokenMode
      ? 'Set a new password for your account.'
      : 'Enter your email, OTP, and new password.';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      if (shouldUseTokenMode) {
        await authService.resetPassword({
          email: resolvedEmailFromQuery,
          token: String(token),
          newPassword: password,
        });
      } else {
        const resolvedEmail = (email || resolvedEmailFromQuery).trim();
        const resolvedOtp = otp.trim();

        if (!resolvedEmail) {
          toast.error('Please enter your email address');
          return;
        }

        if (!resolvedOtp) {
          toast.error('Please enter the OTP sent to your email');
          return;
        }

        await authService.resetPassword({
          email: resolvedEmail,
          otp: resolvedOtp,
          newPassword: password,
        });
      }

      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">{topMessage}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!shouldUseTokenMode && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email || resolvedEmailFromQuery}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                    readOnly={Boolean(resolvedEmailFromQuery) && !canUseOtpFallback}
                  />
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter the OTP from your email"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
