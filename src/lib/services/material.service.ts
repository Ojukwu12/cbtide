import apiClient from '../api';
import {
  ApiResponse,
  Material,
} from '../../types';

const enableLegacyRouteFallback =
  String((import.meta as any).env?.VITE_ENABLE_LEGACY_ROUTE_FALLBACK || '').toLowerCase() === 'true';

export interface StudyMaterialResponse {
  data: Material[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface MaterialDownloadResponse {
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  expiresIn?: number;
  downloadedAt?: string;
}

export interface DownloadLimitStatus {
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  isUnlimited?: boolean;
  resetsAt?: string;
}

export interface MaterialRatingResponse {
  _id: string;
  title: string;
  rating: number;
  totalRatings: number;
  userRating: {
    userId: string;
    rating: number;
    comment?: string;
    ratedAt: string;
  };
}

export interface UpdateStudyMaterialRequest {
  title?: string;
  description?: string;
  topicId?: string;
  accessLevel?: 'free' | 'premium';
  isActive?: boolean;
}

// Helper to unwrap nested payloads
const unwrapPayload = <T>(payload: any): T => {
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

// Helper to normalize study material response with fallback extraction
const normalizeStudyMaterialResponse = (payload: any): StudyMaterialResponse => {
  const unwrapped = unwrapPayload<any>(payload);

  // Direct check for StudyMaterialResponse shape
  if (unwrapped && typeof unwrapped === 'object') {
    if (Array.isArray(unwrapped.data) && unwrapped.pagination) {
      return unwrapped as StudyMaterialResponse;
    }
    if (Array.isArray(unwrapped.materials) && unwrapped.pagination) {
      return { data: unwrapped.materials, pagination: unwrapped.pagination } as StudyMaterialResponse;
    }
    if (Array.isArray(unwrapped)) {
      return { data: unwrapped, pagination: { total: unwrapped.length, page: 1, limit: 100, pages: 1 } } as StudyMaterialResponse;
    }
  }

  // Fallback to empty response
  return {
    data: [],
    pagination: { total: 0, page: 1, limit: 100, pages: 0 },
  } as StudyMaterialResponse;
};

const preferredEndpointByRoute = new Map<string, string>();

const prioritizeEndpoints = (routeKey: string, endpoints: string[]): string[] => {
  const preferred = preferredEndpointByRoute.get(routeKey);
  if (!preferred) return endpoints;
  if (!endpoints.includes(preferred)) return endpoints;
  return [preferred, ...endpoints.filter((endpoint) => endpoint !== preferred)];
};

const rememberEndpoint = (routeKey: string, endpoint: string) => {
  preferredEndpointByRoute.set(routeKey, endpoint);
};

const withLegacyCandidates = <T>(primary: T[], legacy: T[] = []): T[] => {
  return enableLegacyRouteFallback ? [...primary, ...legacy] : primary;
};

const getStudyMaterialsWithFallback = async (
  routeKey: string,
  endpoints: string[],
  params?: Record<string, any>
): Promise<StudyMaterialResponse> => {
  for (const endpoint of prioritizeEndpoints(routeKey, endpoints)) {
    try {
      const response = await apiClient.get<ApiResponse<StudyMaterialResponse>>(endpoint, { params });
      rememberEndpoint(routeKey, endpoint);
      return normalizeStudyMaterialResponse(response.data);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  }

  return {
    data: [],
    pagination: { total: 0, page: Number(params?.page ?? 1), limit: Number(params?.limit ?? 20), pages: 0 },
  };
};

const withRoutePrefixFallback = (endpoint: string): string[] => {
  if (!enableLegacyRouteFallback) {
    return [endpoint];
  }
  if (endpoint.startsWith('/api/')) {
    return [endpoint, endpoint.replace('/api/', '/')];
  }
  return [endpoint, `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`];
};

const getSingleWithPrefixFallback = async <T>(endpoint: string): Promise<T> => {
  let lastError: any;
  for (const candidate of withRoutePrefixFallback(endpoint)) {
    try {
      const response = await apiClient.get<ApiResponse<T>>(candidate);
      return unwrapPayload<T>(response.data);
    } catch (error: any) {
      lastError = error;
      if (error?.response?.status !== 404) throw error;
    }
  }
  throw lastError;
};

const sendWithPrefixFallback = async <T>(
  method: 'post' | 'put' | 'patch' | 'delete',
  endpoint: string,
  body?: any
): Promise<T> => {
  let lastError: any;
  for (const candidate of withRoutePrefixFallback(endpoint)) {
    try {
      const response =
        method === 'post'
          ? await apiClient.post<ApiResponse<T>>(candidate, body ?? {})
          : method === 'put'
          ? await apiClient.put<ApiResponse<T>>(candidate, body ?? {})
          : method === 'patch'
          ? await apiClient.patch<ApiResponse<T>>(candidate, body ?? {})
          : await apiClient.delete<ApiResponse<T>>(candidate);

      return unwrapPayload<T>(response.data);
    } catch (error: any) {
      lastError = error;
      if (error?.response?.status !== 404) throw error;
    }
  }
  throw lastError;
};

export const materialService = {
  // GET /study-materials/:courseId
  async getStudyMaterials(
    courseId: string,
    params?: {
      topicId?: string;
      accessLevel?: 'basic' | 'premium';
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'views' | 'downloads' | 'rating';
    }
  ): Promise<StudyMaterialResponse> {
    return getStudyMaterialsWithFallback(
      `getStudyMaterials:${courseId}`,
      withLegacyCandidates([
        `/api/courses/${courseId}/study-materials`,
      ], [
        `/api/courses/${courseId}/study-materials/${courseId}`,
        `/api/study-materials/${courseId}`,
        `/study-materials/${courseId}`,
        `/api/courses/${courseId}/materials`,
        `/api/source-materials/course/${courseId}`,
        `/api/materials/course/${courseId}`,
      ]),
      params
    );
  },

  // GET /study-materials/:courseId/:materialId
  async getStudyMaterial(courseId: string, materialId: string): Promise<Material> {
    const endpoints = withLegacyCandidates([
      `/api/courses/${courseId}/study-materials/${materialId}`,
    ], [
      `/api/courses/${courseId}/study-materials/${courseId}/${materialId}`,
      `/api/study-materials/${courseId}/${materialId}`,
    ]);

    let lastError: any;
    for (const endpoint of prioritizeEndpoints(`getStudyMaterial:${courseId}`, endpoints)) {
      try {
        const result = await getSingleWithPrefixFallback<Material>(endpoint);
        rememberEndpoint(`getStudyMaterial:${courseId}`, endpoint);
        return result;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status !== 404) throw error;
      }
    }
    throw lastError;
  },

  // POST /courses/:courseId/study-materials/:materialId/download
  async downloadStudyMaterial(courseId: string, materialId: string): Promise<MaterialDownloadResponse> {
    const endpointCandidates = withLegacyCandidates([
      `/api/courses/${courseId}/study-materials/${materialId}/download`,
    ], [
      `/api/courses/${courseId}/study-materials/${courseId}/${materialId}/download`,
    ]);

    let lastError: any;
    for (const endpoint of prioritizeEndpoints(`downloadStudyMaterial:${courseId}`, endpointCandidates)) {
      try {
        const response = await apiClient.post<ApiResponse<any>>(endpoint, {});
        const payload = unwrapPayload<any>(response.data) ?? {};
        rememberEndpoint(`downloadStudyMaterial:${courseId}`, endpoint);

        return {
          downloadUrl: payload?.downloadUrl,
          fileName: payload?.fileName,
          fileSize: Number(payload?.fileSize ?? 0) || undefined,
          expiresIn: Number(payload?.expiresIn ?? payload?.expires ?? 0) || undefined,
          downloadedAt: payload?.downloadedAt,
        };
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }

    throw lastError;
  },

  // POST /courses/:courseId/study-materials/:courseId/:materialId/rate
  async rateStudyMaterial(
    courseId: string,
    materialId: string,
    data: { rating: number; comment?: string }
  ): Promise<MaterialRatingResponse> {
    const endpoints = withLegacyCandidates([
      `/api/courses/${courseId}/study-materials/${materialId}/rate`,
    ], [
      `/api/courses/${courseId}/study-materials/${courseId}/${materialId}/rate`,
    ]);

    let lastError: any;
    for (const endpoint of prioritizeEndpoints(`rateStudyMaterial:${courseId}`, endpoints)) {
      try {
        const result = await sendWithPrefixFallback<MaterialRatingResponse>('post', endpoint, data);
        rememberEndpoint(`rateStudyMaterial:${courseId}`, endpoint);
        return result;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status !== 404) throw error;
      }
    }

    throw lastError;
  },

  // GET /courses/:courseId/study-materials/downloads/limit-status
  async getDownloadLimitStatus(courseId: string): Promise<DownloadLimitStatus> {
    const endpoints = withLegacyCandidates([
      `/api/courses/${courseId}/study-materials/downloads/limit-status`,
    ], [
      `/api/study-materials/downloads/limit-status`,
    ]);

    let lastError: any;
    for (const endpoint of prioritizeEndpoints(`downloadLimitStatus:${courseId}`, endpoints)) {
      try {
        const response = await apiClient.get<ApiResponse<DownloadLimitStatus>>(endpoint);
        const payload = unwrapPayload<any>(response.data) ?? {};
        rememberEndpoint(`downloadLimitStatus:${courseId}`, endpoint);
        return {
          dailyLimit: Number(payload?.dailyLimit ?? payload?.limit ?? payload?.maxPerDay ?? 0) || 0,
          usedToday: Number(payload?.usedToday ?? payload?.downloadsUsedToday ?? payload?.used ?? 0) || 0,
          remainingToday: Number(payload?.remainingToday ?? payload?.downloadsRemainingToday ?? payload?.remaining ?? 0) || 0,
          isUnlimited: Boolean(payload?.isUnlimited ?? payload?.unlimited),
          resetsAt: payload?.resetsAt ?? payload?.resetAt ?? payload?.nextResetAt,
        };
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status !== 404) throw error;
      }
    }

    throw lastError;
  },

  // PUT /study-materials/:courseId/:materialId
  async updateStudyMaterial(
    courseId: string,
    materialId: string,
    data: UpdateStudyMaterialRequest
  ): Promise<Material> {
    const endpoints: Array<{ method: 'patch' | 'put'; endpoint: string }> = withLegacyCandidates([
      { method: 'patch', endpoint: `/api/courses/${courseId}/study-materials/${materialId}` },
    ], [
      { method: 'patch', endpoint: `/api/courses/${courseId}/study-materials/${courseId}/${materialId}` },
      { method: 'put', endpoint: `/api/study-materials/${courseId}/${materialId}` },
    ]);

    let lastError: any;
    for (const candidate of prioritizeEndpoints(`updateStudyMaterial:${courseId}`, endpoints.map((entry) => `${entry.method}:${entry.endpoint}`))) {
      try {
        const [method, endpoint] = candidate.split(':', 2) as ['patch' | 'put', string];
        const result = await sendWithPrefixFallback<Material>(method, endpoint, data);
        rememberEndpoint(`updateStudyMaterial:${courseId}`, candidate);
        return result;
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status !== 404) throw error;
      }
    }

    throw lastError;
  },

  // DELETE /study-materials/:courseId/:materialId
  async deleteStudyMaterial(courseId: string, materialId: string): Promise<{ success: boolean; message?: string }> {
    const endpoints = withLegacyCandidates([
      `/api/courses/${courseId}/study-materials/${materialId}`,
    ], [
      `/api/courses/${courseId}/study-materials/${courseId}/${materialId}`,
      `/api/study-materials/${courseId}/${materialId}`,
    ]);

    let lastError: any;
    for (const endpoint of prioritizeEndpoints(`deleteStudyMaterial:${courseId}`, endpoints)) {
      try {
        const unwrapped = await sendWithPrefixFallback<any>('delete', endpoint);
        rememberEndpoint(`deleteStudyMaterial:${courseId}`, endpoint);
        return { success: unwrapped?.success ?? true, message: unwrapped?.message };
      } catch (error: any) {
        lastError = error;
        if (error?.response?.status !== 404) throw error;
      }
    }

    throw lastError;
  },

  // GET /api/study-materials/hierarchy/browse
  // Browse study materials by university → department → course hierarchy
  async browseByHierarchy(
    courseId: string,
    params?: {
      universityId?: string;
      departmentId?: string;
      topicId?: string;
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'views' | 'downloads' | 'rating';
    }
  ): Promise<StudyMaterialResponse> {
    const requestParams = { courseId, ...params };

    const hierarchyResponse = await getStudyMaterialsWithFallback(
      `browseByHierarchy:${courseId}`,
      withLegacyCandidates([
        `/api/courses/${courseId}/study-materials/hierarchy/browse`,
      ], [
        '/api/study-materials/hierarchy/browse',
        '/study-materials/hierarchy/browse',
        '/api/study-materials/browse',
        '/study-materials/browse',
        '/api/materials/browse',
      ]),
      requestParams
    );

    if (hierarchyResponse.data.length > 0 || hierarchyResponse.pagination.total > 0) {
      return hierarchyResponse;
    }

    return getStudyMaterialsWithFallback(
      `browseByHierarchyFallback:${courseId}`,
      withLegacyCandidates([
        `/api/courses/${courseId}/study-materials`,
      ], [
        `/api/courses/${courseId}/study-materials/${courseId}`,
        `/api/study-materials/${courseId}`,
        `/study-materials/${courseId}`,
        `/api/courses/${courseId}/materials`,
        `/api/source-materials/course/${courseId}`,
        `/api/materials/course/${courseId}`,
      ]),
      {
        topicId: params?.topicId,
        page: params?.page,
        limit: params?.limit,
        sortBy: params?.sortBy,
      }
    );
  },
};
