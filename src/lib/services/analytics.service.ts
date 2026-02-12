import apiClient from '../api';
import {
  ApiResponse,
  DashboardAnalytics,
  TopicPerformance,
  CourseAnalytics,
  TrendData,
  MonthlyAnalytics,
  Recommendation,
  AdminOverview,
  UserAnalytics,
  PerformanceAnalytics,
  RevenueAnalytics,
  QuestionAnalytics,
  ExamAnalytics,
} from '../../types';

export const analyticsService = {
  // Student Analytics
  async getDashboard(): Promise<DashboardAnalytics> {
    const response = await apiClient.get<ApiResponse<DashboardAnalytics>>(
      '/api/analytics/dashboard'
    );
    return response.data.data;
  },

  async getTopicAnalytics(topicId: string): Promise<TopicPerformance> {
    const response = await apiClient.get<ApiResponse<TopicPerformance>>(
      `/api/analytics/topic/${topicId}`
    );
    return response.data.data;
  },

  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const response = await apiClient.get<ApiResponse<CourseAnalytics>>(
      `/api/analytics/course/${courseId}`
    );
    return response.data.data;
  },

  async getTrends(): Promise<TrendData[]> {
    const response = await apiClient.get<ApiResponse<TrendData[]>>(
      '/api/analytics/trends'
    );
    return response.data.data;
  },

  async getWeakAreas(): Promise<TopicPerformance[]> {
    const response = await apiClient.get<ApiResponse<TopicPerformance[]>>(
      '/api/analytics/weak-areas'
    );
    return response.data.data;
  },

  async getStrongAreas(): Promise<TopicPerformance[]> {
    const response = await apiClient.get<ApiResponse<TopicPerformance[]>>(
      '/api/analytics/strong-areas'
    );
    return response.data.data;
  },

  async getRecommendations(): Promise<Recommendation[]> {
    const response = await apiClient.get<ApiResponse<Recommendation[]>>(
      '/api/analytics/recommendations'
    );
    return response.data.data;
  },

  async getMonthlyAnalytics(): Promise<MonthlyAnalytics[]> {
    const response = await apiClient.get<ApiResponse<MonthlyAnalytics[]>>(
      '/api/analytics/monthly'
    );
    return response.data.data;
  },

  async getLeaderboardPosition(): Promise<{ rank: number; percentile: number }> {
    const response = await apiClient.get<ApiResponse<{ rank: number; percentile: number }>>(
      '/api/analytics/leaderboard/position'
    );
    return response.data.data;
  },
};

export const adminAnalyticsService = {
  async getOverview(): Promise<AdminOverview> {
    const response = await apiClient.get<ApiResponse<AdminOverview>>(
      '/api/admin/analytics/overview'
    );
    return response.data.data;
  },

  async getUserAnalytics(): Promise<UserAnalytics> {
    const response = await apiClient.get<ApiResponse<UserAnalytics>>(
      '/api/admin/analytics/users'
    );
    return response.data.data;
  },

  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    const response = await apiClient.get<ApiResponse<PerformanceAnalytics>>(
      '/api/admin/analytics/performance'
    );
    return response.data.data;
  },

  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const response = await apiClient.get<ApiResponse<RevenueAnalytics>>(
      '/api/admin/analytics/revenue'
    );
    return response.data.data;
  },

  async getQuestionAnalytics(): Promise<QuestionAnalytics> {
    const response = await apiClient.get<ApiResponse<QuestionAnalytics>>(
      '/api/admin/analytics/questions'
    );
    return response.data.data;
  },

  async getExamAnalytics(): Promise<ExamAnalytics> {
    const response = await apiClient.get<ApiResponse<ExamAnalytics>>(
      '/api/admin/analytics/exams'
    );
    return response.data.data;
  },
};
