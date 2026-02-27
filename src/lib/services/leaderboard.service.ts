import apiClient from '../api';
import {
  ApiResponse,
  LeaderboardEntry,
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

const normalizeLeaderboardEntry = (raw: any, index = 0): LeaderboardEntry => {
  const firstName = String(raw?.firstName ?? raw?.user?.firstName ?? '').trim();
  const lastName = String(raw?.lastName ?? raw?.user?.lastName ?? '').trim();
  const computedName = `${firstName} ${lastName}`.trim();

  return {
    rank: toNumber(raw?.rank, index + 1),
    userId: String(raw?.userId ?? raw?.user?._id ?? raw?.user?.id ?? ''),
    userName:
      String(raw?.userName ?? raw?.name ?? computedName).trim() ||
      'Anonymous User',
    universityId: String(raw?.universityId ?? raw?.university?._id ?? ''),
    universityName:
      String(raw?.universityName ?? raw?.university ?? raw?.schoolName ?? '').trim() ||
      '—',
    totalScore: toNumber(raw?.totalScore ?? raw?.score, 0),
    averageScore: toNumber(raw?.averageScore ?? raw?.scoreAverage ?? raw?.score, 0),
    examsTaken: toNumber(raw?.examsTaken ?? raw?.totalExams ?? raw?.examCount, 0),
    accuracy: toNumber(raw?.accuracy ?? raw?.percentile, 0),
  };
};

const normalizeLeaderboardResponse = (payload: any): LeaderboardResponse => {
  const base = unwrapPayload<any>(payload) ?? {};
  const entriesSource =
    base?.entries ??
    base?.data ??
    base?.items ??
    base?.results ??
    [];

  const entries = toArray(entriesSource).map((entry, index) => normalizeLeaderboardEntry(entry, index));
  const userPositionRaw = base?.userPosition ?? base?.userRank ?? base?.position;
  const userPosition = userPositionRaw
    ? normalizeLeaderboardEntry(userPositionRaw, Math.max(toNumber(userPositionRaw?.rank, 1) - 1, 0))
    : undefined;

  return {
    entries,
    userPosition,
    total: toNumber(base?.total ?? base?.metadata?.total ?? base?.totalUsers, entries.length),
  };
};

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
    const { universityId, page, limit } = params || {};

    const endpoint = universityId
      ? `/api/leaderboards/university/${universityId}`
      : '/api/leaderboards/global';

    const response = await apiClient.get<ApiResponse<LeaderboardResponse>>(endpoint, {
      params: { page, limit },
    });

    return normalizeLeaderboardResponse(response.data);
  },
};
