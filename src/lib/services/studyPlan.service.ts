import apiClient from '../api';
import {
  ApiResponse,
  StudyPlan,
  CreateStudyPlanRequest,
  UpdateStudyPlanRequest,
} from '../../types';

export const studyPlanService = {
  async getStudyPlans(): Promise<StudyPlan[]> {
    const response = await apiClient.get<ApiResponse<StudyPlan[]>>(
      '/api/study-plans'
    );
    return response.data.data;
  },

  async getStudyPlan(id: string): Promise<StudyPlan> {
    const response = await apiClient.get<ApiResponse<StudyPlan>>(
      `/api/study-plans/${id}`
    );
    return response.data.data;
  },

  async createStudyPlan(data: CreateStudyPlanRequest): Promise<StudyPlan> {
    const response = await apiClient.post<ApiResponse<StudyPlan>>(
      '/api/study-plans',
      data
    );
    return response.data.data;
  },

  async updateStudyPlan(
    id: string,
    data: UpdateStudyPlanRequest
  ): Promise<StudyPlan> {
    const response = await apiClient.patch<ApiResponse<StudyPlan>>(
      `/api/study-plans/${id}`,
      data
    );
    return response.data.data;
  },

  async deleteStudyPlan(id: string): Promise<void> {
    await apiClient.delete(`/api/study-plans/${id}`);
  },
};
