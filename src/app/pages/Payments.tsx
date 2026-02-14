import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, Clock, CheckCircle, XCircle, Download, Loader2, Calendar, DollarSign } from 'lucide-react';
import { paymentService } from '../../lib/services/payment.service';
import toast from 'react-hot-toast';
import type { Transaction } from '../../types';
import { Layout } from '../components/Layout';

export function Payments() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => paymentService.getTransactions(),
  });
// this is to track changes in github
  const initPaymentMutation = useMutation({
    mutationFn: (data: { plan: 'basic' | 'premium' }) => 
      paymentService.initializePayment(data),
    onSuccess: (response: any) => {
      // Redirect to Paystack checkout
      if (response?.authorization_url) {
        window.location.href = response.authorization_url;
      } else if (response.data?.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        toast.error('Payment initialization failed');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    },
  });

  const handlePayment = (planId: string) => {
    setSelectedPlan(planId);
    const plan = planId === 'basic' || planId === 'premium' ? planId : 'basic';
    initPaymentMutation.mutate({ plan: plan as 'basic' | 'premium' });
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
                            {typeof transaction.plan === 'string' ? transaction.plan : transaction.plan?.name || 'Subscription Plan'}
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
                      <div className="text-sm text-gray-600">
                        {transaction.paymentMethod || 'Card'}
                      </div>
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
