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
  // POST /auth/register
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/register',
      data
    );
    return response.data.data;
  },

  // POST /auth/login
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/api/auth/login',
      data
    );
    return response.data.data;
  },

  // POST /auth/forgot-password
  async forgotPassword(data: PasswordResetRequest): Promise<void> {
    await apiClient.post('/api/auth/forgot-password', data);
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
    await apiClient.post('/api/auth/reset-password', data);
  },

  // GET /auth/verify-email
  async verifyEmail(email: string, token: string): Promise<{ email: string; isVerified: boolean }> {
    const response = await apiClient.get<ApiResponse<{ email: string; isVerified: boolean }>>(
      '/api/auth/verify-email',
      { params: { email, token } }
    );
    return response.data.data;
  },

  // POST /auth/resend-verification-email
  async resendVerificationEmail(data: PasswordResetRequest): Promise<void> {
    await apiClient.post('/api/auth/resend-verification-email', data);
  },

  // POST /auth/refresh
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(
      '/api/auth/refresh',
      { refreshToken }
    );
    return response.data.data;
  },

  // POST /auth/logout
  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  },

  // GET /users/me (for profile retrieval)
  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/api/users/me');
    return response.data.data;
  },
};
