import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { adminService, AdminUser } from '../../../lib/services/admin.service';
import { 
  Search, Filter, MoreVertical, Shield, Ban, Check, X, Mail, AlertCircle, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'role' | 'changePlan' | 'notify' | null>(null);
  const [actionData, setActionData] = useState({ 
    duration: '7days', 
    reason: '', 
    message: '', 
    subject: '',
    selectedPlan: 'free' as 'free' | 'basic' | 'premium',
    expiryDays: 30,
  });
  const [isActioning, setIsActioning] = useState(false);

  // Load users
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, filterPlan, filterRole]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters = {
        plan: filterPlan !== 'all' ? filterPlan : undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        search: searchTerm || undefined,
      };
      
      const response = await adminService.getUsers(currentPage, 20, filters);
      setUsers(response.users);
      setTotalUsers(response.pagination.total);
      setTotalPages(response.pagination.pages);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsActioning(true);
      await adminService.banUser(selectedUser._id, {
        reason: actionData.reason || 'Violation of terms',
        duration: actionData.duration as any,
      });
      toast.success('User banned successfully');
      setSelectedUser(null);
      setActionType(null);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to ban user');
    } finally {
      setIsActioning(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsActioning(true);
      await adminService.unbanUser(selectedUser._id);
      toast.success('User unbanned successfully');
      setSelectedUser(null);
      setActionType(null);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unban user');
    } finally {
      setIsActioning(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !selectedUser.id) return;
    
    try {
      setIsActioning(true);
      const newRole = selectedUser.role === 'admin' ? 'student' : 'admin';
      await adminService.changeUserRole(selectedUser._id, { newRole });
      toast.success(`User role changed to ${newRole}`);
      setSelectedUser(null);
      setActionType(null);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change user role');
    } finally {
      setIsActioning(false);
    }
  };

  const handleDowngradePlan = async () => {
    if (!selectedUser || !selectedUser.id) return;
    
    try {
      setIsActioning(true);
      await adminService.downgradeUserPlan(selectedUser._id, {
        reason: actionData.reason || 'Policy violation',
      });
      toast.success('User plan downgraded to free');
      setSelectedUser(null);
      setActionType(null);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to downgrade user plan');
    } finally {
      setIsActioning(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedUser || !selectedUser.id) return;
    
    try {
      setIsActioning(true);
      await adminService.changePlan(selectedUser._id, {
        plan: actionData.selectedPlan,
        expiryDays: actionData.expiryDays,
      });
      toast.success(`User plan changed to ${actionData.selectedPlan}`);
      setSelectedUser(null);
      setActionType(null);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change user plan');
    } finally {
      setIsActioning(false);
    }
  };

  const handleSendNotification = async () => {
    if (!selectedUser) return;
    
    try {
      setIsActioning(true);
      await adminService.sendUserNotification(selectedUser._id, {
        subject: actionData.subject,
        message: actionData.message,
      });
      toast.success('Notification sent successfully');
      setSelectedUser(null);
      setActionType(null);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setIsActioning(false);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'basic': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage user accounts, subscriptions, and access</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm text-gray-600 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm text-gray-600 mb-2">Premium Users</h3>
            <p className="text-3xl font-bold text-purple-600">
              {users.filter(u => u.plan === 'premium').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm text-gray-600 mb-2">Basic Users</h3>
            <p className="text-3xl font-bold text-blue-600">
              {users.filter(u => u.plan === 'basic').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm text-gray-600 mb-2">Free Users</h3>
            <p className="text-3xl font-bold text-gray-600">
              {users.filter(u => u.plan === 'free').length}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterPlan}
              onChange={(e) => {
                setFilterPlan(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-w-[150px]"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-w-[150px]"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-gap-3 gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error loading users</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 text-green-600 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">User</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Plan</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Role</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">Joined</th>
                      <th className="text-right py-4 px-6 text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getPlanColor(user.plan)}`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.isActive)}`}>
                            {user.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <MoreVertical className="w-5 h-5 text-gray-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {user.isActive ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setActionType('ban');
                                    setActionData({ ...actionData, reason: '' });
                                  }}
                                  className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                >
                                  <Ban className="w-4 h-4" />
                                  Ban User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setActionType('unban');
                                  }}
                                  className="flex items-center gap-2 text-green-600 focus:text-green-600"
                                >
                                  <Check className="w-4 h-4" />
                                  Unban User
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('role');
                                }}
                                className="flex items-center gap-2"
                              >
                                <Shield className="w-4 h-4" />
                                Change Role
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('changePlan');
                                  setActionData({ 
                                    ...actionData, 
                                    selectedPlan: user.plan,
                                    expiryDays: 30,
                                  });
                                }}
                                className="flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Change Plan
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('notify');
                                  setActionData({ ...actionData, subject: '', message: '' });
                                }}
                                className="flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Send Notification
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
                  Page {currentPage} of {totalPages} • Showing {users.length} of {totalUsers} users
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

      {/* Action Dialogs */}
      <AlertDialog open={actionType === 'ban'} onOpenChange={() => actionType === 'ban' && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Ban User</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>Are you sure you want to ban {selectedUser?.firstName} {selectedUser?.lastName}?</p>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Reason</label>
              <input
                type="text"
                value={actionData.reason}
                onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                placeholder="Reason for ban"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Duration</label>
              <select
                value={actionData.duration}
                onChange={(e) => setActionData({ ...actionData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="7days">7 Days</option>
                <option value="30days">30 Days</option>
                <option value="90days">90 Days</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel onClick={() => setActionType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              disabled={isActioning || !actionData.reason}
              className="bg-red-600 hover:bg-red-700"
            >
              {isActioning ? 'Banning...' : 'Ban User'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionType === 'unban'} onOpenChange={() => actionType === 'unban' && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Unban User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unban {selectedUser?.firstName} {selectedUser?.lastName}?
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel onClick={() => setActionType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnbanUser}
              disabled={isActioning}
            >
              {isActioning ? 'Unbanning...' : 'Unban User'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionType === 'role'} onOpenChange={() => actionType === 'role' && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Change User Role</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change {selectedUser?.firstName} {selectedUser?.lastName}'s role from {selectedUser?.role} to {selectedUser?.role === 'admin' ? 'student' : 'admin'}?
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel onClick={() => setActionType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeRole}
              disabled={isActioning}
            >
              {isActioning ? 'Changing...' : 'Change Role'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionType === 'downgrade'} onOpenChange={() => actionType === 'downgrade' && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Downgrade User Plan</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>Are you sure you want to downgrade {selectedUser?.firstName} {selectedUser?.lastName} to free plan?</p>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Reason</label>
              <input
                type="text"
                value={actionData.reason}
                onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                placeholder="Reason for downgrade"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel onClick={() => setActionType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDowngradePlan}
              disabled={isActioning}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isActioning ? 'Downgrading...' : 'Downgrade Plan'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionType === 'changePlan'} onOpenChange={() => actionType === 'changePlan' && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Change User Plan</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>Change plan for {selectedUser?.firstName} {selectedUser?.lastName}</p>
            <p className="text-sm text-gray-600">Current Plan: <span className="font-semibold capitalize">{selectedUser?.plan}</span></p>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">New Plan</label>
              <select
                value={actionData.selectedPlan}
                onChange={(e) => setActionData({ ...actionData, selectedPlan: e.target.value as 'free' | 'basic' | 'premium' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            {actionData.selectedPlan !== 'free' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Expiry Days</label>
                <input
                  type="number"
                  value={actionData.expiryDays}
                  onChange={(e) => setActionData({ ...actionData, expiryDays: Number(e.target.value) })}
                  placeholder="30"
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-sm text-gray-500 mt-1">Plan will expire in {actionData.expiryDays} days</p>
              </div>
            )}
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel onClick={() => setActionType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangePlan}
              disabled={isActioning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isActioning ? 'Changing...' : 'Change Plan'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionType === 'notify'} onOpenChange={() => actionType === 'notify' && setActionType(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogTitle>Send Notification</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Subject</label>
              <input
                type="text"
                value={actionData.subject}
                onChange={(e) => setActionData({ ...actionData, subject: e.target.value })}
                placeholder="Email subject"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Message</label>
              <textarea
                value={actionData.message}
                onChange={(e) => setActionData({ ...actionData, message: e.target.value })}
                placeholder="Email message"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel onClick={() => setActionType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendNotification}
              disabled={isActioning || !actionData.subject || !actionData.message}
            >
              {isActioning ? 'Sending...' : 'Send Notification'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
