import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { adminService } from '../../../lib/services/admin.service';
import { academicService } from '../../../lib/services/academic.service';
import { Mail, Send, AlertCircle, Loader, Wrench, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import type { University } from '../../../types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type NotificationType = 'bulk' | 'announcement' | 'maintenance' | 'expiry';

export function AdminNotifications() {
  const [activeTab, setActiveTab] = useState<NotificationType>('bulk');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);

  // Bulk Notification State
  const [bulkForm, setBulkForm] = useState({
    subject: '',
    template: '',
    variables: {} as Record<string, string>,
    filters: {
      plan: undefined as 'free' | 'basic' | 'premium' | undefined,
      role: undefined as 'student' | 'admin' | undefined,
      universityId: '',
      isActive: true,
    },
  });

  // Announcement State
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
  });

  // Maintenance State
  const [maintenanceForm, setMaintenanceForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    impact: '',
  });

  // Expiry Reminder State
  const [expiryForm, setExpiryForm] = useState({
    daysUntilExpiry: 7,
  });

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setIsLoadingUniversities(true);
        const data = await academicService.getUniversities();
        setUniversities(data || []);
      } catch (err) {
        toast.error('Failed to load universities');
      } finally {
        setIsLoadingUniversities(false);
      }
    };

    loadUniversities();
  }, []);

  const handleSendBulkNotification = async () => {
    if (!bulkForm.subject || !bulkForm.template) {
      toast.error('Subject and template are required');
      return;
    }

    try {
      setIsSending(true);
      const result = await adminService.sendBulkNotification({
        subject: bulkForm.subject,
        template: bulkForm.template,
        variables: bulkForm.variables,
        filters: {
          plan: bulkForm.filters.plan,
          role: bulkForm.filters.role,
          universityId: bulkForm.filters.universityId || undefined,
          isActive: bulkForm.filters.isActive,
        },
      });

      toast.success(`Notification sent to ${result.recipientCount} recipients`);
      setBulkForm({
        subject: '',
        template: '',
        variables: {},
        filters: {
          plan: undefined,
          role: undefined,
          universityId: '',
          isActive: true,
        },
      });
      setShowConfirmation(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setIsSending(true);
      const result = await adminService.sendAnnouncement({
        title: announcementForm.title,
        content: announcementForm.content,
      });

      toast.success(`Announcement sent to ${result.recipientCount} users`);
      setAnnouncementForm({ title: '', content: '' });
      setShowConfirmation(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send announcement');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMaintenanceNotification = async () => {
    if (!maintenanceForm.title || !maintenanceForm.startTime || !maintenanceForm.endTime) {
      toast.error('Title, start time, and end time are required');
      return;
    }

    try {
      setIsSending(true);
      const result = await adminService.sendMaintenanceNotification({
        title: maintenanceForm.title,
        startTime: new Date(maintenanceForm.startTime).toISOString(),
        endTime: new Date(maintenanceForm.endTime).toISOString(),
        impact: maintenanceForm.impact || undefined,
      });

      toast.success(`Maintenance notification sent to ${result.recipientCount} users`);
      setMaintenanceForm({ title: '', startTime: '', endTime: '', impact: '' });
      setShowConfirmation(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send maintenance notification');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendExpiryReminder = async () => {
    try {
      setIsSending(true);
      const result = await adminService.sendPlanExpiryReminder({
        daysUntilExpiry: expiryForm.daysUntilExpiry,
      });

      toast.success(`Expiry reminder sent to ${result.recipientCount} users`);
      setExpiryForm({ daysUntilExpiry: 7 });
      setShowConfirmation(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send expiry reminder');
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    switch (activeTab) {
      case 'bulk':
        await handleSendBulkNotification();
        break;
      case 'announcement':
        await handleSendAnnouncement();
        break;
      case 'maintenance':
        await handleSendMaintenanceNotification();
        break;
      case 'expiry':
        await handleSendExpiryReminder();
        break;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications & Communications</h1>
          <p className="text-gray-600">Send bulk notifications, announcements, and system alerts to users</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-2 overflow-x-auto">
          {[
            { id: 'bulk' as NotificationType, label: 'Bulk Notifications', icon: Mail },
            { id: 'announcement' as NotificationType, label: 'Announcements', icon: AlertCircle },
            { id: 'maintenance' as NotificationType, label: 'Maintenance', icon: Wrench },
            { id: 'expiry' as NotificationType, label: 'Expiry Reminders', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          {/* Bulk Notifications Tab */}
          {activeTab === 'bulk' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Bulk Notification</h2>
                <p className="text-gray-600 mb-6">Send targeted notifications to users with filters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Subject *</label>
                <input
                  type="text"
                  value={bulkForm.subject}
                  onChange={(e) => setBulkForm({ ...bulkForm, subject: e.target.value })}
                  placeholder="Notification subject..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Template/Message *</label>
                <textarea
                  value={bulkForm.template}
                  onChange={(e) => setBulkForm({ ...bulkForm, template: e.target.value })}
                  placeholder="Notification template with {variable} for dynamic content..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Recipient Plan</label>
                  <select
                    value={bulkForm.filters.plan || ''}
                    onChange={(e) =>
                      setBulkForm({
                        ...bulkForm,
                        filters: { ...bulkForm.filters, plan: e.target.value as any || undefined },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Plans</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Recipient Role</label>
                  <select
                    value={bulkForm.filters.role || ''}
                    onChange={(e) =>
                      setBulkForm({
                        ...bulkForm,
                        filters: { ...bulkForm.filters, role: e.target.value as any || undefined },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">University (optional)</label>
                  <select
                    value={bulkForm.filters.universityId}
                    onChange={(e) =>
                      setBulkForm({
                        ...bulkForm,
                        filters: { ...bulkForm.filters, universityId: e.target.value },
                      })
                    }
                    disabled={isLoadingUniversities}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Universities</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">User Status</label>
                  <select
                    value={bulkForm.filters.isActive ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setBulkForm({
                        ...bulkForm,
                        filters: { ...bulkForm.filters, isActive: e.target.value === 'active' },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  You can use variables in templates like {`{firstName}`}, {`{email}`}, {`{plan}`} which will be replaced with user data.
                </p>
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcement' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Announcement</h2>
                <p className="text-gray-600 mb-6">Send a platform-wide announcement to all users</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Announcement Title *</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="e.g., New Features Available"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Announcement Content *</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  placeholder="Write your announcement here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  This announcement will be sent to all active users on the platform.
                </p>
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Notification</h2>
                <p className="text-gray-600 mb-6">Alert users about scheduled maintenance</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Maintenance Title *</label>
                <input
                  type="text"
                  value={maintenanceForm.title}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                  placeholder="e.g., Scheduled Maintenance"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={maintenanceForm.startTime}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">End Time *</label>
                  <input
                    type="datetime-local"
                    value={maintenanceForm.endTime}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, endTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Impact Description (optional)</label>
                <textarea
                  value={maintenanceForm.impact}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, impact: e.target.value })}
                  placeholder="Describe what will be impacted by maintenance..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-700">
                  Users will be notified about the maintenance window and advised not to use the platform during that time.
                </p>
              </div>
            </div>
          )}

          {/* Expiry Reminder Tab */}
          {activeTab === 'expiry' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Expiry Reminders</h2>
                <p className="text-gray-600 mb-6">Send reminders to users whose plans are expiring soon</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Send to plans expiring in:</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={expiryForm.daysUntilExpiry}
                    onChange={(e) => setExpiryForm({ daysUntilExpiry: Number(e.target.value) })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 w-24"
                  />
                  <span className="text-gray-600">days</span>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-700">
                  This will send reminders to all users whose subscription plans expire within the specified number of days.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  For example: Setting to 7 days will send reminders to users whose plans expire in 1-7 days from now.
                </p>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSend}
              disabled={isSending}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                isSending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm Send</AlertDialogTitle>
          <AlertDialogDescription>
            {activeTab === 'bulk' && `Are you sure you want to send this notification to the selected users?`}
            {activeTab === 'announcement' && `This announcement will be sent to all active users. Continue?`}
            {activeTab === 'maintenance' && `Maintenance notification will alert all users. Continue?`}
            {activeTab === 'expiry' && `Plan expiry reminders will be sent to ${expiryForm.daysUntilExpiry}-day-expiring users. Continue?`}
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel onClick={() => setShowConfirmation(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSend}
              disabled={isSending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? 'Sending...' : 'Send'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
