import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { adminService, AdminPlan } from '../../../lib/services/admin.service';
import { DollarSign, TrendingUp, Loader, AlertCircle, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

// Safe integer formatter
const safeFormatInt = (value: any): string => {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return Math.round(num).toString();
};

export function PricingManagement() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    price: 0,
    name: '',
    duration: 30,
    features: [] as string[],
    reason: '',
  });
  const [featureInput, setFeatureInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const plansData = await adminService.getAllPlans();
      if (plansData && Array.isArray(plansData) && plansData.length > 0) {
        setPlans(plansData);
      } else {
        setPlans([]);
        // Don't show error - show create form instead
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load plans';
      setError(message);
      toast.error(message);
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (planType: 'basic' | 'premium') => {
    const plan = plans.find(p => p.plan === planType);
    if (plan) {
      setSelectedPlan(planType);
      setFormData({
        price: plan.price,
        name: plan.name,
        duration: plan.duration,
        features: plan.features,
        reason: '',
      });
      setIsEditing(true);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !formData.name || formData.price <= 0 || formData.duration <= 0) {
      toast.error('Please fill all fields. Price and duration must be greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.createOrUpdatePlan(selectedPlan, {
        price: formData.price,
        name: formData.name,
        duration: formData.duration,
        features: formData.features,
        reason: formData.reason,
        isActive: true,
      });
      toast.success(`${formData.name} plan updated successfully`);
      setIsEditing(false);
      setSelectedPlan(null);
      loadPlans();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Management</h1>
          <p className="text-gray-600">Manage subscription plans and pricing</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error loading plans</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {plans.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Plans Found</h3>
            <p className="text-blue-700 mb-6">Create pricing plans to get started</p>
          </div>
        )}

        {/* Create Plan Buttons */}
        <div className="flex gap-2 flex-wrap">
          {(!plans.some(p => p.plan === 'basic')) && (
            <button
              onClick={() => {
                setSelectedPlan('basic');
                setFormData({ price: 0, name: 'Basic Plan', duration: 30, features: [], reason: '' });
                setIsEditing(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Create Basic Plan
            </button>
          )}
          {(!plans.some(p => p.plan === 'premium')) && (
            <button
              onClick={() => {
                setSelectedPlan('premium');
                setFormData({ price: 0, name: 'Premium Plan', duration: 30, features: [], reason: '' });
                setIsEditing(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Create Premium Plan
            </button>
          )}
        </div>

        {/* Plans Grid */}
        {plans.length > 0 && (
        <div className="grid md:grid-cols-2 gap-8">
          {plans.filter(p => p.plan !== 'free').map((plan) => (
            <div key={plan._id} className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                  <p className="text-sm text-gray-600 capitalize">{plan.plan} Plan</p>
                </div>
                <button
                  onClick={() => handleEditClick(plan.plan as 'basic' | 'premium')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">₦{plan.price.toLocaleString()}</span>
                  <span className="text-gray-600">/{plan.duration} days</span>
                </div>
                <p className="text-sm text-gray-600">
                  ₦{safeFormatInt(plan.price / plan.duration)}/day
                </p>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-gray-700">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  plan.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Updated Info */}
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                Last updated: {new Date(plan.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Price History */}
        <div className="grid md:grid-cols-2 gap-6">
          {plans
            .filter(p => p.plan !== 'free')
            .map((plan) => (
              <div key={`${plan._id}-history`} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {plan.name} - Price History
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {plan.priceHistory && plan.priceHistory.length > 0 ? (
                    plan.priceHistory.map((history, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">₦{history.price.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">{history.reason}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(history.changedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">No price history</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Edit Plan Dialog */}
      <AlertDialog open={isEditing} onOpenChange={setIsEditing}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogTitle>Edit {selectedPlan?.toUpperCase()} Plan</AlertDialogTitle>
          <AlertDialogDescription className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Price (Naira)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Plan Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Duration (Days)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Features</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Add a feature..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <span className="text-sm text-gray-900">{feature}</span>
                    <button
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Change Reason</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for price change..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end mt-6">
            <AlertDialogCancel onClick={() => setIsEditing(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting || formData.price <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
