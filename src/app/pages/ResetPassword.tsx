import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Link } from 'react-router';
import { GraduationCap, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../lib/services';

const PASSWORD_RESET_COMPLETED_SESSION_KEY = 'auth:password-reset:completed';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [tokenValidationState, setTokenValidationState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [tokenValidationMessage, setTokenValidationMessage] = useState('');
  const [resetAlreadyCompleted, setResetAlreadyCompleted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(sessionStorage.getItem(PASSWORD_RESET_COMPLETED_SESSION_KEY));
  });
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const reason = searchParams.get('reason');
  const token =
    searchParams.get('token') ||
    searchParams.get('resetToken') ||
    searchParams.get('reset_token') ||
    '';
  const emailFromQuery =
    searchParams.get('email') ||
    searchParams.get('userEmail') ||
    searchParams.get('user_email') ||
    '';
  const resolvedEmailFromQuery = decodeURIComponent(emailFromQuery || '').trim();
  const isLinkSuccess = status === 'success';
  const initialTokenMode = isLinkSuccess ? Boolean(token) : Boolean(token && !status);
  const shouldUseTokenMode = initialTokenMode && tokenValidationState !== 'invalid';
  const canUseOtpFallback = status === 'error' && (reason === 'expired' || reason === 'invalid_token');

  const reasonMessageMap: Record<string, string> = {
    expired: 'This reset link has expired. Use the OTP sent to your email to reset your password.',
    invalid_token: 'This reset link is invalid. Use the OTP sent to your email to reset your password.',
    user_not_found: 'No user was found for this reset request. Please request a new reset link.',
  };

  const topMessage =
    resetAlreadyCompleted
      ? 'Password was already reset successfully in this session.'
      : status === 'error' && reason
      ? reasonMessageMap[reason] || 'Reset link is not valid. You can try OTP reset below.'
      : tokenValidationState === 'invalid'
      ? tokenValidationMessage || 'This reset link is no longer valid. You can continue with OTP reset below.'
      : shouldUseTokenMode
      ? 'Set a new password for your account.'
      : 'Enter your email, OTP, and new password.';

  useEffect(() => {
    if (!initialTokenMode) {
      if (tokenValidationState !== 'idle') {
        setTokenValidationState('idle');
        setTokenValidationMessage('');
      }
      return;
    }

    if (tokenValidationState !== 'idle') {
      return;
    }

    const resolvedEmail = (email || resolvedEmailFromQuery).trim();
    if (!resolvedEmail) {
      setTokenValidationState('invalid');
      setTokenValidationMessage('Reset link is missing an email. Request a new reset link or continue with OTP.');
      return;
    }

    let cancelled = false;
    setTokenValidationState('checking');

    authService
      .verifyResetToken(resolvedEmail, String(token))
      .then((result) => {
        if (cancelled) return;
        if (result?.isValid) {
          setTokenValidationState('valid');
          return;
        }
        setTokenValidationState('invalid');
        setTokenValidationMessage('This reset link has already been used or expired. Continue with OTP reset.');
      })
      .catch((error: any) => {
        if (cancelled) return;

        const rawMessage = String(error?.response?.data?.message || '').toLowerCase();
        const isUsedOrExpired =
          rawMessage.includes('used') ||
          rawMessage.includes('expired') ||
          rawMessage.includes('invalid') ||
          rawMessage.includes('token');

        setTokenValidationState('invalid');
        setTokenValidationMessage(
          isUsedOrExpired
            ? 'This reset link has already been used or expired. Continue with OTP reset.'
            : 'Unable to validate this reset link right now. Continue with OTP reset.'
        );
      });

    return () => {
      cancelled = true;
    };
  }, [initialTokenMode, tokenValidationState, email, resolvedEmailFromQuery, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetAlreadyCompleted) {
      toast.error('Password has already been reset. Please log in.');
      navigate('/login', { replace: true });
      return;
    }

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
        const resolvedEmail = (email || resolvedEmailFromQuery).trim();

        if (!resolvedEmail) {
          toast.error('Please enter your email address');
          return;
        }

        await authService.resetPassword({
          email: resolvedEmail,
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

      sessionStorage.setItem(PASSWORD_RESET_COMPLETED_SESSION_KEY, '1');
      setResetAlreadyCompleted(true);
      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/login', { replace: true });
    } catch (error) {
      const rawMessage = String((error as any)?.response?.data?.message || '').toLowerCase();
      const isUsedOrExpired =
        rawMessage.includes('used') ||
        rawMessage.includes('expired') ||
        rawMessage.includes('invalid') ||
        rawMessage.includes('token');

      if (shouldUseTokenMode && isUsedOrExpired) {
        setTokenValidationState('invalid');
        setTokenValidationMessage('This reset link has already been used or expired. Continue with OTP reset.');
        toast.error('This reset link is no longer valid. Please continue with OTP reset.');
        return;
      }

      toast.error('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendReset = async () => {
    const resolvedEmail = (email || resolvedEmailFromQuery).trim();
    if (!resolvedEmail) {
      toast.error('Email is required to resend reset instructions.');
      return;
    }

    setResendLoading(true);
    try {
      const response = await authService.resendResetPassword({
        email: resolvedEmail,
        resetUrl: `${window.location.origin}/reset-password`,
        redirectUrl: `${window.location.origin}/reset-password`,
        frontendUrl: window.location.origin,
      });
      const sent = Boolean(response?.resetEmailSent);
      toast.success(sent ? 'A new OTP and reset link have been sent to your email.' : 'Reset instructions were reissued.');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to resend reset instructions. Please try again.';
      toast.error(message);
    } finally {
      setResendLoading(false);
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
          {resetAlreadyCompleted && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-900">
              <p>Password reset is already complete for this session.</p>
              <p className="mt-1">
                <button
                  type="button"
                  onClick={() => navigate('/login', { replace: true })}
                  className="text-green-700 font-medium hover:text-green-800"
                >
                  Continue to login
                </button>
                {' '}or{' '}
                <Link
                  to="/forgot-password"
                  onClick={() => {
                    sessionStorage.removeItem(PASSWORD_RESET_COMPLETED_SESSION_KEY);
                    setResetAlreadyCompleted(false);
                  }}
                  className="text-green-700 font-medium hover:text-green-800"
                >
                  start a new reset request
                </Link>
              </p>
            </div>
          )}

          {tokenValidationState === 'checking' && shouldUseTokenMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              Validating reset link...
            </div>
          )}

          {tokenValidationState === 'invalid' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
              <p>{tokenValidationMessage || 'This reset link is no longer valid. Continue with OTP reset below.'}</p>
              <div className="mt-2 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={handleResendReset}
                  disabled={resendLoading}
                  className="text-left text-green-700 font-medium hover:text-green-800 disabled:opacity-50"
                >
                  {resendLoading ? 'Resending reset instructions...' : 'Resend OTP/Reset Link'}
                </button>
                <p>
                  Need a different email?{' '}
                  <Link to="/forgot-password" className="text-green-700 font-medium hover:text-green-800">
                    Request with another address
                  </Link>
                </p>
              </div>
            </div>
          )}

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
                    disabled={resetAlreadyCompleted}
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
                    disabled={resetAlreadyCompleted}
                  />
                </div>
              </>
            )}

            {shouldUseTokenMode && (
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
                  readOnly={Boolean(resolvedEmailFromQuery)}
                  disabled={resetAlreadyCompleted}
                />
              </div>
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
                  disabled={resetAlreadyCompleted}
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
                  disabled={resetAlreadyCompleted}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || resetAlreadyCompleted}
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
