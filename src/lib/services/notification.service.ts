import apiClient from '../api';
import { ApiResponse } from '../../types';

export type NotificationType = 'general' | 'announcement' | 'maintenance' | 'plan' | 'system';

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  data?: Record<string, unknown>;
  channels?: string[];
  expiresAt?: string | null;
}

export interface NotificationPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface NotificationListResult {
  notifications: AppNotification[];
  pagination: NotificationPagination;
}

export interface PushTokenPayload {
  token: string;
  platform?: 'android' | 'ios' | 'web' | 'unknown';
  deviceId?: string | null;
}

interface NotificationListPayload {
  notifications?: AppNotification[];
  items?: AppNotification[];
  data?: AppNotification[];
  pagination?: Partial<NotificationPagination>;
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

const unwrapPayload = <T = any>(payload: any): T => {
  if (payload && typeof payload === 'object') {
    if ('data' in payload && payload.data !== undefined) {
      return unwrapPayload<T>(payload.data);
    }
    if ('result' in payload && payload.result !== undefined) {
      return unwrapPayload<T>(payload.result);
    }
  }
  return payload as T;
};

const normalizeNotification = (item: any): AppNotification => ({
  _id: String(item?._id ?? item?.id ?? ''),
  title: String(item?.title ?? ''),
  message: String(item?.message ?? ''),
  type: (String(item?.type ?? 'general').toLowerCase() as NotificationType) || 'general',
  isRead: Boolean(item?.isRead),
  readAt: item?.readAt ?? null,
  createdAt: String(item?.createdAt ?? new Date(0).toISOString()),
  data: item?.data,
  channels: Array.isArray(item?.channels) ? item.channels : [],
  expiresAt: item?.expiresAt ?? null,
});

const normalizeListPayload = (payload: any): NotificationListResult => {
  const source = unwrapPayload<NotificationListPayload>(payload) ?? {};
  const notificationsSource =
    source.notifications ?? source.items ?? source.data ?? (Array.isArray(source) ? source : []);

  const notifications = Array.isArray(notificationsSource)
    ? notificationsSource.map(normalizeNotification).filter((item) => item._id)
    : [];

  const paginationSource = source.pagination ?? {};
  return {
    notifications,
    pagination: {
      total: Number(paginationSource.total ?? source.total ?? notifications.length) || notifications.length,
      page: Number(paginationSource.page ?? source.page ?? 1) || 1,
      limit: Number(paginationSource.limit ?? source.limit ?? notifications.length ?? 20) || 20,
      pages: Number(paginationSource.pages ?? source.pages ?? 1) || 1,
    },
  };
};

const detectPlatform = (): PushTokenPayload['platform'] => {
  if (typeof navigator === 'undefined') return 'unknown';
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('android')) return 'android';
  if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) return 'ios';
  if (userAgent.includes('windows') || userAgent.includes('mac') || userAgent.includes('linux')) return 'web';
  return 'unknown';
};

export const NOTIFICATION_PUSH_TOKEN_KEY = 'notification:push-token';

export const notificationService = {
  getStoredPushToken(): string | null {
    const token = localStorage.getItem(NOTIFICATION_PUSH_TOKEN_KEY);
    return typeof token === 'string' && token.trim() ? token : null;
  },

  setStoredPushToken(token: string) {
    localStorage.setItem(NOTIFICATION_PUSH_TOKEN_KEY, token);
  },

  clearStoredPushToken() {
    localStorage.removeItem(NOTIFICATION_PUSH_TOKEN_KEY);
  },

  async registerPushToken(payload: PushTokenPayload): Promise<void> {
    await apiClient.post('/api/notifications/push-token', {
      token: payload.token,
      platform: payload.platform || detectPlatform(),
      deviceId: payload.deviceId ?? null,
    });
  },

  async unregisterPushToken(token: string): Promise<void> {
    await apiClient.delete('/api/notifications/push-token', {
      data: { token },
    });
  },

  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  }): Promise<NotificationListResult> {
    const response = await apiClient.get<ApiResponse<NotificationListPayload>>('/api/notifications', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        unreadOnly: params?.unreadOnly ?? false,
        ...(params?.type ? { type: params.type } : {}),
      },
    });

    return normalizeListPayload(response.data);
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ unreadCount?: number }>>('/api/notifications/unread-count');
    const payload = unwrapPayload<{ unreadCount?: number }>(response.data) ?? {};
    return Number(payload.unreadCount ?? 0) || 0;
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/api/notifications/${notificationId}/read`);
  },

  async markAllNotificationsRead(): Promise<number> {
    const response = await apiClient.patch<ApiResponse<{ modifiedCount?: number }>>('/api/notifications/read-all');
    const payload = unwrapPayload<{ modifiedCount?: number }>(response.data) ?? {};
    return Number(payload.modifiedCount ?? 0) || 0;
  },
};
