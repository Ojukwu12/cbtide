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
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const setTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
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
    console.warn('[auth] Axios response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('[auth] 401 detected, attempting token refresh...');
      if (isRefreshing) {
        console.warn('[auth] Token is already refreshing, queuing request...');
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      console.warn('[auth] Starting token refresh process...');

      try {
        // Attempt to refresh token
        // Try to send refreshToken from localStorage in the request body
        const refreshToken = getRefreshToken();
        console.warn('[auth] Using refresh token:', refreshToken);
        if (!refreshToken) {
          console.error('[auth] No refresh token available, cannot refresh.');
          throw new Error('No refresh token available');
        }

        const refreshPayload = { refreshToken };
        const refreshUrl = `${API_BASE_URL}/api/auth/refresh`;
        console.warn('[auth] Sending refresh request to:', refreshUrl, 'with payload:', refreshPayload);
        const response = await axios.post<ApiResponse<{ token: string; refreshToken?: string }>>(
          refreshUrl,
          refreshPayload,
          { 
            withCredentials: true,
            timeout: 10000 // 10 second timeout for refresh
          }
        );

        const responseData = response.data?.data;
        console.warn('[auth] Refresh response data:', responseData);
        if (!responseData?.token) {
          console.error('[auth] No token in refresh response');
          throw new Error('No token in refresh response');
        }

        const { token: accessToken, refreshToken: newRefreshToken } = responseData;
        setTokens(accessToken, newRefreshToken);
        console.log('[auth] Token refresh successful');

        // Process queued requests
        processQueue();
        isRefreshing = false;

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('[auth] Token refresh failed:', refreshError);
        // Refresh failed - log detailed error information
        if (axios.isAxiosError(refreshError)) {
          console.error('Token refresh failed:', {
            status: refreshError.response?.status,
            message: refreshError.response?.data?.message || refreshError.message,
            data: refreshError.response?.data
          });
        } else {
          const errorMsg = refreshError instanceof Error ? refreshError.message : String(refreshError);
          console.error('Token refresh failed:', errorMsg);
        }
        
        processQueue(refreshError);
        isRefreshing = false;
        
        // Always clear tokens if refresh fails (tokens are expired)
        clearTokens();
        
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
