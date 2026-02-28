import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiResponse } from '../types';

// API base URL from environment or default
export const API_BASE_URL = ((import.meta as any).env.VITE_API_BASE_URL as string) || 'https://cbt-1nas.onrender.com';
const IS_PRODUCTION = String((import.meta as any).env?.MODE || '').toLowerCase() === 'production';

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
const LEGACY_ACCESS_TOKEN_KEYS = ['token', 'access_token'];
const LEGACY_REFRESH_TOKEN_KEYS = ['refresh_token', 'rtoken'];
const REFRESH_LOCK_KEY = 'auth:refresh-lock';
const REFRESH_EVENT_KEY = 'auth:refresh-event';
const REFRESH_LOCK_TTL_MS = 15000;
const REFRESH_WAIT_TIMEOUT_MS = 12000;
const REFRESH_FAILURE_COOLDOWN_MS = 15000;
const REFRESH_REQUEST_MAX_ATTEMPTS = 3;
const REFRESH_RETRY_BASE_DELAY_MS = 500;
const ENABLE_AUTH_REFRESH_DEBUG =
  String((import.meta as any).env?.VITE_AUTH_REFRESH_DEBUG ?? 'false').toLowerCase() === 'true';
const tabId = `tab_${Math.random().toString(36).slice(2)}_${Date.now()}`;

const tokenFingerprint = (token: string | null): string => {
  if (!token) return 'none';

  let checksum = 0;
  for (let index = 0; index < token.length; index += 1) {
    checksum = (checksum * 31 + token.charCodeAt(index)) % 1000000007;
  }

  return `len:${token.length}|crc:${checksum.toString(16)}`;
};

const logRefreshDebug = (message: string, payload: Record<string, unknown>) => {
  if (!ENABLE_AUTH_REFRESH_DEBUG) return;
  console.debug(message, payload);
};

const getStoredTokenByKeys = (keys: string[]): string | null => {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return null;
};

const normalizeToken = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const setAuthorizationHeader = (headers: Record<string, any>, tokenCandidate: unknown) => {
  const normalizedToken = normalizeToken(tokenCandidate);
  if (normalizedToken) {
    headers.Authorization = `Bearer ${normalizedToken}`;
    return;
  }
  if ('Authorization' in headers) {
    delete headers.Authorization;
  }
};

const sanitizeRefreshToken = (refreshCandidate: unknown, accessCandidate?: unknown): string | null => {
  const refreshToken = normalizeToken(refreshCandidate);
  const accessToken = normalizeToken(accessCandidate);

  if (!refreshToken) {
    return null;
  }

  if (accessToken && refreshToken === accessToken) {
    return null;
  }

  return refreshToken;
};

const clearStoredRefreshTokens = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('rtoken');
};

const validateProductionTransportAndCookiePolicy = () => {
  if (!IS_PRODUCTION) {
    return;
  }

  const browserProtocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const apiIsHttps = /^https:\/\//i.test(API_BASE_URL);
  const browserIsHttps = browserProtocol === 'https:' || isLocalhost;

  if (!apiIsHttps || !browserIsHttps) {
    console.error(
      '[auth] Production refresh-cookie policy misaligned: both frontend origin and API base URL must be HTTPS, and backend cookies should use SameSite=None; Secure for cross-site refresh.'
    );
  }
};

validateProductionTransportAndCookiePolicy();

let accessTokenMemory: string | null = getStoredTokenByKeys([ACCESS_TOKEN_KEY, ...LEGACY_ACCESS_TOKEN_KEYS]);
const initialStoredRefreshToken = getStoredTokenByKeys([REFRESH_TOKEN_KEY, ...LEGACY_REFRESH_TOKEN_KEYS]);
let refreshTokenMemory: string | null = sanitizeRefreshToken(initialStoredRefreshToken, accessTokenMemory);
let refreshFailureCooldownUntil = 0;
let refreshFailureCooldownSession: string | null = null;

if (initialStoredRefreshToken && !refreshTokenMemory) {
  clearStoredRefreshTokens();
}

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

const getCurrentSessionSignature = (): string => {
  return `${tokenFingerprint(getAccessToken())}|${tokenFingerprint(getRefreshToken())}`;
};

const resetRefreshFailureCooldown = () => {
  refreshFailureCooldownUntil = 0;
  refreshFailureCooldownSession = null;
};

const activateRefreshFailureCooldown = () => {
  refreshFailureCooldownUntil = Date.now() + REFRESH_FAILURE_COOLDOWN_MS;
  refreshFailureCooldownSession = getCurrentSessionSignature();
};

const isRefreshFailureCooldownActive = (): boolean => {
  if (!refreshFailureCooldownSession) {
    return false;
  }

  if (Date.now() >= refreshFailureCooldownUntil) {
    resetRefreshFailureCooldown();
    return false;
  }

  return refreshFailureCooldownSession === getCurrentSessionSignature();
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
  return accessTokenMemory || getStoredTokenByKeys([ACCESS_TOKEN_KEY, ...LEGACY_ACCESS_TOKEN_KEYS]);
};

export const getRefreshToken = (): string | null => {
  const accessToken = getAccessToken();
  const refreshToken = sanitizeRefreshToken(
    refreshTokenMemory || getStoredTokenByKeys([REFRESH_TOKEN_KEY, ...LEGACY_REFRESH_TOKEN_KEYS]),
    accessToken
  );

  if (!refreshToken) {
    refreshTokenMemory = null;
    clearStoredRefreshTokens();
    return null;
  }

  return refreshToken;
};

export const setTokens = (accessToken: string, refreshToken?: string) => {
  const normalizedAccessToken = normalizeToken(accessToken);
  if (!normalizedAccessToken) {
    throw new Error('Cannot set empty access token');
  }

  accessTokenMemory = normalizedAccessToken;
  localStorage.setItem(ACCESS_TOKEN_KEY, normalizedAccessToken);
  localStorage.setItem('token', normalizedAccessToken);

  const sanitizedRefreshToken = sanitizeRefreshToken(refreshToken, normalizedAccessToken);
  if (sanitizedRefreshToken) {
    refreshTokenMemory = sanitizedRefreshToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, sanitizedRefreshToken);
    localStorage.setItem('refresh_token', sanitizedRefreshToken);
  } else {
    refreshTokenMemory = null;
    clearStoredRefreshTokens();
  }

  setAuthorizationHeader(apiClient.defaults.headers.common as Record<string, any>, normalizedAccessToken);
  resetRefreshFailureCooldown();
  emitAuthEvent('auth:token-updated');
};

export const clearTokens = () => {
  accessTokenMemory = null;
  refreshTokenMemory = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  clearStoredRefreshTokens();
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  delete apiClient.defaults.headers.common.Authorization;
  resetRefreshFailureCooldown();
  emitAuthEvent('auth:logout');
};

const extractTokensFromRefreshResponse = (payload: any): { accessToken: string | null; refreshToken: string | null } => {
  const base = payload?.data?.data ?? payload?.data?.result ?? payload?.data ?? payload ?? {};
  const tokenContainer = base?.tokens ?? base?.auth ?? base?.jwt ?? {};

  const accessToken =
    base?.token ??
    base?.accessToken ??
    base?.access_token ??
    tokenContainer?.token ??
    tokenContainer?.accessToken ??
    tokenContainer?.access_token ??
    null;
  const refreshToken =
    base?.refreshToken ??
    base?.refresh_token ??
    tokenContainer?.refreshToken ??
    tokenContainer?.refresh_token ??
    null;

  return {
    accessToken: typeof accessToken === 'string' && accessToken.trim() ? accessToken : null,
    refreshToken: typeof refreshToken === 'string' && refreshToken.trim() ? refreshToken : null,
  };
};

const isTransientRefreshError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return true;
  }

  if (!error.response) {
    return true;
  }

  const code = String(error.code || '').toUpperCase();
  return code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ERR_NETWORK';
};

const isDefinitiveInvalidRefreshError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = Number(error.response?.status || 0);
  if (status === 401 || status === 403) {
    return true;
  }

  if (status !== 400) {
    return false;
  }

  const payloadMessage = String((error.response?.data as any)?.message || '').toLowerCase();
  return (
    payloadMessage.includes('invalid refresh') ||
    payloadMessage.includes('refresh token invalid') ||
    payloadMessage.includes('refresh token expired') ||
    payloadMessage.includes('token expired')
  );
};

const isRetryableRefreshError = (error: unknown): boolean => {
  if (isTransientRefreshError(error)) {
    return true;
  }

  if (!axios.isAxiosError(error)) {
    return true;
  }

  const status = Number(error.response?.status || 0);
  return status === 408 || status === 429 || status >= 500;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const hasRefreshToken = Boolean(refreshToken && refreshToken.trim());

    const refreshHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (hasRefreshToken && refreshToken) {
      refreshHeaders['x-refresh-token'] = refreshToken;
    }

    const refreshBody = hasRefreshToken && refreshToken ? { refreshToken } : {};
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= REFRESH_REQUEST_MAX_ATTEMPTS; attempt += 1) {
      try {
        const requestHeaders: Record<string, string> = {
          ...refreshHeaders,
        };
        if (hasRefreshToken && refreshToken) {
          setAuthorizationHeader(requestHeaders, refreshToken);
        }

        logRefreshDebug('[auth] Refresh attempt started', {
          attempt,
          hasRefreshToken,
          withCredentials: true,
          refreshTokenFingerprint: tokenFingerprint(refreshToken),
          accessTokenFingerprint: tokenFingerprint(getAccessToken()),
          hasAuthorizationHeader: Boolean(requestHeaders.Authorization),
        });

        const response = await axios.post<ApiResponse<{ accessToken?: string; refreshToken?: string; expiresIn?: number }>>(
          `${API_BASE_URL}/api/auth/refresh`,
          refreshBody,
          {
            withCredentials: true,
            timeout: 12000,
            headers: requestHeaders,
          }
        );

        const {
          accessToken: refreshedAccessToken,
          refreshToken: refreshedRefreshToken,
        } = extractTokensFromRefreshResponse(response);

        if (!refreshedAccessToken) {
          throw new Error('Token refresh completed without access token');
        }

        logRefreshDebug('[auth] Refresh attempt succeeded', {
          attempt,
          sentRefreshTokenFingerprint: tokenFingerprint(refreshToken),
          newAccessTokenFingerprint: tokenFingerprint(refreshedAccessToken),
          newRefreshTokenFingerprint: tokenFingerprint(refreshedRefreshToken),
        });

        setTokens(refreshedAccessToken, refreshedRefreshToken ?? undefined);
        resetRefreshFailureCooldown();
        publishRefreshResult('success', refreshedAccessToken);
        processQueue(null, refreshedAccessToken);
        return refreshedAccessToken;
      } catch (attemptError) {
        lastError = attemptError;

        if (axios.isAxiosError(attemptError)) {
          logRefreshDebug('[auth] Refresh attempt failed', {
            attempt,
            status: attemptError.response?.status,
            code: attemptError.code,
            message: attemptError.message,
            refreshTokenFingerprint: tokenFingerprint(refreshToken),
          });
        } else {
          logRefreshDebug('[auth] Refresh attempt failed', {
            attempt,
            message: attemptError instanceof Error ? attemptError.message : String(attemptError),
            refreshTokenFingerprint: tokenFingerprint(refreshToken),
          });
        }

        if (isDefinitiveInvalidRefreshError(attemptError)) {
          break;
        }

        const canRetry = isRetryableRefreshError(attemptError) && attempt < REFRESH_REQUEST_MAX_ATTEMPTS;
        if (!canRetry) {
          break;
        }

        const backoffMs = REFRESH_RETRY_BASE_DELAY_MS * attempt;
        await delay(backoffMs);
      }
    }

    throw lastError || new Error('Token refresh failed after all attempts');
  } catch (refreshError) {
    if (isDefinitiveInvalidRefreshError(refreshError)) {
      clearTokens();
    } else {
      activateRefreshFailureCooldown();
    }

    publishRefreshResult('failure');
    processQueue(refreshError, null);
    throw refreshError;
  } finally {
    isRefreshing = false;
    clearRefreshLock();
  }
};

export type SilentRefreshResult = 'success' | 'invalid' | 'transient';

export const trySilentRefreshDetailed = async (): Promise<SilentRefreshResult> => {
  try {
    await refreshAccessToken();
    return 'success';
  } catch (error) {
    return isDefinitiveInvalidRefreshError(error) ? 'invalid' : 'transient';
  }
};

export const trySilentRefresh = async (): Promise<boolean> => {
  const result = await trySilentRefreshDetailed();
  return result === 'success';
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (!config.headers) {
      config.headers = {} as any;
    }
    setAuthorizationHeader(config.headers as Record<string, any>, token);
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
      const hasSessionHint = Boolean(getAccessToken() || getRefreshToken());
      if (!hasSessionHint) {
        return Promise.reject(error);
      }

      if (isRefreshFailureCooldownActive()) {
        console.warn('[auth] Skipping refresh attempt because cooldown is active for current session');
        return Promise.reject(error);
      }

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
            if (originalRequest.headers) {
              setAuthorizationHeader(originalRequest.headers as Record<string, any>, token);
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
          setAuthorizationHeader(originalRequest.headers as Record<string, any>, accessToken);
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
