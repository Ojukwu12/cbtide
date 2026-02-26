import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiResponse } from '../types';

// API base URL from environment or default
export const API_BASE_URL = ((import.meta as any).env.VITE_API_BASE_URL as string) || 'https://cbt-1nas.onrender.com';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Enable cookies for cross-origin requests
});

// Token management
let isRefreshing = false;
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const REFRESH_LOCK_KEY = 'auth:refresh-lock';
const REFRESH_EVENT_KEY = 'auth:refresh-event';
const REFRESH_LOCK_TTL_MS = 15000;
const REFRESH_WAIT_TIMEOUT_MS = 12000;
const tabId = `tab_${Math.random().toString(36).slice(2)}_${Date.now()}`;
let accessTokenMemory: string | null = localStorage.getItem(ACCESS_TOKEN_KEY);
let refreshTokenMemory: string | null = localStorage.getItem(REFRESH_TOKEN_KEY);

let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, accessToken: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(accessToken);
    }
  });

  failedQueue = [];
};

const isAuthEndpoint = (url?: string): boolean => {
  const value = String(url || '').toLowerCase();
  return (
    value.includes('/api/auth/login') ||
    value.includes('/api/auth/register') ||
    value.includes('/api/auth/refresh') ||
    value.includes('/api/auth/logout') ||
    value.includes('/api/auth/verify-email') ||
    value.includes('/api/auth/resend-verification-email') ||
    value.includes('/api/auth/forgot-password') ||
    value.includes('/api/auth/reset-password')
  );
};

const emitAuthEvent = (eventName: 'auth:logout' | 'auth:token-updated') => {
  window.dispatchEvent(new Event(eventName));
};

const setRefreshLock = () => {
  const payload = {
    owner: tabId,
    expiresAt: Date.now() + REFRESH_LOCK_TTL_MS,
  };
  localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify(payload));
};

const clearRefreshLock = () => {
  const raw = localStorage.getItem(REFRESH_LOCK_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.owner === tabId) {
      localStorage.removeItem(REFRESH_LOCK_KEY);
    }
  } catch {
    localStorage.removeItem(REFRESH_LOCK_KEY);
  }
};

const isAnotherTabRefreshing = (): boolean => {
  const raw = localStorage.getItem(REFRESH_LOCK_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    const owner = String(parsed?.owner || '');
    const expiresAt = Number(parsed?.expiresAt || 0);
    const lockValid = expiresAt > Date.now();

    if (!lockValid) {
      localStorage.removeItem(REFRESH_LOCK_KEY);
      return false;
    }

    return owner !== tabId;
  } catch {
    localStorage.removeItem(REFRESH_LOCK_KEY);
    return false;
  }
};

const publishRefreshResult = (status: 'success' | 'failure', accessToken?: string) => {
  localStorage.setItem(
    REFRESH_EVENT_KEY,
    JSON.stringify({
      status,
      accessToken: accessToken || null,
      owner: tabId,
      ts: Date.now(),
    })
  );
};

const waitForRefreshResultFromOtherTab = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener('storage', onStorage);
      reject(new Error('Timed out waiting for refresh from another tab'));
    }, REFRESH_WAIT_TIMEOUT_MS);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== REFRESH_EVENT_KEY || !event.newValue) return;

      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.owner === tabId) return;

        if (parsed?.status === 'success' && typeof parsed?.accessToken === 'string') {
          window.clearTimeout(timeout);
          window.removeEventListener('storage', onStorage);
          setTokens(parsed.accessToken);
          resolve(parsed.accessToken);
          return;
        }

        if (parsed?.status === 'failure') {
          window.clearTimeout(timeout);
          window.removeEventListener('storage', onStorage);
          reject(new Error('Refresh failed in another tab'));
        }
      } catch {
        // Ignore malformed storage events
      }
    };

    window.addEventListener('storage', onStorage);
  });
};

const applyFriendlyErrorMessage = (error: AxiosError<ApiError>) => {
  const status = Number(error.response?.status || 0);
  if (!status || !error.response) return;

  const requestUrl = String(error.config?.url || '').toLowerCase();
  const responseData: any = error.response.data || {};
  const rawMessage = String(responseData?.message || error.message || '').toLowerCase();

  if (status === 429) {
    const retryAfterRaw = (error.response.headers as any)?.['retry-after'];
    const retryAfterSeconds = Number(retryAfterRaw);
    const retryHint = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? ` Please wait about ${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'} and try again.`
      : ' Please wait a moment and try again.';

    (error.response as any).data = {
      ...responseData,
      message: `Too many requests right now.${retryHint}`,
    };
    return;
  }

  if (status === 401 && !isAuthEndpoint(requestUrl)) {
    const isRoleRelated =
      rawMessage.includes('role') ||
      rawMessage.includes('permission') ||
      rawMessage.includes('forbidden') ||
      rawMessage.includes('not authorized') ||
      rawMessage.includes('not allowed');

    (error.response as any).data = {
      ...responseData,
      message: isRoleRelated
        ? 'You do not have permission to perform this action with your current account.'
        : 'Your session has expired. Please log in again to continue.',
    };
  }
};

export const getAccessToken = (): string | null => {
  return accessTokenMemory || localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return refreshTokenMemory || localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken: string, refreshToken?: string) => {
  accessTokenMemory = accessToken;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (typeof refreshToken === 'string' && refreshToken.trim()) {
    refreshTokenMemory = refreshToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  emitAuthEvent('auth:token-updated');
};

export const clearTokens = () => {
  accessTokenMemory = null;
  refreshTokenMemory = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  delete apiClient.defaults.headers.common.Authorization;
  emitAuthEvent('auth:logout');
};

const extractTokensFromRefreshResponse = (payload: any): { accessToken: string | null; refreshToken: string | null } => {
  const base = payload?.data?.data ?? payload?.data?.result ?? payload?.data ?? payload ?? {};
  const tokenContainer = base?.tokens ?? base?.auth ?? base?.jwt ?? {};

  const accessToken =
    base?.token ??
    base?.accessToken ??
    tokenContainer?.token ??
    tokenContainer?.accessToken ??
    null;
  const refreshToken =
    base?.refreshToken ??
    tokenContainer?.refreshToken ??
    null;

  return {
    accessToken: typeof accessToken === 'string' && accessToken.trim() ? accessToken : null,
    refreshToken: typeof refreshToken === 'string' && refreshToken.trim() ? refreshToken : null,
  };
};

const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({
        resolve: (token) => {
          if (token) {
            resolve(token);
            return;
          }
          reject(new Error('Token refresh completed without access token'));
        },
        reject,
      });
    });
  }

  if (isAnotherTabRefreshing()) {
    const tokenFromOtherTab = await waitForRefreshResultFromOtherTab();
    if (!tokenFromOtherTab) {
      throw new Error('No access token received from another tab refresh');
    }
    return tokenFromOtherTab;
  }

  isRefreshing = true;
  setRefreshLock();

  try {
    const refreshToken = getRefreshToken();
    const refreshEndpoints = [
      `${API_BASE_URL}/api/auth/refresh`,
      `${API_BASE_URL}/auth/refresh`,
    ];

    const refreshAttempts: Array<{
      body: Record<string, any>;
      headers?: Record<string, string>;
    }> = [];

    if (refreshToken) {
      refreshAttempts.push(
        {
          body: { refreshToken },
        },
        {
          body: { token: refreshToken },
        },
        {
          body: { refresh_token: refreshToken },
        },
        {
          body: {},
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
        {
          body: {},
          headers: { 'x-refresh-token': refreshToken },
        }
      );
    }

    refreshAttempts.push({ body: {} });

    let lastRefreshError: unknown;

    for (const endpoint of refreshEndpoints) {
      for (const attempt of refreshAttempts) {
        try {
          const response = await axios.post<ApiResponse<{ token?: string; accessToken?: string; refreshToken?: string }>>(
            endpoint,
            attempt.body,
            {
              withCredentials: true,
              timeout: 10000,
              headers: {
                'Content-Type': 'application/json',
                ...(attempt.headers || {}),
              },
            }
          );

          const {
            accessToken: refreshedAccessToken,
            refreshToken: refreshedRefreshToken,
          } = extractTokensFromRefreshResponse(response);

          if (!refreshedAccessToken) {
            continue;
          }

          setTokens(refreshedAccessToken, refreshedRefreshToken ?? undefined);
          publishRefreshResult('success', refreshedAccessToken);
          processQueue(null, refreshedAccessToken);
          return refreshedAccessToken;
        } catch (refreshError) {
          lastRefreshError = refreshError;

          if (!axios.isAxiosError(refreshError)) {
            continue;
          }

          const status = Number(refreshError.response?.status || 0);
          if (status && status !== 400 && status !== 401 && status !== 403 && status !== 404) {
            throw refreshError;
          }
        }
      }
    }

    throw lastRefreshError || new Error('Token refresh failed');
  } catch (refreshError) {
    let refreshStatus = 0;
    if (axios.isAxiosError(refreshError)) {
      refreshStatus = Number(refreshError.response?.status || 0);
    }

    if (refreshStatus === 401 || refreshStatus === 403) {
      clearTokens();
    }

    publishRefreshResult('failure');
    processQueue(refreshError, null);
    throw refreshError;
  } finally {
    isRefreshing = false;
    clearRefreshLock();
  }
};

export const trySilentRefresh = async (): Promise<boolean> => {
  try {
    await refreshAccessToken();
    return true;
  } catch {
    return false;
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (!config.headers) {
      config.headers = {} as any;
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    applyFriendlyErrorMessage(error);
    console.warn('[auth] Axios response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const requestUrl = String(originalRequest?.url || '').toLowerCase();

    // If error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(requestUrl)
    ) {
      console.warn('[auth] 401 detected, attempting token refresh...');
      if (isRefreshing) {
        console.warn('[auth] Token is already refreshing, queuing request...');
        // If already refreshing, queue this request
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (token) {
                resolve(token);
                return;
              }
              reject(new Error('Token refresh completed without access token'));
            },
            reject,
          });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        console.log('[auth] Token refresh successful');

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('[auth] Token refresh failed:', refreshError);
        // Don't redirect here - let the ProtectedRoute handle the redirect
        // This gives the app a chance to gracefully show a login prompt
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = Number(error.response?.status || 0);
    if (status === 429) {
      return 'Too many requests right now. Please wait a moment and try again.';
    }
    if (status === 401 && !isAuthEndpoint(error.config?.url)) {
      const rawMessage = String((error.response?.data as any)?.message || '').toLowerCase();
      const isRoleRelated =
        rawMessage.includes('role') ||
        rawMessage.includes('permission') ||
        rawMessage.includes('forbidden') ||
        rawMessage.includes('not authorized') ||
        rawMessage.includes('not allowed');
      return isRoleRelated
        ? 'You do not have permission to perform this action with your current account.'
        : 'Your session has expired. Please log in again to continue.';
    }

    const apiError = error.response?.data as ApiError;
    if (apiError?.message) {
      return apiError.message;
    }
    if (apiError?.errors) {
      const firstError = Object.values(apiError.errors)[0];
      return firstError?.[0] || 'An error occurred';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default apiClient;
