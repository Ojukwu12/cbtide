import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../lib/services';
import { formatCooldownCountdown, parseCooldownSeconds } from '../lib/cooldown';
import { useCooldownTimer } from '../hooks/useCooldownTimer';

const extractVerificationMeta = (payload: any) => {
  const data = payload && typeof payload === 'object' ? payload : {};
  const details = data?.details && typeof data.details === 'object' ? data.details : {};
  const combined = { ...data, ...details };

  return {
    verificationEmailSent:
      typeof combined?.verificationEmailSent === 'boolean' ? combined.verificationEmailSent : undefined,
    verificationEmailCooldownSeconds: parseCooldownSeconds(combined?.verificationEmailCooldownSeconds),
    canResendVerification:
      typeof combined?.canResendVerification === 'boolean' ? combined.canResendVerification : undefined,
    resendVerificationEndpoint:
      typeof combined?.resendVerificationEndpoint === 'string' ? combined.resendVerificationEndpoint : undefined,
  };
};

export function EmailVerified() {
  const [searchParams] = useSearchParams();
  const [displayStatus, setDisplayStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [displayMessage, setDisplayMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const status = searchParams.get('status');
  const message = searchParams.get('message');
  const reason = searchParams.get('reason');
  const email = searchParams.get('email');
  const canResendFromReason = status === 'error' && (reason === 'expired' || reason === 'invalid_token');
  const {
    secondsRemaining: cooldownSeconds,
    isCooldownKnown,
    setCooldownFromServer,
  } = useCooldownTimer({
    storageKey: email ? `auth:verification-cooldown:${String(email || '').trim().toLowerCase()}` : undefined,
  });
  const [verificationEmailSentState, setVerificationEmailSentState] = useState<boolean | undefined>(undefined);
  const [canResendState, setCanResendState] = useState<boolean | undefined>(undefined);
  const [resendEndpointState, setResendEndpointState] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

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
    const resolvedMessage = message || (status === 'success' ? 'Email verified successfully!' : 'Email verification failed');
    if (status === 'success') {
      toast.success(resolvedMessage);
    } else {
      toast.error(resolvedMessage);
    }

    // Redirect to login after 3 seconds only when verification succeeds.
    if (status !== 'success') {
      return;
    }

    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [status, message, navigate]);

  const handleResendVerification = async () => {
    const resolvedEmail = String(email || '').trim();
    if (!resolvedEmail) {
      toast.error('No email provided for resend');
      return;
    }

    if (cooldownSeconds > 0 || canResendState === false) {
      return;
    }

    setResendLoading(true);
    try {
      const response = await authService.resendVerificationEmail(
        { email: resolvedEmail },
        { endpoint: resendEndpointState }
      );
      const meta = extractVerificationMeta(response);
      if (meta.verificationEmailSent !== undefined) setVerificationEmailSentState(meta.verificationEmailSent);
      if (meta.canResendVerification !== undefined) setCanResendState(meta.canResendVerification);
      if (meta.resendVerificationEndpoint) setResendEndpointState(meta.resendVerificationEndpoint);
      if (meta.verificationEmailCooldownSeconds !== undefined) {
        setCooldownFromServer(meta.verificationEmailCooldownSeconds);
      }
      setResendSuccess(true);
      toast.success('Verification email sent. Kindly wait a few minutes and check your inbox/spam folder.');
    } catch (error: any) {
      const meta = extractVerificationMeta(error?.response?.data);
      if (meta.verificationEmailSent !== undefined) setVerificationEmailSentState(meta.verificationEmailSent);
      if (meta.canResendVerification !== undefined) setCanResendState(meta.canResendVerification);
      if (meta.resendVerificationEndpoint) setResendEndpointState(meta.resendVerificationEndpoint);
      if (meta.verificationEmailCooldownSeconds !== undefined) {
        setCooldownFromServer(meta.verificationEmailCooldownSeconds);
      }
      const errorMessage = error?.response?.data?.message || 'Failed to resend verification email';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const resendDisabled = resendLoading || cooldownSeconds > 0 || canResendState === false;

  const cooldownMessage = useMemo(() => {
    if (verificationEmailSentState === true) {
      if (cooldownSeconds > 0) {
        return `Verification email sent. Kindly wait a few minutes and check your inbox/spam folder. Resend available in ${formatCooldownCountdown(cooldownSeconds)}`;
      }
      return 'Verification email sent. Kindly wait a few minutes and check your inbox/spam folder. You can resend now.';
    }
    if (cooldownSeconds > 0) {
      return `Please wait before requesting another email. Resend available in ${formatCooldownCountdown(cooldownSeconds)}`;
    }
    if (!isCooldownKnown) {
      return 'Cooldown is unknown. Retry resend to get the latest cooldown from the server.';
    }
    return 'You can resend now.';
  }, [verificationEmailSentState, cooldownSeconds, isCooldownKnown]);

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
              {canResendFromReason && email && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">{cooldownMessage}</p>
                  {resendSuccess && (
                    <p className="text-sm text-green-700 mb-2">
                      Verification email sent. Kindly wait a few minutes and check your inbox/spam folder.
                    </p>
                  )}
                  <button
                    onClick={handleResendVerification}
                    disabled={resendDisabled}
                    className="w-full mb-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {resendLoading ? 'Resending...' : 'Resend Verification Email'}
                  </button>
                </div>
              )}
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
