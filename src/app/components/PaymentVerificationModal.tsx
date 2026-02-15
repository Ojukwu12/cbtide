import { useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { paymentService } from '../../lib/services';
import { toast } from 'sonner';

interface PaymentVerificationModalProps {
  reference: string;
  onSuccess: () => void;
  onError?: (error: Error) => void;
}

export function PaymentVerificationModal({
  reference,
  onSuccess,
  onError,
}: PaymentVerificationModalProps) {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [countdown, setCountdown] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Verify payment on mount
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await paymentService.verifyPayment(reference);
        
        toast.success('Payment verified successfully!');
        setStatus('success');
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || 'Failed to verify payment';
        setError(errorMessage);
        setStatus('error');
        toast.error(errorMessage);
        onError?.(err);
      }
    };

    verifyPayment();
  }, [reference, onError]);

  // Countdown timer for success state
  useEffect(() => {
    if (status !== 'success') return;

    if (countdown <= 0) {
      onSuccess();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, status, onSuccess]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setStatus('verifying');
    setError(null);
    setCountdown(5);

    try {
      const response = await paymentService.verifyPayment(reference);
      
      toast.success('Payment verified successfully!');
      setStatus('success');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to verify payment';
      setError(errorMessage);
      setStatus('error');
      toast.error(errorMessage);
      onError?.(err);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600 mb-4">
              Please wait while we confirm your transaction...
            </p>
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-sm text-gray-600">Reference: {reference}</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your payment has been verified and your plan has been updated.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">
              {error || 'Unable to verify your payment. Please try again.'}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-700">Reference: {reference}</p>
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Retry Verification
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
