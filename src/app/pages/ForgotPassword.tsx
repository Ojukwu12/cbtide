import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { GraduationCap, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../lib/services';
import { formatCooldownCountdown, parseCooldownSeconds } from '../lib/cooldown';
import { useCooldownTimer } from '../hooks/useCooldownTimer';

const PASSWORD_RESET_COMPLETED_SESSION_KEY = 'auth:password-reset:completed';

const extractResetCooldownSeconds = (payload: any): number | undefined => {
  const data = payload && typeof payload === 'object' ? payload : {};
  const details = data?.details && typeof data.details === 'object' ? data.details : {};
  const combined = { ...data, ...details };
  return parseCooldownSeconds(combined?.resetEmailCooldownSeconds);
};

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const {
    secondsRemaining: resetCooldownSeconds,
    isCooldownKnown,
    setSecondsRemaining: setResetCooldownSeconds,
    setCooldownKnown: setIsCooldownKnown,
    setCooldownFromServer,
  } = useCooldownTimer({
    storageKey: normalizedEmail ? `auth:reset-cooldown:${normalizedEmail}` : undefined,
  });
  const [resetAlreadyCompleted, setResetAlreadyCompleted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(sessionStorage.getItem(PASSWORD_RESET_COMPLETED_SESSION_KEY));
  });

  const startNewResetRequest = () => {
    sessionStorage.removeItem(PASSWORD_RESET_COMPLETED_SESSION_KEY);
    setResetAlreadyCompleted(false);
    setEmail('');
    setEmailSent(false);
    setResetCooldownSeconds(0);
    setIsCooldownKnown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.forgotPassword({
        email,
        resetUrl: `${window.location.origin}/reset-password`,
        redirectUrl: `${window.location.origin}/reset-password`,
        frontendUrl: window.location.origin,
      });
      setEmailSent(true);
      setResetCooldownSeconds(0);
      setIsCooldownKnown(true);
      toast.success('Password reset instructions sent. Kindly wait a few minutes and check your inbox/spam folder.');
    } catch (error: any) {
      const cooldownSeconds = extractResetCooldownSeconds(error?.response?.data);
      if (cooldownSeconds !== undefined) {
        setCooldownFromServer(cooldownSeconds);
      }
      if (Number(error?.response?.status || 0) === 429) {
        setEmailSent(true);
      }
      const message = error?.response?.data?.message || 'Failed to send reset email. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendReset = async () => {
    const resolvedEmail = String(email || '').trim();
    if (!resolvedEmail) {
      toast.error('Email is required to resend reset instructions.');
      return;
    }

    if (resetCooldownSeconds > 0) {
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
      const cooldownSeconds = extractResetCooldownSeconds(response);
      if (cooldownSeconds !== undefined) {
        setCooldownFromServer(cooldownSeconds);
      } else {
        setResetCooldownSeconds(0);
        setIsCooldownKnown(true);
      }
      toast.success('Password reset email sent. Kindly wait a few minutes and check your inbox/spam folder.');
    } catch (error: any) {
      const cooldownSeconds = extractResetCooldownSeconds(error?.response?.data);
      if (cooldownSeconds !== undefined) {
        setCooldownFromServer(cooldownSeconds);
      }
      const message = error?.response?.data?.message || 'Failed to resend reset instructions. Please try again.';
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  const resendDisabled = resendLoading || resetCooldownSeconds > 0;

  const resetCooldownMessage = useMemo(() => {
    if (resetCooldownSeconds > 0) {
      return `Resend available in ${formatCooldownCountdown(resetCooldownSeconds)}`;
    }
    if (!isCooldownKnown) {
      return 'Cooldown is unknown. Retry action to get the latest cooldown from the server.';
    }
    return 'You can resend now.';
  }, [isCooldownKnown, resetCooldownSeconds]);

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-gray-600 mb-6">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Kindly wait a few minutes and check your inbox/spam folder.
            </p>

            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-gray-600">{resetCooldownMessage}</p>
              <button
                type="button"
                onClick={handleResendReset}
                disabled={resendDisabled}
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
              >
                {resendLoading ? 'Resending...' : 'Resend OTP/Reset Link'}
              </button>
              <Link
                to={`/reset-password?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Continue to Reset Password
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resetAlreadyCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Already Reset</h1>
            <p className="text-gray-600">Your password reset was already completed in this session.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="flex flex-col items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Continue to Login
              </Link>
              <button
                type="button"
                onClick={startNewResetRequest}
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                Request New Reset Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">Enter your email to reset your password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="student@university.edu.ng"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
