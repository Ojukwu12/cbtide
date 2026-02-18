import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, Clock, CheckCircle, XCircle, Download, Loader2, Calendar, DollarSign } from 'lucide-react';
import { paymentService } from '../../lib/services/payment.service';
import toast from 'react-hot-toast';
import type { Transaction } from '../../types';
import { Layout } from '../components/Layout';

export function Payments() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);

  const buildPaystackCheckoutUrl = (authorizationUrl: string, reference?: string) => {
    if (!reference) return authorizationUrl;
    const callbackUrl = `${window.location.origin}/payment-callback?reference=${encodeURIComponent(reference)}`;
    try {
      const checkoutUrl = new URL(authorizationUrl);
      checkoutUrl.searchParams.set('redirect_url', callbackUrl);
      return checkoutUrl.toString();
    } catch {
      const joiner = authorizationUrl.includes('?') ? '&' : '?';
      return `${authorizationUrl}${joiner}redirect_url=${encodeURIComponent(callbackUrl)}`;
    }
  };

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => paymentService.getTransactions(),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => paymentService.getPlans(),
  });

  const paidPlans = (plansData || []).filter((plan: any) => plan.plan === 'basic' || plan.plan === 'premium');
  const selectedPlanData = paidPlans.find((plan: any) => plan.plan === selectedPlan);
  const selectedPlanPrice = Number(selectedPlanData?.price ?? 0) || 0;
  const hasPromoDiscount = Number(appliedPromo?.discountAmount || 0) > 0;
  const discountAmount = Number(appliedPromo?.discountAmount || 0) || 0;
  const finalAmount = Number(appliedPromo?.finalAmount ?? selectedPlanPrice) || 0;
// this is to track changes in github
  const initPaymentMutation = useMutation({
    mutationFn: (data: { plan: 'basic' | 'premium'; promoCode?: string }) => 
      paymentService.initializePayment(data),
    onSuccess: (response: any) => {
      // Redirect to Paystack checkout
      if (response?.authorization_url) {
        window.location.assign(buildPaystackCheckoutUrl(response.authorization_url, response.reference));
      } else if (response.data?.authorization_url) {
        window.location.assign(buildPaystackCheckoutUrl(response.data.authorization_url, response.data.reference));
      } else {
        toast.error('Payment initialization failed');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    },
  });

  const handlePayment = (planId: string) => {
    const plan = planId === 'basic' || planId === 'premium' ? planId : 'basic';
    const promoCodeToApply =
      appliedPromo?.code ||
      appliedPromo?.promoCode?.code ||
      (promoCode.trim() ? promoCode.trim() : undefined);

    initPaymentMutation.mutate({
      plan: plan as 'basic' | 'premium',
      promoCode: promoCodeToApply,
    });
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    if (!selectedPlan || (selectedPlan !== 'basic' && selectedPlan !== 'premium')) {
      setPromoError('Please select a plan first');
      return;
    }

    try {
      setValidatingPromo(true);
      setPromoError(null);

      const result = await paymentService.validatePromo(promoCode.trim(), selectedPlan as 'basic' | 'premium');
      const normalizedPromo = {
        ...result,
        code: result.code || result.promoCode?.code || promoCode.trim().toUpperCase(),
        discountAmount: Number(result.pricing?.discountAmount ?? result.discountAmount ?? 0) || 0,
        finalAmount: Number(result.pricing?.finalAmount ?? result.finalAmount ?? 0) || 0,
        savingsPercentage: Number(result.pricing?.savingsPercentage ?? result.savingsPercentage ?? 0) || 0,
      };

      if (result.isValid === false) {
        throw new Error('Invalid promo code');
      }

      setAppliedPromo(normalizedPromo);
      toast.success(`Promo code applied! You save ₦${normalizedPromo.discountAmount.toLocaleString()}`);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Invalid promo code';
      setPromoError(message);
      setAppliedPromo(null);
      toast.error(message);
    } finally {
      setValidatingPromo(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      failed: 'bg-red-100 text-red-700',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
          <p className="text-gray-600">View your transactions and subscription history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Successful</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {transactions?.data?.filter((t: Transaction) => t.status === 'success').length || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Pending</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {transactions?.data?.filter((t: Transaction) => t.status === 'pending').length || 0}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Spent</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ₦{transactions?.data
                ?.filter((t: Transaction) => t.status === 'success')
                ?.reduce((sum: number, t: Transaction) => sum + t.amount, 0)
                ?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Quick Upgrade */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Buy a Plan</h2>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {paidPlans.map((plan: any) => (
              <button
                key={plan._id || plan.plan}
                onClick={() => {
                  setSelectedPlan(plan.plan);
                  setPromoError(null);
                  setAppliedPromo(null);
                }}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  selectedPlan === plan.plan
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900 capitalize">{plan.name || plan.plan}</p>
                <p className="text-sm text-gray-600">₦{Number(plan.price || 0).toLocaleString()}</p>
              </button>
            ))}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Promo Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError(null);
                }}
                placeholder="Enter promo code"
                disabled={validatingPromo || !selectedPlan || !!appliedPromo}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                onClick={handleValidatePromo}
                disabled={validatingPromo || !promoCode.trim() || !selectedPlan || !!appliedPromo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
              >
                {validatingPromo ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {promoError && <p className="text-red-600 text-sm mt-2">{promoError}</p>}
            {appliedPromo && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-green-600 text-sm font-medium">✓ Promo applied</p>
                {Number(appliedPromo.savingsPercentage || 0) > 0 && (
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    {Number(appliedPromo.savingsPercentage).toFixed(1)}% OFF
                  </span>
                )}
              </div>
            )}
          </div>

          {selectedPlan && selectedPlanData && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Original Amount</span>
                <span className="font-semibold text-gray-900">₦{selectedPlanPrice.toLocaleString()}</span>
              </div>
              {hasPromoDiscount && (
                <>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-semibold text-green-600">-₦{discountAmount.toLocaleString()}</span>
                  </div>
                  {Number(appliedPromo?.savingsPercentage || 0) > 0 && (
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Savings</span>
                      <span className="font-semibold text-green-600">{Number(appliedPromo.savingsPercentage).toFixed(1)}%</span>
                    </div>
                  )}
                </>
              )}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Final Amount</span>
                <span className="font-bold text-green-600">₦{finalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => selectedPlan && handlePayment(selectedPlan)}
            disabled={!selectedPlan || initPaymentMutation.isPending}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {initPaymentMutation.isPending
              ? 'Processing...'
              : Number(appliedPromo?.savingsPercentage || 0) > 0
              ? `Proceed (${Number(appliedPromo.savingsPercentage).toFixed(1)}% OFF)`
              : 'Proceed to Payment'}
          </button>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          ) : !transactions?.data || transactions.data.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-600 mb-6">You haven't made any payments yet</p>
              <a
                href="/plans"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                View Plans
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {(transactions.data as any[]).map((transaction: any) => (
                <div
                  key={transaction._id || transaction.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {typeof transaction.plan === 'string'
                              ? transaction.plan
                              : transaction.plan?.name || transaction.plan?.plan || transaction.planId || ''}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                          <div>Reference: {transaction.reference}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        ₦{transaction.amount.toLocaleString()}
                      </div>
                      {(transaction.paymentMethod || transaction.channel || transaction.gateway) && (
                        <div className="text-sm text-gray-600">
                          {transaction.paymentMethod || transaction.channel || transaction.gateway}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods Info */}
        <div className="mt-8 bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-8 text-white">
          <h3 className="text-xl font-bold mb-4">Secure Payment with Paystack</h3>
          <p className="text-green-100 mb-6">
            All payments are processed securely through Paystack. We accept all major payment cards
            and bank transfers.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur">Visa</div>
            <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur">Mastercard</div>
            <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur">Verve</div>
            <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur">Bank Transfer</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
