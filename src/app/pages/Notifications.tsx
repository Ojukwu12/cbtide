import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Clock3, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Layout } from '../components/Layout';
import { AppNotification, notificationService } from '../../lib/services';
import { useSearchParams } from 'react-router';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const getNotificationTime = (value: string): number => {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNotificationDate = (dateValue: string): string => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString();
};

export function Notifications() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [pushOpenedNotification, setPushOpenedNotification] = useState<
    { title: string; message: string; createdAt: string; expiresAt?: string | null } | null
  >(null);
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: () => notificationService.getNotifications({ page, limit }),
    refetchInterval: 45000,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark notification as read');
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllNotificationsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark all notifications as read');
    },
  });

  const notifications = useMemo(() => {
    const now = Date.now();
    const minimumTime = now - ONE_DAY_IN_MS;
    const source = data?.notifications ?? [];

    return source
      .filter((item) => getNotificationTime(item.createdAt) >= minimumTime)
      .sort((a, b) => getNotificationTime(b.createdAt) - getNotificationTime(a.createdAt));
  }, [data?.notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item: AppNotification) => !item.isRead).length,
    [notifications]
  );

  const totalPages = Math.max(1, Number(data?.pagination?.pages ?? 1));

  useEffect(() => {
    const pushOpen = searchParams.get('push_open');
    const title = searchParams.get('title');
    const message = searchParams.get('message');
    const expiresAt = searchParams.get('expiresAt');

    if (pushOpen !== '1' || !title || !message) {
      return;
    }

    const now = Date.now();
    const expiryTime = expiresAt ? new Date(expiresAt).getTime() : null;
    if (expiryTime && Number.isFinite(expiryTime) && expiryTime < now) {
      const next = new URLSearchParams(searchParams);
      next.delete('push_open');
      next.delete('title');
      next.delete('message');
      next.delete('expiresAt');
      setSearchParams(next, { replace: true });
      return;
    }

    const dismissKey = `push-open-dismissed:${title}:${message}:${expiresAt || 'none'}`;
    if (sessionStorage.getItem(dismissKey) === '1') {
      return;
    }

    setPushOpenedNotification({
      title,
      message,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
  }, [searchParams, setSearchParams]);

  const handleOpenNotification = (item: AppNotification) => {
    setSelectedNotification(item);
    if (!item.isRead) {
      markReadMutation.mutate(item._id);
    }
  };

  const closePushOpenedModal = (dismissPermanently: boolean) => {
    const title = searchParams.get('title');
    const message = searchParams.get('message');
    const expiresAt = searchParams.get('expiresAt');

    if (dismissPermanently && title && message) {
      const dismissKey = `push-open-dismissed:${title}:${message}:${expiresAt || 'none'}`;
      sessionStorage.setItem(dismissKey, '1');
    }

    setPushOpenedNotification(null);

    const next = new URLSearchParams(searchParams);
    next.delete('push_open');
    next.delete('title');
    next.delete('message');
    next.delete('expiresAt');
    setSearchParams(next, { replace: true });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Latest updates from the last 24 hours</p>
          </div>
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Mark all as read
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">No recent notifications</p>
              <p className="text-sm text-gray-500">New updates in the last day will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((item) => (
                <div
                  key={item._id}
                  className={`p-5 cursor-pointer ${item.isRead ? 'bg-white' : 'bg-green-50/60'} hover:bg-gray-50`}
                  onClick={() => handleOpenNotification(item)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-gray-900">{item.title}</h2>
                        {!item.isRead && <span className="w-2 h-2 rounded-full bg-red-500" aria-label="Unread" />}
                      </div>
                      <p className="text-sm text-gray-700">{item.message}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock3 className="w-3.5 h-3.5" />
                        {formatNotificationDate(item.createdAt)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenNotification(item);
                        }}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        View
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          markReadMutation.mutate(item._id);
                        }}
                        disabled={item.isRead || markReadMutation.isPending}
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {item.isRead ? 'Read' : 'Mark as read'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>
            Page {page} of {totalPages}
            {isFetching && !isLoading ? ' • Refreshing...' : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-xl bg-white border border-gray-200 shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Notification Details</h2>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <h3 className="text-base font-semibold text-gray-900">{selectedNotification.title}</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
                <p className="text-xs text-gray-500">{formatNotificationDate(selectedNotification.createdAt)}</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {pushOpenedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-xl bg-white border border-gray-200 shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Push Notification</h2>
                <button
                  onClick={() => closePushOpenedModal(false)}
                  className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <h3 className="text-base font-semibold text-gray-900">{pushOpenedNotification.title}</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{pushOpenedNotification.message}</p>
                <p className="text-xs text-gray-500">Opened from push</p>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => closePushOpenedModal(true)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Don't show again
                </button>
                <button
                  onClick={() => closePushOpenedModal(false)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
