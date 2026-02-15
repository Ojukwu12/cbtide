import apiClient from '../api';
import {
  ApiResponse,
  LeaderboardResponse,
} from '../../types';

export interface LeaderboardEntryResponse {
  rank: number;
  userId: string;
  firstName: string;
  lastName: string;
  score: number;
  totalExams: number;
  averageScore: number;
  university?: string;
  department?: string;
  badge?: string;
}

export interface LeaderboardDataResponse {
  data: LeaderboardEntryResponse[];
  userRank?: {
    rank: number;
    score: number;
    percentile: number;
  };
  metadata?: {
    universityName?: string;
    courseName?: string;
    month?: string;
    total: number;
  };
}

export const leaderboardService = {
  // GET /leaderboards/global
  async getGlobalLeaderboard(params?: {
    limit?: number;
    page?: number;
  }): Promise<LeaderboardDataResponse> {
    const response = await apiClient.get<ApiResponse<LeaderboardDataResponse>>(
      '/api/leaderboards/global',
      { params }
    );
    return response.data.data;
  },

  // GET /leaderboards/university/:universityId
  async getUniversityLeaderboard(
    universityId: string,
    params?: {
      limit?: number;
      page?: number;
    }
  ): Promise<LeaderboardDataResponse> {
    const response = await apiClient.get<ApiResponse<LeaderboardDataResponse>>(
      `/api/leaderboards/university/${universityId}`,
      { params }
    );
    return response.data.data;
  },

  // GET /leaderboards/course/:courseId
  async getCourseLeaderboard(
    courseId: string,
    params?: {
      limit?: number;
      page?: number;
    }
  ): Promise<LeaderboardDataResponse> {
    const response = await apiClient.get<ApiResponse<LeaderboardDataResponse>>(
      `/api/leaderboards/course/${courseId}`,
      { params }
    );
    return response.data.data;
  },

  // GET /leaderboards/monthly/:month
  async getMonthlyLeaderboard(
    month: string, // Format: YYYY-MM
    params?: {
      limit?: number;
      page?: number;
    }
  ): Promise<LeaderboardDataResponse> {
    const response = await apiClient.get<ApiResponse<LeaderboardDataResponse>>(
      `/api/leaderboards/monthly/${month}`,
      { params }
    );
    return response.data.data;
  },

  // Legacy: Generic leaderboard
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
