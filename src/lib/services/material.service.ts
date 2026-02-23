import apiClient from '../api';
import {
  ApiResponse,
  Material,
} from '../../types';

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
  downloadUrl: string;
  fileName: string;
  downloadedAt: string;
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

const getStudyMaterialsWithFallback = async (
  endpoints: string[],
  params?: Record<string, any>
): Promise<StudyMaterialResponse> => {
  for (const endpoint of endpoints) {
    try {
      const response = await apiClient.get<ApiResponse<StudyMaterialResponse>>(endpoint, { params });
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
  method: 'post' | 'put' | 'delete',
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
      accessLevel?: 'free' | 'premium';
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'views' | 'downloads' | 'rating';
    }
  ): Promise<StudyMaterialResponse> {
    return getStudyMaterialsWithFallback(
      [
        `/api/study-materials/${courseId}`,
        `/study-materials/${courseId}`,
        `/api/courses/${courseId}/study-materials`,
        `/api/courses/${courseId}/materials`,
        `/api/source-materials/course/${courseId}`,
        `/api/materials/course/${courseId}`,
      ],
      params
    );
  },

  // GET /study-materials/:courseId/:materialId
  async getStudyMaterial(courseId: string, materialId: string): Promise<Material> {
    return getSingleWithPrefixFallback<Material>(`/api/study-materials/${courseId}/${materialId}`);
  },

  // POST /study-materials/:courseId/:materialId/download
  async downloadStudyMaterial(courseId: string, materialId: string): Promise<MaterialDownloadResponse> {
    return sendWithPrefixFallback<MaterialDownloadResponse>(
      'post',
      `/api/study-materials/${courseId}/${materialId}/download`,
      {}
    );
  },

  // POST /study-materials/:courseId/:materialId/rate
  async rateStudyMaterial(
    courseId: string,
    materialId: string,
    data: { rating: number; comment?: string }
  ): Promise<MaterialRatingResponse> {
    return sendWithPrefixFallback<MaterialRatingResponse>(
      'post',
      `/api/study-materials/${courseId}/${materialId}/rate`,
      data
    );
  },

  // PUT /study-materials/:courseId/:materialId
  async updateStudyMaterial(
    courseId: string,
    materialId: string,
    data: UpdateStudyMaterialRequest
  ): Promise<Material> {
    return sendWithPrefixFallback<Material>(
      'put',
      `/api/study-materials/${courseId}/${materialId}`,
      data
    );
  },

  // DELETE /study-materials/:courseId/:materialId
  async deleteStudyMaterial(courseId: string, materialId: string): Promise<{ success: boolean; message?: string }> {
    const unwrapped = await sendWithPrefixFallback<any>(
      'delete',
      `/api/study-materials/${courseId}/${materialId}`
    );
    return { success: unwrapped?.success ?? true, message: unwrapped?.message };
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
      [
        '/api/study-materials/hierarchy/browse',
        '/study-materials/hierarchy/browse',
        '/api/study-materials/browse',
        '/study-materials/browse',
        '/api/materials/browse',
      ],
      requestParams
    );

    if (hierarchyResponse.data.length > 0 || hierarchyResponse.pagination.total > 0) {
      return hierarchyResponse;
    }

    return getStudyMaterialsWithFallback(
      [
        `/api/study-materials/${courseId}`,
        `/study-materials/${courseId}`,
        `/api/courses/${courseId}/study-materials`,
        `/api/courses/${courseId}/materials`,
        `/api/source-materials/course/${courseId}`,
        `/api/materials/course/${courseId}`,
      ],
      {
        topicId: params?.topicId,
        page: params?.page,
        limit: params?.limit,
        sortBy: params?.sortBy,
      }
    );
  },
};
