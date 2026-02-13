import { useState } from 'react';
import { Layout } from '../components/Layout';
import { CheckCircle, CreditCard, Calendar, Download, ExternalLink, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { paymentService } from '../../lib/services';
import { toast } from 'sonner';

export function Plans() {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (data: { plan: 'basic' | 'premium'; duration: number }) => {
      return paymentService.initiatePayment(data);
    },
    onSuccess: (data) => {
      // Redirect to Paystack authorization URL
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Payment failed. Please try again.');
      setShowPaymentModal(false);
    },
  });

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      features: [
        '10 practice exams per month',
        'Basic analytics',
        'Community support',
        'Access to study materials',
        'Leaderboard access'
      ],
      limitations: [
        'Limited exam attempts',
        'No AI question generation',
        'Basic performance tracking'
      ]
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 2500,
      period: 'month',
      popular: true,
      features: [
        'Unlimited practice exams',
        'Advanced analytics',
        'Email support',
        'All study materials',
        'Performance trends',
        'Topic-wise analysis',
        'Leaderboard rankings',
        'Download exam reports'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 5000,
      period: 'month',
      features: [
        'Everything in Basic',
        'AI question generation',
        'Priority support',
        'Custom study plans',
        'Unlimited AI questions',
        'Advanced recommendations',
        'Early access to features',
        'Dedicated account manager'
      ]
    }
  ];

  const transactions = [
    { id: 1, date: '2026-01-15', plan: 'Premium', amount: 5000, status: 'Successful', reference: 'TXN-2026-001' },
    { id: 2, date: '2025-12-15', plan: 'Premium', amount: 5000, status: 'Successful', reference: 'TXN-2025-312' },
    { id: 3, date: '2025-11-15', plan: 'Basic', amount: 2500, status: 'Successful', reference: 'TXN-2025-267' },
  ];

  const handleUpgrade = (planId: string) => {
    // Free plan doesn't require payment
    if (planId === 'free') {
      toast.error('Downgrade functionality coming soon');
      return;
    }
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPlan || selectedPlan === 'free') {
      toast.error('Invalid plan selected');
      return;
    }

    // Initiate payment
    paymentMutation.mutate({
      plan: selectedPlan as 'basic' | 'premium',
      duration: 1, // 1 month subscription
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plans & Billing</h1>
          <p className="text-gray-600">Manage your subscription and payment history</p>
        </div>

        {/* Current Plan */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 mb-1">Current Plan</p>
              <h2 className="text-3xl font-bold mb-2 capitalize">{user?.plan} Plan</h2>
              {user?.planExpiry && (
                <p className="text-green-100">
                  Valid until {new Date(user.planExpiry).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <Calendar className="w-12 h-12 mb-2 mx-auto" />
              <p className="text-sm">Auto-renews</p>
              <p className="text-xs text-green-100">on {user?.planExpiry?.slice(0, 10)}</p>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 p-8 relative ${
                  plan.popular 
                    ? 'border-green-600 shadow-lg' 
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">₦{plan.price.toLocaleString()}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {user?.plan === plan.id ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-600 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
            <button className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
              <Download className="w-4 h-4" />
              Download All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Reference</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">{txn.date}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{txn.plan}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900">₦{txn.amount.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{txn.reference}</td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex gap-3">
            <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Payment Information</h3>
              <p className="text-sm text-blue-800 mb-3">
                All payments are securely processed through Paystack. We accept all major Nigerian banks, 
                cards, and mobile money.
              </p>
              <p className="text-xs text-blue-700">
                Need help? Contact support@educbt.ng or call +234 800 1234 567
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Upgrade</h3>
            <p className="text-gray-600 mb-6">
              You are about to upgrade to the {plans.find(p => p.id === selectedPlan)?.name} plan.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold text-gray-900 capitalize">{selectedPlan}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">
                  ₦{plans.find(p => p.id === selectedPlan)?.price.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Billing:</span>
                <span className="font-semibold text-gray-900">Monthly</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentMutation.isPending}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentMutation.isPending}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-green-700 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {paymentMutation.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
