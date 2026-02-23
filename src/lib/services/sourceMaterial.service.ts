import apiClient from '../api';
import {
  ApiResponse,
  Material,
  MaterialUploadRequest,
  GenerateQuestionsResponse,
} from '../../types';

const normalizeUploadFileType = (fileType: MaterialUploadRequest['fileType']) => {
  if (fileType === 'text') return 'document';
  if (fileType === 'image') return 'document';
  return fileType;
};

const unwrapPayload = (payload: any): any => {
  if (payload && typeof payload === 'object') {
    if ('data' in payload && payload.data !== undefined) {
      return unwrapPayload(payload.data);
    }
    if ('result' in payload && payload.result !== undefined) {
      return unwrapPayload(payload.result);
    }
  }
  return payload;
};

export const sourceMaterialService = {
  async getMaterials(courseId: string): Promise<Material[]> {
    const unwrapPayload = (payload: any): any => {
      if (payload && typeof payload === 'object') {
        if ('data' in payload && payload.data !== undefined) {
          return unwrapPayload(payload.data);
        }
        if ('result' in payload && payload.result !== undefined) {
          return unwrapPayload(payload.result);
        }
      }
      return payload;
    };

    const extractMaterials = (payload: any): Material[] => {
      const resolvedPayload = unwrapPayload(payload);

      if (Array.isArray(resolvedPayload)) return resolvedPayload as Material[];
      if (!resolvedPayload || typeof resolvedPayload !== 'object') return [];

      if (Array.isArray(resolvedPayload.data)) return resolvedPayload.data as Material[];
      if (Array.isArray(resolvedPayload.materials)) return resolvedPayload.materials as Material[];
      if (Array.isArray(resolvedPayload.items)) return resolvedPayload.items as Material[];
      if (Array.isArray(resolvedPayload.results)) return resolvedPayload.results as Material[];

      return [];
    };

    const endpoints = [
      `/api/courses/${courseId}/materials`,
      `/api/source-materials/course/${courseId}`,
      `/api/materials/course/${courseId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<any>(endpoint);
        const materials = extractMaterials(response.data);
        if (materials.length > 0) return materials;

        if (Array.isArray(response.data) && response.data.length === 0) return [];
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          throw error;
        }
      }
    }

    return [];
  },

  async getMaterial(courseId: string, materialId: string): Promise<Material> {
    try {
      const response = await apiClient.get<ApiResponse<Material>>(
        `/api/courses/${courseId}/materials/${materialId}`
      );
      return (response.data as any)?.data || (response.data as any);
    } catch (error: any) {
      if (error?.response?.status !== 404) throw error;

      const fallback = await apiClient.get<ApiResponse<Material>>(
        `/api/source-materials/course/${courseId}/${materialId}`
      );
      return (fallback.data as any)?.data || (fallback.data as any);
    }
  },

  async uploadMaterial(
    courseId: string,
    data: MaterialUploadRequest
  ): Promise<Material> {
    const normalizedFileType = normalizeUploadFileType(data.fileType);
    const hasFile = Boolean(data.file);

    if (hasFile) {
      const formData = new FormData();
      formData.append('file', data.file as File);
      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }
      formData.append('fileType', normalizedFileType);
      formData.append('type', normalizedFileType);
      if (data.topicId) {
        formData.append('topicId', data.topicId);
      }
      formData.append('courseId', courseId);
      if (data.fileUrl) {
        formData.append('fileUrl', data.fileUrl);
      }
      if (data.fileSize !== undefined) {
        formData.append('fileSize', String(data.fileSize));
      }
      if (data.content) {
        formData.append('content', data.content);
      }

      const response = await apiClient.post<ApiResponse<Material>>(
        `/api/courses/${courseId}/materials`,
        formData
      );
      return unwrapPayload(response.data) as Material;
    }

    const payload: any = {
      title: data.title,
      fileType: normalizedFileType,
      type: normalizedFileType,
      courseId,
    };
    if (data.description) payload.description = data.description;
    if (data.topicId) payload.topicId = data.topicId;
    if (data.fileUrl) payload.fileUrl = data.fileUrl;
    if (data.fileSize !== undefined) payload.fileSize = data.fileSize;
    if (data.content) payload.content = data.content;

    const response = await apiClient.post<ApiResponse<Material>>(
      `/api/courses/${courseId}/materials`,
      payload
    );
    return unwrapPayload(response.data) as Material;
  },

  async generateQuestions(
    courseId: string,
    materialId: string,
    data?: {
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
    }
  ): Promise<GenerateQuestionsResponse> {
    const payload = data?.difficulty ? { difficulty: data.difficulty } : {};
    const response = await apiClient.post<ApiResponse<GenerateQuestionsResponse>>(
      `/api/courses/${courseId}/materials/${materialId}/generate-questions`,
      payload
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
