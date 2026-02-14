import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { adminService, AdminPromoCode, AdminPromoCodeStats } from '../../../lib/services/admin.service';
import { Ticket, Plus, Loader, AlertCircle, Eye, EyeOff, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

export function PromoCodeManagement() {
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filterActive, setFilterActive] = useState('all');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCode, setSelectedCode] = useState<AdminPromoCode | null>(null);
  const [selectedStats, setSelectedStats] = useState<AdminPromoCodeStats | null>(null);
  const [dialogType, setDialogType] = useState<'create' | 'edit' | 'stats' | 'delete' | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    applicablePlans: [] as string[],
    maxUsageCount: undefined as number | undefined,
    maxUsagePerUser: 1,
    validFrom: '',
    validUntil: '',
    isActive: true,
  });

  useEffect(() => {
    loadPromoCodes();
  }, [currentPage, filterActive]);

  const loadPromoCodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const isActive = filterActive === 'active' ? true : filterActive === 'inactive' ? false : undefined;
      const response = await adminService.getPromoCodes(currentPage, 20, isActive);
      setPromoCodes(response.data);
      setTotalPages(response.pagination.pages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load promo codes';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClick = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      applicablePlans: [],
      maxUsageCount: undefined,
      maxUsagePerUser: 1,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    });
    setSelectedCode(null);
    setDialogType('create');
  };

  const handleEditClick = (code: AdminPromoCode) => {
    setSelectedCode(code);
    setFormData({
      code: code.code,
      description: code.description,
      discountType: code.discountType,
      discountValue: code.discountValue,
      applicablePlans: code.applicablePlans,
      maxUsageCount: code.maxUsageCount === null ? undefined : code.maxUsageCount,
      maxUsagePerUser: code.maxUsagePerUser,
      validFrom: new Date(code.validFrom).toISOString().split('T')[0],
      validUntil: new Date(code.validUntil).toISOString().split('T')[0],
      isActive: code.isActive,
    });
    setDialogType('edit');
  };

  const handleStatsClick = async (code: AdminPromoCode) => {
    try {
      setIsActioning(true);
      const stats = await adminService.getPromoCodeStats(code.code);
      setSelectedCode(code);
      setSelectedStats(stats);
      setDialogType('stats');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsActioning(false);
    }
  };

  const handleDeleteClick = (code: AdminPromoCode) => {
    setSelectedCode(code);
    setDialogType('delete');
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.code || !formData.validFrom || !formData.validUntil) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setIsActioning(true);
      
      if (dialogType === 'create') {
        await adminService.createPromoCode({
          code: formData.code.toUpperCase(),
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          applicablePlans: formData.applicablePlans,
          maxUsageCount: formData.maxUsageCount,
          maxUsagePerUser: formData.maxUsagePerUser,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
        });
        toast.success('Promo code created successfully');
      } else if (dialogType === 'edit' && selectedCode) {
        await adminService.updatePromoCode(selectedCode.code, {
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          applicablePlans: formData.applicablePlans,
          maxUsageCount: formData.maxUsageCount,
          maxUsagePerUser: formData.maxUsagePerUser,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
          isActive: formData.isActive,
        });
        toast.success('Promo code updated successfully');
      }
      
      setDialogType(null);
      loadPromoCodes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save promo code');
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCode) return;

    try {
      setIsActioning(true);
      await adminService.deletePromoCode(selectedCode.code);
      toast.success('Promo code deleted successfully');
      setDialogType(null);
      loadPromoCodes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete promo code');
    } finally {
      setIsActioning(false);
    }
  };

  const togglePlan = (plan: string) => {
    setFormData({
      ...formData,
      applicablePlans: formData.applicablePlans.includes(plan)
        ? formData.applicablePlans.filter(p => p !== plan)
        : [...formData.applicablePlans, plan]
    });
  };

  if (isLoading && promoCodes.length === 0) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Promo Code Management</h1>
            <p className="text-gray-600">Create and manage promotional codes</p>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Promo Code
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error loading promo codes</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-4">
          <select
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Codes</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Promo Codes Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-green-600 animate-spin" />
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No promo codes found</p>
              <p className="text-sm text-gray-400">Create your first promo code to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Code</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Discount</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Usage</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Valid Until</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
                      <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((code) => (
                      <tr key={code._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900 font-mono text-lg">{code.code}</p>
                            <p className="text-sm text-gray-600">{code.description}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              code.discountType === 'percentage'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {code.discountType === 'percentage' 
                                ? `${code.discountValue}%` 
                                : `₦${(code.discountValue || 0).toLocaleString()}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            <p className="text-gray-900 font-medium">{code.usageCount} used</p>
                            <p className="text-gray-600">
                              {code.maxUsageCount ? `${code.maxUsageCount - code.usageCount} remaining` : 'Unlimited'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {new Date(code.validUntil).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            code.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {code.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Edit2 className="w-5 h-5 text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleStatsClick(code)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Statistics
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditClick(code)}
                                className="flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Code
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(code)}
                                className="flex items-center gap-2 text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <AlertDialog open={dialogType === 'create' || dialogType === 'edit'} onOpenChange={() => setDialogType(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogTitle>{dialogType === 'create' ? 'Create Promo Code' : 'Edit Promo Code'}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER20"
                  disabled={dialogType === 'edit'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summer discount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (₦)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Discount Value</label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  placeholder="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Max Uses Per User</label>
                <input
                  type="number"
                  value={formData.maxUsagePerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsagePerUser: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Valid From *</label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Valid Until *</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Applicable Plans</label>
              <div className="space-y-2">
                {['free', 'basic', 'premium'].map((plan) => (
                  <label key={plan} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.applicablePlans.includes(plan)}
                      onChange={() => togglePlan(plan)}
                      className="w-4 h-4 rounded border-gray-300 text-green-600"
                    />
                    <span className="capitalize text-gray-700 font-medium">{plan}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Max Total Usage (Leave empty for unlimited)</label>
              <input
                type="number"
                value={formData.maxUsageCount || ''}
                onChange={(e) => setFormData({ ...formData, maxUsageCount: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {dialogType === 'edit' && (
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-green-600"
                  />
                  <span className="text-gray-700 font-medium">Active</span>
                </label>
              </div>
            )}
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end mt-6">
            <AlertDialogCancel onClick={() => setDialogType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateOrUpdate}
              disabled={isActioning || !formData.code}
              className="bg-green-600 hover:bg-green-700"
            >
              {isActioning ? 'Saving...' : dialogType === 'create' ? 'Create Code' : 'Update Code'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Dialog */}
      <AlertDialog open={dialogType === 'stats'} onOpenChange={() => setDialogType(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogTitle>Promo Code Statistics: {selectedStats?.code}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-6">
            {selectedStats && (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">Usage</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedStats.usageCount}/{selectedStats.maxUsageCount || '∞'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium mb-1">Total Discount Given</p>
                    <p className="text-2xl font-bold text-purple-900">₦{(selectedStats?.totalDiscountGiven || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 font-medium mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-900">₦{(selectedStats?.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Recent Usage</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedStats.usages && selectedStats.usages.length > 0 ? (
                      selectedStats.usages.map((usage) => (
                        <div key={usage._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {usage.userId.firstName} {usage.userId.lastName}
                            </p>
                            <p className="text-xs text-gray-600">{usage.userId.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">-₦{(usage?.discountApplied || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(usage.usedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-6">No usage data yet</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end mt-6">
            <AlertDialogAction onClick={() => setDialogType(null)}>Close</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={dialogType === 'delete'} onOpenChange={() => setDialogType(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the promo code <strong>{selectedCode?.code}</strong>? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel onClick={() => setDialogType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isActioning}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActioning ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
