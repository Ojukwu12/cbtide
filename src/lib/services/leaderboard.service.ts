import apiClient from '../api';
import {
  ApiResponse,
  LeaderboardResponse,
} from '../../types';

export const leaderboardService = {
  async getLeaderboard(params?: {
    universityId?: string;
    page?: number;
    limit?: number;
  }): Promise<LeaderboardResponse> {
    const response = await apiClient.get<ApiResponse<LeaderboardResponse>>(
      '/api/leaderboards',
      { params }
    );
    return response.data.data;
  },
};
