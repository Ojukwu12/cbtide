import apiClient from '../api';
import {
  ApiResponse,
  Material,
  MaterialUploadRequest,
  GenerateQuestionsResponse,
} from '../../types';

export const materialService = {
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
    formData.append('fileType', data.fileType);
    if (data.topicId) {
      formData.append('topicId', data.topicId);
    }
    if (data.fileUrl) {
      formData.append('fileUrl', data.fileUrl);
    }
    if (data.content) {
      formData.append('content', data.content);
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
    materialId: string
  ): Promise<GenerateQuestionsResponse> {
    const response = await apiClient.post<ApiResponse<GenerateQuestionsResponse>>(
      `/api/courses/${courseId}/materials/${materialId}/generate-questions`
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
};
