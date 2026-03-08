import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { adminService, NotificationResponse } from '../../../lib/services/admin.service';
import { academicService } from '../../../lib/services/academic.service';
import { Send, Loader2 } from 'lucide-react';
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

export function AdminNotifications() {
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);
  const [lastSendResult, setLastSendResult] = useState<NotificationResponse | null>(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'announcement' as 'general' | 'announcement' | 'maintenance' | 'plan' | 'system',
    channels: {
      inApp: true,
      push: false,
    },
    filters: {
      plan: '' as '' | 'free' | 'basic' | 'premium',
      role: '' as '' | 'student' | 'admin',
      universityId: '',
      isActive: true,
    },
    screen: 'updates',
    source: 'admin_broadcast',
    expiresAt: '',
  });

  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setIsLoadingUniversities(true);
        const data = await academicService.getUniversities();
        setUniversities(data || []);
      } catch {
        toast.error('Failed to load universities');
      } finally {
        setIsLoadingUniversities(false);
      }
    };

    loadUniversities();
  }, []);

  const selectedChannels = [
    form.channels.inApp ? 'in_app' : null,
    form.channels.push ? 'push' : null,
  ].filter(Boolean) as Array<'in_app' | 'push'>;

  const handleSend = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    if (selectedChannels.length === 0) {
      toast.error('Select at least one channel');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    try {
      setIsSending(true);
      const result = await adminService.sendNotificationBroadcast({
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        channels: selectedChannels,
        filters: {
          plan: form.filters.plan || undefined,
          role: form.filters.role || undefined,
          universityId: form.filters.universityId || undefined,
          isActive: form.filters.isActive,
        },
        data: {
          screen: form.screen.trim() || 'updates',
          source: form.source.trim() || 'admin_broadcast',
        },
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });

      toast.success(`Notification sent to ${result.recipientCount} recipients`);
      setLastSendResult(result);
      setForm((previous) => ({
        ...previous,
        title: '',
        message: '',
        expiresAt: '',
      }));
      setShowConfirmation(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Notifications</h1>
          <p className="text-gray-600">Compose and send in-app/push notifications to users</p>
          <p className="text-sm text-gray-500 mt-1">Use In-App only when no push tokens are registered. Push requires users to have previously registered FCM tokens.</p>
        </div>

        {lastSendResult && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Last Send Result</h2>
              <span className="text-xs text-gray-500">{new Date(lastSendResult.timestamp).toLocaleString()}</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Recipients</p>
                <p className="text-xl font-bold text-gray-900">{lastSendResult.recipientCount}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs text-green-700">In-App Created</p>
                <p className="text-xl font-bold text-green-800">{lastSendResult.inApp?.created ?? 0}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-700">Push Attempted</p>
                <p className="text-xl font-bold text-blue-800">{lastSendResult.push?.attempted ?? 0}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Push Sent / Failed</p>
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Sent:</span> {lastSendResult.push?.sent ?? 0} •{' '}
                  <span className="font-semibold">Failed:</span> {lastSendResult.push?.failed ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500 mb-1">Push Status</p>
                <p className="text-sm text-gray-900">
                  {lastSendResult.push?.skipped ? 'Skipped' : 'Processed'}
                  {lastSendResult.push?.reason ? ` • ${lastSendResult.push.reason}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Notification title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="general">General</option>
                <option value="announcement">Announcement</option>
                <option value="maintenance">Maintenance</option>
                <option value="plan">Plan</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Message *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write notification message"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Channels</label>
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.channels.inApp}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        channels: { ...form.channels, inApp: e.target.checked },
                      })
                    }
                    className="w-4 h-4"
                  />
                  In-App
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.channels.push}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        channels: { ...form.channels, push: e.target.checked },
                      })
                    }
                    className="w-4 h-4"
                  />
                  Push
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                In-App does not require a token in this form. Select Push only when users have registered push tokens.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Expires At (optional)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Plan Filter</label>
              <select
                value={form.filters.plan}
                onChange={(e) =>
                  setForm({
                    ...form,
                    filters: { ...form.filters, plan: e.target.value as any },
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
              <label className="block text-sm font-medium text-gray-900 mb-2">Role Filter</label>
              <select
                value={form.filters.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    filters: { ...form.filters, role: e.target.value as any },
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
              <label className="block text-sm font-medium text-gray-900 mb-2">University Filter</label>
              <select
                value={form.filters.universityId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    filters: { ...form.filters, universityId: e.target.value },
                  })
                }
                disabled={isLoadingUniversities}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Universities</option>
                {universities.map((university) => {
                  const universityId = university._id || university.id;
                  return (
                    <option key={universityId} value={universityId}>
                      {university.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Status Filter</label>
              <select
                value={form.filters.isActive ? 'active' : 'inactive'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    filters: { ...form.filters, isActive: e.target.value === 'active' },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Data Screen</label>
              <input
                type="text"
                value={form.screen}
                onChange={(e) => setForm({ ...form, screen: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Data Source</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSend}
              disabled={isSending}
              className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                isSending
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isSending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm Send Notification</AlertDialogTitle>
          <AlertDialogDescription>
            Send this notification now to matching users?
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
