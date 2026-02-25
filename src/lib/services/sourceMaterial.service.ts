import apiClient from '../api';
import {
  ApiResponse,
  Material,
  MaterialUploadRequest,
  GenerateQuestionsResponse,
} from '../../types';

const enableLegacyRouteFallback =
  String((import.meta as any).env?.VITE_ENABLE_LEGACY_ROUTE_FALLBACK || '').toLowerCase() === 'true';

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

    const endpoints = withLegacyCandidates([
      `/api/courses/${courseId}/materials`,
    ], [
      `/api/source-materials/course/${courseId}`,
      `/api/materials/course/${courseId}`,
      `/api/courses/${courseId}/study-materials`,
      `/api/courses/${courseId}/study-materials/${courseId}`,
    ]);

    for (const endpoint of prioritizeEndpoints(`getMaterials:${courseId}`, endpoints)) {
      try {
        const response = await apiClient.get<any>(endpoint);
        const materials = extractMaterials(response.data);
        rememberEndpoint(`getMaterials:${courseId}`, endpoint);
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

      const fallbackEndpoints = withLegacyCandidates([
        `/api/courses/${courseId}/materials/${materialId}`,
      ], [
        `/api/source-materials/course/${courseId}/${materialId}`,
        `/api/courses/${courseId}/study-materials/${courseId}/${materialId}`,
        `/api/courses/${courseId}/study-materials/${materialId}`,
      ]);

      let lastError: any;
      for (const endpoint of prioritizeEndpoints(`getMaterial:${courseId}`, fallbackEndpoints)) {
        try {
          const fallback = await apiClient.get<ApiResponse<Material>>(endpoint);
          rememberEndpoint(`getMaterial:${courseId}`, endpoint);
          return (fallback.data as any)?.data || (fallback.data as any);
        } catch (fallbackError: any) {
          lastError = fallbackError;
        }
      }

      throw lastError;
    }
  },

  async uploadMaterial(
    courseId: string,
    data: MaterialUploadRequest
  ): Promise<Material> {
    const hasFile = Boolean(data.file);

    const requiresFileContentOrUrl = (error: any) => {
      const message = String(error?.response?.data?.message || error?.message || '').toLowerCase();
      return (
        message.includes('filecontent') ||
        message.includes('file content') ||
        message.includes('url is required') ||
        message.includes('must include a file upload') ||
        message.includes('file upload, fileurl, or content')
      );
    };

    const uploadWithFormData = async (
      includeCompatibilityFields = false,
      fallbackContent?: string
    ): Promise<Material> => {
      const formData = new FormData();
      formData.append('file', data.file as File);
      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.fileType) {
        formData.append('fileType', data.fileType);
      }
      if (data.topicId) {
        formData.append('topicId', data.topicId);
      }
      if (data.fileUrl) {
        formData.append('fileUrl', data.fileUrl);
      }
      if (data.fileSize !== undefined) {
        formData.append('fileSize', String(data.fileSize));
      }
      if (data.content || fallbackContent) {
        formData.append('content', data.content || fallbackContent || '');
      }

      if (includeCompatibilityFields) {
        formData.append('fileContent', data.content || fallbackContent || data.description || data.title);
        formData.append('url', data.fileUrl || `upload://${(data.file as File).name}`);
      }

      const endpoints = withLegacyCandidates([
        `/api/courses/${courseId}/materials`,
      ], [
        `/api/courses/${courseId}/study-materials/upload`,
        `/api/courses/${courseId}/study-materials/${courseId}/upload`,
      ]);

      let lastError: any;
      for (const endpoint of prioritizeEndpoints(`uploadMaterial:${courseId}`, endpoints)) {
        try {
          const response = await apiClient.post<ApiResponse<Material>>(
            endpoint,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          rememberEndpoint(`uploadMaterial:${courseId}`, endpoint);
          return unwrapPayload(response.data) as Material;
        } catch (error: any) {
          lastError = error;
          const status = Number(error?.response?.status || 0);
          if (status !== 400 && status !== 404 && status !== 405 && status !== 422) {
            throw error;
          }
        }
      }

      throw lastError;
    };

    if (hasFile) {
      try {
        return await uploadWithFormData(false);
      } catch (error: any) {
        if (!requiresFileContentOrUrl(error)) throw error;

        let extractedContent = data.content || '';
        try {
          const file = data.file as File;
          if (file?.type?.startsWith('text/') || file?.name?.toLowerCase().endsWith('.txt')) {
            extractedContent = (await file.text())?.slice(0, 100000) || extractedContent;
          }
        } catch {
          // Ignore extraction errors and continue with existing fallback values
        }

        return uploadWithFormData(true, extractedContent);
      }
    }

    const payload: any = {
      title: data.title,
    };
    if (data.fileType) payload.fileType = data.fileType;
    if (data.description) payload.description = data.description;
    if (data.topicId) payload.topicId = data.topicId;
    if (data.fileUrl) payload.fileUrl = data.fileUrl;
    if (data.fileUrl) payload.url = data.fileUrl;
    if (data.fileSize !== undefined) payload.fileSize = data.fileSize;
    if (data.content) payload.content = data.content;
    if (data.content) payload.fileContent = data.content;

    const endpoints = withLegacyCandidates([
      `/api/courses/${courseId}/materials`,
    ], [
      `/api/courses/${courseId}/study-materials/upload`,
      `/api/courses/${courseId}/study-materials/${courseId}/upload`,
    ]);

    let lastError: any;
    for (const endpoint of prioritizeEndpoints(`uploadMaterial:${courseId}`, endpoints)) {
      try {
        const response = await apiClient.post<ApiResponse<Material>>(endpoint, payload);
        rememberEndpoint(`uploadMaterial:${courseId}`, endpoint);
        return unwrapPayload(response.data) as Material;
      } catch (error: any) {
        lastError = error;
        const status = Number(error?.response?.status || 0);
        if (status !== 400 && status !== 404 && status !== 405 && status !== 422) {
          throw error;
        }
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
    const response = await apiClient.post<ApiResponse<GenerateQuestionsResponse>>(
      `/api/courses/${courseId}/materials/${materialId}/generate-questions`,
      payload
    );
    return response.data.data;
  },

  async importQuestions(
    courseId: string,
    materialId: string,
    questions?: any[]
  ): Promise<{ imported: number }> {
    const payload = Array.isArray(questions) && questions.length > 0 ? { questions } : {};
    const response = await apiClient.post<ApiResponse<{ imported: number }>>(
      `/api/courses/${courseId}/materials/${materialId}/import-questions`,
      payload
    );
    return response.data.data;
  },

  async deleteMaterialsByUploadOutcome(
    courseId: string,
    uploadOutcome: 'successful' | 'unsuccessful' | 'all'
  ): Promise<{ success?: boolean; message?: string }> {
    const response = await apiClient.delete<ApiResponse<{ success?: boolean; message?: string }>>(
      `/api/courses/${courseId}/materials`,
      {
        params: { uploadOutcome },
      }
    );

    const payload = unwrapPayload(response.data) as { success?: boolean; message?: string };
    return {
      success: payload?.success,
      message: payload?.message,
    };
  },
};
