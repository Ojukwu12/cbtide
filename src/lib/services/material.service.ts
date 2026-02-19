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
    const endpoints: Array<{ url: string; params?: Record<string, any> }> = [
      { url: `/api/study-materials/${courseId}`, params },
      { url: '/api/study-materials/hierarchy/browse', params: { courseId, ...params } },
      { url: `/api/courses/${courseId}/study-materials`, params },
      { url: `/api/courses/${courseId}/materials`, params },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<ApiResponse<StudyMaterialResponse>>(endpoint.url, {
          params: endpoint.params,
        });
        return normalizeStudyMaterialResponse(response.data);
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }

    return {
      data: [],
      pagination: { total: 0, page: 1, limit: params?.limit ?? 100, pages: 0 },
    };
  },

  // GET /study-materials/:courseId/:materialId
  async getStudyMaterial(courseId: string, materialId: string): Promise<Material> {
    const endpoints = [
      `/api/study-materials/${courseId}/${materialId}`,
      `/api/courses/${courseId}/study-materials/${materialId}`,
      `/api/courses/${courseId}/materials/${materialId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<ApiResponse<Material>>(endpoint);
        return unwrapPayload<Material>(response.data);
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;
      }
    }

    throw new Error('Study material not found');
  },

  // POST /study-materials/:courseId/:materialId/download
  async downloadStudyMaterial(courseId: string, materialId: string): Promise<MaterialDownloadResponse> {
    const endpoints = [
      `/api/study-materials/${courseId}/${materialId}/download`,
      `/api/courses/${courseId}/study-materials/${materialId}/download`,
      `/api/courses/${courseId}/materials/${materialId}/download`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.post<ApiResponse<MaterialDownloadResponse>>(endpoint, {});
        return unwrapPayload<MaterialDownloadResponse>(response.data);
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;
      }
    }

    throw new Error('Download endpoint not found');
  },

  // POST /study-materials/:courseId/:materialId/rate
  async rateStudyMaterial(
    courseId: string,
    materialId: string,
    data: { rating: number; comment?: string }
  ): Promise<MaterialRatingResponse> {
    const endpoints = [
      `/api/study-materials/${courseId}/${materialId}/rate`,
      `/api/courses/${courseId}/study-materials/${materialId}/rate`,
      `/api/courses/${courseId}/materials/${materialId}/rate`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.post<ApiResponse<MaterialRatingResponse>>(endpoint, data);
        return unwrapPayload<MaterialRatingResponse>(response.data);
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;
      }
    }

    throw new Error('Rate endpoint not found');
  },

  // PUT /study-materials/:courseId/:materialId
  async updateStudyMaterial(
    courseId: string,
    materialId: string,
    data: UpdateStudyMaterialRequest
  ): Promise<Material> {
    const endpoints = [
      `/api/study-materials/${courseId}/${materialId}`,
      `/api/courses/${courseId}/study-materials/${materialId}`,
      `/api/courses/${courseId}/materials/${materialId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.put<ApiResponse<Material>>(endpoint, data);
        return unwrapPayload<Material>(response.data);
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;
      }
    }

    throw new Error('Update endpoint not found');
  },

  // DELETE /study-materials/:courseId/:materialId
  async deleteStudyMaterial(courseId: string, materialId: string): Promise<{ success: boolean; message?: string }> {
    const endpoints = [
      `/api/study-materials/${courseId}/${materialId}`,
      `/api/courses/${courseId}/study-materials/${materialId}`,
      `/api/courses/${courseId}/materials/${materialId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.delete<ApiResponse<any>>(endpoint);
        const unwrapped = unwrapPayload<any>(response.data);
        return { success: unwrapped?.success ?? true, message: unwrapped?.message };
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;
      }
    }

    throw new Error('Delete endpoint not found');
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
    return this.getStudyMaterials(courseId, params);
  },
};
