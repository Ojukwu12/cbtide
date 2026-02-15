import apiClient from '../api';
import {
  ApiResponse,
  StudyPlan,
  CreateStudyPlanRequest,
  UpdateStudyPlanRequest,
} from '../../types';

export interface StudyPlanTopic {
  _id: string;
  name: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface StudyPlanDetail extends StudyPlan {
  topics: StudyPlanTopic[];
}

export const studyPlanService = {
  // POST /study-plans
  async createStudyPlan(data: CreateStudyPlanRequest): Promise<StudyPlan> {
    const response = await apiClient.post<ApiResponse<StudyPlan>>(
      '/api/study-plans',
      data
    );
    return response.data.data;
  },

  // GET /study-plans
  async getStudyPlans(params?: { page?: number; limit?: number }): Promise<{ data: StudyPlan[]; pagination: any }> {
    const response = await apiClient.get<ApiResponse<{ data: StudyPlan[]; pagination: any }>>(
      '/api/study-plans',
      { params }
    );
    return response.data.data;
  },

  // GET /study-plans/:planId
  async getStudyPlan(id: string): Promise<StudyPlanDetail> {
    const response = await apiClient.get<ApiResponse<StudyPlanDetail>>(
      `/api/study-plans/${id}`
    );
    return response.data.data;
  },

  // PUT /study-plans/:planId
  async updateStudyPlan(
    id: string,
    data: UpdateStudyPlanRequest
  ): Promise<StudyPlan> {
    const response = await apiClient.put<ApiResponse<StudyPlan>>(
      `/api/study-plans/${id}`,
      data
    );
    return response.data.data;
  },

  // POST /study-plans/:planId/topics/:topicId/complete
  async completeTopicInPlan(planId: string, topicId: string): Promise<StudyPlanDetail> {
    const response = await apiClient.post<ApiResponse<StudyPlanDetail>>(
      `/api/study-plans/${planId}/topics/${topicId}/complete`,
      {}
    );
    return response.data.data;
  },

  // DELETE /study-plans/:planId
  async deleteStudyPlan(id: string): Promise<void> {
    await apiClient.delete(`/api/study-plans/${id}`);
  },
};
