import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { paymentService } from '../../lib/services/payment.service';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import toast from 'react-hot-toast';

export function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const reference = searchParams.get('reference');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found. Please contact support.');
        return;
      }

      try {
        console.log('Verifying payment with reference:', reference);
        const response = await paymentService.verifyPayment(reference);
        console.log('Verification response:', response);

        // Refresh user context to get updated plan
        await refreshUser();

        setStatus('success');
        setMessage('Payment successful! Your plan has been upgraded.');
        toast.success('Payment verified! Welcome to your new plan.');

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/plans');
        }, 3000);
      } catch (error: any) {
        console.error('Payment verification failed:', error);
        setStatus('error');
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Payment verification failed. Please contact support.';
        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    verifyPayment();
  }, [reference, navigate, refreshUser]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 max-w-md w-full text-center">
          {status === 'verifying' && (
            <>
              <div className="flex justify-center mb-6">
                <Loader className="w-12 h-12 text-green-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h1>
              <p className="text-gray-600">Please wait while we verify your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-900">
                  Your new plan: <span className="font-bold capitalize">{user?.plan}</span>
                </p>
              </div>
              <p className="text-sm text-gray-500">Redirecting to Plans page in 3 seconds...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <AlertCircle className="w-16 h-16 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/plans')}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Back to Plans
                </button>
                <button
                  onClick={() => navigate('/payments')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  View Payment History
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Reference: <span className="font-mono">{reference}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
