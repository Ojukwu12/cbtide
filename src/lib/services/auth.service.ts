import apiClient, { getRefreshToken } from '../api';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  ResendResetPasswordResponse,
  User,
} from '../../types';

export interface ResendVerificationResponse {
  email: string;
  canResendVerification?: boolean;
  resendVerificationEndpoint?: string;
  verificationEmailSent?: boolean;
}

export interface AuthProfileResponse {
  name: string;
  email: string;
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

const normalizeAuthResponse = (payload: any): AuthResponse => {
  const base = unwrapPayload<any>(payload) ?? {};
  const tokenContainer = base?.tokens ?? base?.auth ?? base?.jwt ?? {};

  return {
    user: base?.user ?? base?.profile,
    token:
      base?.token ??
      base?.access_token ??
      tokenContainer?.token ??
      tokenContainer?.accessToken ??
      tokenContainer?.access_token,
    accessToken:
      base?.accessToken ??
      base?.access_token ??
      tokenContainer?.accessToken ??
      tokenContainer?.access_token ??
      tokenContainer?.token,
    refreshToken:
      base?.refreshToken ??
      base?.refresh_token ??
      tokenContainer?.refreshToken ??
      tokenContainer?.refresh_token,
  };
};

export const authService = {
  buildPasswordResetPayload(data: PasswordResetRequest): Record<string, string> {
    const inferredOrigin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : undefined;

    const resolvedResetUrl = (data.resetUrl || data.redirectUrl || `${inferredOrigin || ''}/reset-password`).replace(/\/$/, '');
    const resolvedFrontendUrl = data.frontendUrl || inferredOrigin;

    const payload: Record<string, string> = {
      email: data.email,
    };

    if (resolvedResetUrl) {
      payload.resetUrl = resolvedResetUrl;
      payload.redirectUrl = resolvedResetUrl;
      payload.callbackUrl = resolvedResetUrl;
      payload.clientResetUrl = resolvedResetUrl;
      payload.passwordResetUrl = resolvedResetUrl;
    }

    if (resolvedFrontendUrl) {
      payload.frontendUrl = resolvedFrontendUrl;
      payload.clientUrl = resolvedFrontendUrl;
      payload.appUrl = resolvedFrontendUrl;
    }

    return payload;
  },

  // POST /auth/register
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/register',
      data
    );
    return normalizeAuthResponse(response.data);
  },

  // POST /auth/login
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/login',
      data
    );
    return normalizeAuthResponse(response.data);
  },

  // POST /auth/forgot-password
  async forgotPassword(data: PasswordResetRequest): Promise<void> {
    const payload = this.buildPasswordResetPayload(data);

    const endpoints = [
      '/api/auth/forgot-password',
      '/api/auth/request-password-reset',
      '/auth/forgot-password',
      '/auth/request-password-reset',
    ];

    let lastError: unknown;
    for (const endpoint of endpoints) {
      try {
        await apiClient.post(endpoint, payload);
        return;
      } catch (error: any) {
        lastError = error;
        const status = Number(error?.response?.status || 0);
        if (status && status !== 404) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Password reset endpoint not found');
  },

  // POST /auth/resend-reset-password
  async resendResetPassword(data: PasswordResetRequest): Promise<ResendResetPasswordResponse> {
    const payload = this.buildPasswordResetPayload(data);
    const endpoints = ['/api/auth/resend-reset-password', '/auth/resend-reset-password'];

    let lastError: unknown;
    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.post<ApiResponse<ResendResetPasswordResponse>>(endpoint, payload);
        return unwrapPayload<ResendResetPasswordResponse>(response.data);
      } catch (error: any) {
        lastError = error;
        const status = Number(error?.response?.status || 0);
        if (status && status !== 404) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Resend reset password endpoint not found');
  },

  // Alias used by ForgotPassword page
  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await this.forgotPassword(data);
  },

  // GET /auth/reset-password
  async verifyResetToken(email: string, token: string): Promise<{ isValid: boolean; email: string }> {
    const response = await apiClient.get<ApiResponse<{ isValid: boolean; email: string }>>(
      '/api/auth/reset-password',
      { params: { email, token } }
    );
    return response.data.data;
  },

  // POST /auth/reset-password
  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    const payload = {
      email: data.email,
      newPassword: data.newPassword || data.password,
      ...(data.token ? { token: data.token } : {}),
      ...(data.otp ? { otp: data.otp } : {}),
    };

    const endpoints = ['/api/auth/reset-password', '/auth/reset-password'];
    let lastError: unknown;

    for (const endpoint of endpoints) {
      try {
        await apiClient.post(endpoint, payload);
        return;
      } catch (error: any) {
        lastError = error;
        const status = Number(error?.response?.status || 0);
        if (status && status !== 404) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Reset password endpoint not found');
  },

  // GET /auth/verify-email
  async verifyEmail(token: string, email: string): Promise<{ email: string; isVerified: boolean }> {
    const response = await apiClient.get<ApiResponse<{ email: string; isVerified: boolean }>>(
      '/api/auth/verify-email',
      { params: { email, token } }
    );
    return response.data.data;
  },

  // POST /auth/resend-verification-email
  async resendVerificationEmail(data: PasswordResetRequest): Promise<ResendVerificationResponse> {
    const response = await apiClient.post<ApiResponse<ResendVerificationResponse>>(
      '/api/auth/resend-verification-email',
      data
    );
    return unwrapPayload<ResendVerificationResponse>(response.data);
  },

  // POST /auth/refresh
  async refreshToken(): Promise<{ accessToken: string; expiresIn: number }> {
    const refreshToken = getRefreshToken();
    const payload = refreshToken ? { refreshToken } : {};
    const response = await apiClient.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(
      '/api/auth/refresh',
      payload
    );
    return response.data.data;
  },

  // POST /auth/logout
  async logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    const payload = refreshToken ? { refreshToken } : {};
    await apiClient.post('/api/auth/logout', payload);
  },

  // GET /users/me (for profile retrieval)
  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/api/users/me');
    return response.data.data;
  },

  // GET /auth/profile
  async getProfile(): Promise<AuthProfileResponse> {
    const response = await apiClient.get<ApiResponse<AuthProfileResponse>>('/api/auth/profile');
    return unwrapPayload<AuthProfileResponse>(response.data);
  },
};
