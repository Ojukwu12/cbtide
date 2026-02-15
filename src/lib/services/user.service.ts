import apiClient from '../api';
import { ApiResponse, User } from '../../types';

export const userService = {
  // GET /users/:id
  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      `/api/users/${id}`
    );
    return response.data.data;
  },

  // GET /users/me (profile of current user)
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      '/api/users/me'
    );
    return response.data.data;
  },
};
