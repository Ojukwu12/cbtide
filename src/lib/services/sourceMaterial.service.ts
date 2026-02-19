import apiClient from '../api';
import {
  ApiResponse,
  Material,
  MaterialUploadRequest,
  GenerateQuestionsResponse,
} from '../../types';

export const sourceMaterialService = {
  async getMaterials(courseId: string): Promise<Material[]> {
    const candidates = [
      `/api/courses/${courseId}/materials`,
      `/api/materials/${courseId}`,
    ];

    let lastError: unknown;

    for (const url of candidates) {
      try {
        const response = await apiClient.get<ApiResponse<any>>(url);
        const payload = response.data?.data;
        if (Array.isArray(payload)) return payload as Material[];
        if (Array.isArray(payload?.data)) return payload.data as Material[];
        if (Array.isArray(payload?.materials)) return payload.materials as Material[];
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
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
    const hasFile = Boolean(data.file);

    if (hasFile) {
      const formData = new FormData();
      formData.append('file', data.file as File);
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

      const candidates = [
        `/api/courses/${courseId}/materials`,
        `/api/materials/${courseId}`,
      ];

      let lastError: unknown;

      for (const url of candidates) {
        try {
          const response = await apiClient.post<ApiResponse<Material>>(
            url,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          return response.data.data;
        } catch (error) {
          const status = (error as any)?.response?.status;
          if (status && status !== 404) {
            throw error;
          }
          lastError = error;
        }
      }

      throw lastError;
    }

    const payload: any = {
      title: data.title,
      fileType: data.fileType,
    };
    if (data.description) payload.description = data.description;
    if (data.topicId) payload.topicId = data.topicId;
    if (data.fileUrl) payload.fileUrl = data.fileUrl;
    if (data.fileSize !== undefined) payload.fileSize = data.fileSize;
    if (data.content) payload.content = data.content;

    const candidates = [
      `/api/courses/${courseId}/materials`,
      `/api/materials/${courseId}`,
    ];

    let lastError: unknown;

    for (const url of candidates) {
      try {
        const response = await apiClient.post<ApiResponse<Material>>(
          url,
          payload
        );
        return response.data.data;
      } catch (error) {
        const status = (error as any)?.response?.status;
        if (status && status !== 404) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError;
  },

  async generateQuestions(
    courseId: string,
    materialId: string,
    data?: {
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    }
  ): Promise<GenerateQuestionsResponse> {
    const payload = data?.difficulty ? { difficulty: data.difficulty } : {};
    const candidates = [
      `/api/courses/${courseId}/materials/${materialId}/generate-questions`,
      `/api/materials/${materialId}/generate-questions`,
    ];

    let lastError: unknown;

    for (const url of candidates) {
      try {
        const response = await apiClient.post<ApiResponse<GenerateQuestionsResponse>>(
          url,
          payload
        );
        return response.data.data;
      } catch (error) {
        const status = (error as any)?.response?.status;
        if (status && status !== 404) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError;
  },

  async importQuestions(
    courseId: string,
    materialId: string,
    questions: any[]
  ): Promise<{ imported: number }> {
    const candidates = [
      `/api/courses/${courseId}/materials/${materialId}/import-questions`,
      `/api/materials/${materialId}/import-questions`,
    ];

    let lastError: unknown;

    for (const url of candidates) {
      try {
        const response = await apiClient.post<ApiResponse<{ imported: number }>>(
          url,
          { questions }
        );
        return response.data.data;
      } catch (error) {
        const status = (error as any)?.response?.status;
        if (status && status !== 404) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError;
  },
};
