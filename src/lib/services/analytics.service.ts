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

const toArray = <T = any>(value: any): T[] => (Array.isArray(value) ? value : []);

const toNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const extractArrayPayload = <T = any>(payload: any): T[] => {
  const unwrapped = unwrapPayload<any>(payload);
  if (Array.isArray(unwrapped)) return unwrapped as T[];
  return toArray<T>(
    unwrapped?.data ??
      unwrapped?.items ??
      unwrapped?.results ??
      unwrapped?.list ??
      unwrapped?.trends ??
      unwrapped?.records
  );
};

export const analyticsService = {
  // Student Analytics
  async getDashboard(): Promise<DashboardAnalytics> {
    const response = await apiClient.get<ApiResponse<DashboardAnalytics>>(
      '/api/analytics/dashboard'
    );
    const payload = unwrapPayload<any>(response.data) ?? {};
    console.log('[DEBUG] Analytics Dashboard Raw Response:', response.data);
    console.log('[DEBUG] Analytics Dashboard Unwrapped Payload:', payload);
    return {
      ...payload,
      examsTaken: toNumber(payload?.examsTaken ?? payload?.totalExamsTaken ?? payload?.examsCount, 0),
      averageScore: toNumber(payload?.averageScore ?? payload?.avgScore ?? payload?.scoreAverage, 0),
      accuracy: toNumber(payload?.accuracy ?? payload?.averageAccuracy ?? payload?.accuracyRate, 0),
      totalTimeSpent: toNumber(payload?.totalTimeSpent ?? payload?.timeSpent ?? payload?.studyMinutes, 0),
      recentExams: toArray(payload?.recentExams ?? payload?.recentExamSessions ?? payload?.history),
      strongAreas: toArray(payload?.strongAreas ?? payload?.strengths ?? payload?.strongTopics),
      weakAreas: toArray(payload?.weakAreas ?? payload?.weaknesses ?? payload?.weakTopics),
      rank: payload?.rank ?? payload?.leaderboardRank,
      improvement: {
        examsTaken: toNumber(payload?.improvement?.examsTaken ?? payload?.improvement?.examCount ?? payload?.examGrowth, 0),
        averageScore: toNumber(payload?.improvement?.averageScore ?? payload?.improvement?.score ?? payload?.scoreGrowth, 0),
        accuracy: toNumber(payload?.improvement?.accuracy ?? payload?.improvement?.accuracyRate ?? payload?.accuracyGrowth, 0),
      },
    } as DashboardAnalytics;
  },

  async getTopicAnalytics(topicId: string): Promise<TopicPerformance> {
    const response = await apiClient.get<ApiResponse<TopicPerformance>>(
      `/api/analytics/topic/${topicId}`
    );
    return unwrapPayload<TopicPerformance>(response.data);
  },

  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    const response = await apiClient.get<ApiResponse<CourseAnalytics>>(
      `/api/analytics/course/${courseId}`
    );
    const payload = unwrapPayload<any>(response.data) ?? {};
    return {
      ...payload,
      topics: toArray(payload?.topics ?? payload?.topicAnalytics ?? payload?.topicPerformance),
      overallScore: toNumber(payload?.overallScore ?? payload?.averageScore ?? payload?.score, 0),
      overallAccuracy: toNumber(payload?.overallAccuracy ?? payload?.accuracy ?? payload?.accuracyRate, 0),
      examsTaken: toNumber(payload?.examsTaken ?? payload?.totalExamsTaken ?? payload?.examCount, 0),
    } as CourseAnalytics;
  },

  async getTrends(): Promise<TrendData[]> {
    const response = await apiClient.get<ApiResponse<TrendData[]>>(
      '/api/analytics/trends'
    );
    return extractArrayPayload<TrendData>(response.data);
  },

  async getWeakAreas(): Promise<TopicPerformance[]> {
    const response = await apiClient.get<ApiResponse<TopicPerformance[]>>(
      '/api/analytics/weak-areas'
    );
    return extractArrayPayload<TopicPerformance>(response.data);
  },

  async getStrongAreas(): Promise<TopicPerformance[]> {
    const response = await apiClient.get<ApiResponse<TopicPerformance[]>>(
      '/api/analytics/strong-areas'
    );
    return extractArrayPayload<TopicPerformance>(response.data);
  },

  async getRecommendations(): Promise<Recommendation[]> {
    const response = await apiClient.get<ApiResponse<Recommendation[]>>(
      '/api/analytics/recommendations'
    );
    return extractArrayPayload<Recommendation>(response.data);
  },

  async getMonthlyAnalytics(): Promise<MonthlyAnalytics[]> {
    const response = await apiClient.get<ApiResponse<MonthlyAnalytics[]>>(
      '/api/analytics/monthly'
    );
    return extractArrayPayload<MonthlyAnalytics>(response.data);
  },

  async getLeaderboardPosition(): Promise<{ rank: number; percentile: number }> {
    const response = await apiClient.get<ApiResponse<{ rank: number; percentile: number }>>(
      '/api/analytics/leaderboard/position'
    );
    const payload = unwrapPayload<any>(response.data) ?? {};
    return {
      rank: toNumber(payload?.rank ?? payload?.position ?? payload?.userRank, 0),
      percentile: toNumber(payload?.percentile ?? payload?.percentileRank ?? payload?.topPercentile, 0),
    };
  },
};

export const adminAnalyticsService = {
  async getOverview(): Promise<AdminOverview> {
    const response = await apiClient.get<ApiResponse<AdminOverview>>(
      '/api/admin/analytics/overview'
    );
    return unwrapPayload<AdminOverview>(response.data);
  },

  async getUserAnalytics(): Promise<UserAnalytics> {
    const response = await apiClient.get<ApiResponse<UserAnalytics>>(
      '/api/admin/analytics/users'
    );
    return unwrapPayload<UserAnalytics>(response.data);
  },

  async getPerformanceAnalytics(): Promise<PerformanceAnalytics> {
    const response = await apiClient.get<ApiResponse<PerformanceAnalytics>>(
      '/api/admin/analytics/performance'
    );
    return unwrapPayload<PerformanceAnalytics>(response.data);
  },

  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const response = await apiClient.get<ApiResponse<RevenueAnalytics>>(
      '/api/admin/analytics/revenue'
    );
    return unwrapPayload<RevenueAnalytics>(response.data);
  },

  async getQuestionAnalytics(): Promise<QuestionAnalytics> {
    const response = await apiClient.get<ApiResponse<QuestionAnalytics>>(
      '/api/admin/analytics/questions'
    );
    return unwrapPayload<QuestionAnalytics>(response.data);
  },

  async getExamAnalytics(): Promise<ExamAnalytics> {
    const response = await apiClient.get<ApiResponse<ExamAnalytics>>(
      '/api/admin/analytics/exams'
    );
    return unwrapPayload<ExamAnalytics>(response.data);
  },
};
