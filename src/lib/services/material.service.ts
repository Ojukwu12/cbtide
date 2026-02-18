import apiClient from '../api';
import {
  ApiResponse,
  Material,
  MaterialUploadRequest,
  GenerateQuestionsResponse,
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

export const materialService = {
  // GET /courses/:courseId/study-materials
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
    const response = await apiClient.get<ApiResponse<StudyMaterialResponse>>(
      `/api/courses/${courseId}/study-materials`,
      { params }
    );
    return response.data.data;
  },

  // GET /courses/:courseId/study-materials/:materialId
  async getStudyMaterial(courseId: string, materialId: string): Promise<Material> {
    const response = await apiClient.get<ApiResponse<Material>>(
      `/api/courses/${courseId}/study-materials/${materialId}`
    );
    return response.data.data;
  },

  // POST /courses/:courseId/study-materials/:materialId/download
  async downloadStudyMaterial(courseId: string, materialId: string): Promise<MaterialDownloadResponse> {
    const response = await apiClient.post<ApiResponse<MaterialDownloadResponse>>(
      `/api/courses/${courseId}/study-materials/${materialId}/download`,
      {}
    );
    return response.data.data;
  },

  // POST /courses/:courseId/study-materials/:materialId/rate
  async rateStudyMaterial(
    courseId: string,
    materialId: string,
    data: { rating: number; comment?: string }
  ): Promise<MaterialRatingResponse> {
    const response = await apiClient.post<ApiResponse<MaterialRatingResponse>>(
      `/api/courses/${courseId}/study-materials/${materialId}/rate`,
      data
    );
    return response.data.data;
  },

  // Legacy: Source Material Management (used in admin context)
  async getMaterials(courseId: string): Promise<Material[]> {
    const response = await apiClient.get<ApiResponse<Material[]>>(
      `/api/courses/${courseId}/materials`
    );
    return response.data.data;
  },

  async getMaterial(courseId: string, materialId: string): Promise<Material> {
    const response = await apiClient.get<ApiResponse<Material>>(
      `/api/courses/${courseId}/materials/${materialId}`
    );
    return response.data.data;
  },

  async uploadMaterial(
    courseId: string,
    data: MaterialUploadRequest
  ): Promise<Material> {
    const formData = new FormData();
    if (data.file) {
      formData.append('file', data.file);
    }
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    formData.append('fileType', data.fileType);
    if (data.topicId) {
      formData.append('topicId', data.topicId);
    }
    if (data.fileUrl) {
      formData.append('fileUrl', data.fileUrl);
    }
    if (data.fileSize !== undefined) {
      formData.append('fileSize', String(data.fileSize));
    }
    if (data.content) {
      formData.append('content', data.content);
    }
    if (data.extractionMethod) {
      formData.append('extractionMethod', data.extractionMethod);
    }

    const response = await apiClient.post<ApiResponse<Material>>(
      `/api/courses/${courseId}/materials`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  async generateQuestions(
    courseId: string,
    materialId: string,
    data?: {
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      numberOfQuestions?: number;
      questionCount?: number;
      count?: number;
    }
  ): Promise<GenerateQuestionsResponse> {
    const response = await apiClient.post<ApiResponse<GenerateQuestionsResponse>>(
      `/api/courses/${courseId}/materials/${materialId}/generate-questions`,
      data || {}
    );
    return response.data.data;
  },

  async importQuestions(
    courseId: string,
    materialId: string,
    questions: any[]
  ): Promise<{ imported: number }> {
    const response = await apiClient.post<ApiResponse<{ imported: number }>>(
      `/api/courses/${courseId}/materials/${materialId}/import-questions`,
      { questions }
    );
    return response.data.data;
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
    const response = await apiClient.get<ApiResponse<StudyMaterialResponse>>(
      '/api/study-materials/hierarchy/browse',
      { params: { courseId, ...params } }
    );
    return response.data.data;
  },
};
