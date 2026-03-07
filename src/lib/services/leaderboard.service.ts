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

const firstArray = (...values: any[]): any[] => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
};

const firstObject = (...values: any[]): Record<string, any> | null => {
  for (const value of values) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
  }
  return null;
};

const normalizeLeaderboardEntry = (raw: any, index = 0): LeaderboardEntry => {
  const firstName = String(raw?.firstName ?? raw?.user?.firstName ?? '').trim();
  const lastName = String(raw?.lastName ?? raw?.user?.lastName ?? '').trim();
  const computedName = `${firstName} ${lastName}`.trim();
  const rank =
    toNumber(raw?.rank, 0) ||
    toNumber(raw?.position, 0) ||
    toNumber(raw?.index, 0) ||
    index + 1;

  return {
    rank,
    userId: String(raw?.userId ?? raw?.id ?? raw?._id ?? raw?.user?._id ?? raw?.user?.id ?? ''),
    userName:
      String(raw?.userName ?? raw?.name ?? raw?.fullName ?? raw?.studentName ?? computedName).trim() ||
      'Anonymous User',
    universityId: String(raw?.universityId ?? raw?.university?._id ?? raw?.schoolId ?? ''),
    universityName:
      String(raw?.universityName ?? raw?.university?.name ?? raw?.university ?? raw?.schoolName ?? '').trim() ||
      '—',
    totalScore: toNumber(raw?.totalScore ?? raw?.score ?? raw?.points ?? raw?.totalPoints, 0),
    averageScore: toNumber(raw?.averageScore ?? raw?.avgScore ?? raw?.scoreAverage ?? raw?.score ?? raw?.percentage, 0),
    examsTaken: toNumber(raw?.examsTaken ?? raw?.examsCompleted ?? raw?.totalExams ?? raw?.examCount ?? raw?.attempts, 0),
    accuracy: toNumber(raw?.accuracy ?? raw?.percentile ?? raw?.successRate, 0),
  };
};

const normalizeLeaderboardResponse = (payload: any): LeaderboardResponse => {
  const root = payload ?? {};
  const data = root?.data;
  const nestedData = data?.data;
  const result = root?.result;
  const unwrapped = unwrapPayload<any>(payload);

  const directArray = firstArray(root, data, nestedData, result, unwrapped);
  if (directArray.length > 0) {
    const entries = directArray.map((entry, index) => normalizeLeaderboardEntry(entry, index));
    return {
      entries,
      total: entries.length,
    };
  }

  const entriesSource = firstArray(
    root?.entries,
    root?.rankings,
    root?.leaderboard,
    root?.rows,
    root?.leaders,
    root?.users,
    root?.items,
    root?.results,
    root?.results?.rows,
    root?.results?.entries,
    root?.results?.data,
    root?.leaderboard?.entries,
    root?.leaderboard?.data,
    data?.entries,
    data?.rankings,
    data?.leaderboard,
    data?.rows,
    data?.leaders,
    data?.users,
    data?.items,
    data?.results,
    data?.results?.rows,
    data?.results?.entries,
    data?.results?.data,
    nestedData?.entries,
    nestedData?.rankings,
    nestedData?.leaderboard,
    nestedData?.rows,
    nestedData?.leaders,
    nestedData?.users,
    nestedData?.items,
    nestedData?.results,
    nestedData?.results?.rows,
    nestedData?.results?.entries,
    nestedData?.results?.data,
    unwrapped?.entries,
    unwrapped?.rankings,
    unwrapped?.leaderboard,
    unwrapped?.rows,
    unwrapped?.leaders,
    unwrapped?.users,
    unwrapped?.items,
    unwrapped?.results,
    unwrapped?.results?.rows,
    unwrapped?.results?.entries,
    unwrapped?.results?.data
  );

  const entries = toArray(entriesSource).map((entry, index) => normalizeLeaderboardEntry(entry, index));
  const container = firstObject(root, data, nestedData, result, unwrapped) || {};
  const userPositionRaw =
    container?.userPosition ??
    container?.userRank ??
    container?.position ??
    container?.currentUserRank;
  const userPosition = userPositionRaw
    ? normalizeLeaderboardEntry(userPositionRaw, Math.max(toNumber(userPositionRaw?.rank, 1) - 1, 0))
    : undefined;

  return {
    entries,
    userPosition,
    total: toNumber(
      container?.total ??
        container?.count ??
        container?.metadata?.total ??
        container?.totalUsers ??
        container?.pagination?.total ??
        container?.meta?.total,
      entries.length
    ),
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

    const endpointCandidates = universityId
      ? [
          `/api/leaderboards/university/${universityId}`,
          `/api/leaderboard/university/${universityId}`,
          `/api/leaderboards?universityId=${encodeURIComponent(universityId)}`,
        ]
      : [
          '/api/leaderboards/global',
          '/api/leaderboard/global',
          '/api/leaderboards',
          '/api/leaderboard',
        ];

    let lastError: any;
    for (const endpoint of endpointCandidates) {
      try {
        const response = await apiClient.get<ApiResponse<LeaderboardResponse>>(endpoint, {
          params: endpoint.includes('?') ? undefined : { page, limit },
        });
        return normalizeLeaderboardResponse(response.data);
      } catch (error: any) {
        lastError = error;
        const status = Number(error?.response?.status || 0);
        if (status !== 404 && status !== 405) {
          throw error;
        }
      }
    }

    throw lastError;
  },
};
