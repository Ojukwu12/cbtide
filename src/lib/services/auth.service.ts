import apiClient from '../api';
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  User,
} from '../../types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/register',
      data
    );
    return response.data.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/login',
      data
    );
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/api/auth/me');
    return response.data.data;
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/api/auth/verify-email', { token });
  },

  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await apiClient.post('/api/auth/request-password-reset', data);
  },

  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    await apiClient.post('/api/auth/reset-password', data);
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(
      '/api/auth/refresh-token',
      { refreshToken }
    );
    return response.data.data;
  },
};
