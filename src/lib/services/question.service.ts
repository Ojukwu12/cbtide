import apiClient from '../api';
import {
  ApiResponse,
  Question,
  QuestionStats,
  PaginatedResponse,
  SearchQuestionsRequest,
  SearchQuestionsResponse,
} from '../../types';

export interface CourseQuestionsResponse {
  data: Question[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const questionService = {
  // GET /courses/:courseId/questions
  async getCourseQuestions(
    courseId: string,
    params?: {
      topicId?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      page?: number;
      limit?: number;
      q?: string;
    }
  ): Promise<CourseQuestionsResponse> {
    const response = await apiClient.get<ApiResponse<CourseQuestionsResponse>>(
      `/api/courses/${courseId}/questions`,
      { params }
    );
    return response.data.data;
  },

  // GET /courses/:courseId/questions/:topicId
  async getTopicQuestions(
    courseId: string,
    topicId: string,
    params?: {
      limit?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
    }
  ): Promise<{ data: Question[]; count: number }> {
    const response = await apiClient.get<ApiResponse<{ data: Question[]; count: number }>>(
      `/api/courses/${courseId}/questions/${topicId}`,
      { params }
    );
    return response.data.data;
  },

  // GET /courses/:courseId/questions/random/:topicId
  async getRandomQuestions(
    courseId: string,
    topicId: string,
    params?: {
      count?: number;
      userPlan?: 'free' | 'basic' | 'premium';
    }
  ): Promise<{ data: Question[]; count: number }> {
    const response = await apiClient.get<ApiResponse<{ data: Question[]; count: number }>>(
      `/api/courses/${courseId}/questions/random/${topicId}`,
      { params }
    );
    return response.data.data;
  },

  // GET /courses/:courseId/questions/stats/:topicId
  async getQuestionStats(courseId: string, topicId: string): Promise<QuestionStats> {
    const response = await apiClient.get<ApiResponse<QuestionStats>>(
      `/api/courses/${courseId}/questions/stats/${topicId}`
    );
    return response.data.data;
  },

  // GET /questions (legacy - for admin)
  async getQuestions(params?: {
    topicId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Question>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Question>>>(
      '/api/questions',
      { params }
    );
    return response.data.data;
  },

  // POST /questions (admin only)
  async createQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Question> {
    const response = await apiClient.post<ApiResponse<Question>>(
      '/api/questions',
      question
    );
    return response.data.data;
  },

  // POST /questions/approve/:questionId (admin only)
  async approveQuestion(questionId: string): Promise<void> {
    await apiClient.post(`/api/questions/approve/${questionId}`);
  },

  // POST /questions/reject/:questionId (admin only)
  async rejectQuestion(questionId: string, reason: string): Promise<void> {
    await apiClient.post(`/api/questions/reject/${questionId}`, { reason });
  },

  // DELETE /questions/:questionId (admin only)
  async deleteQuestion(questionId: string): Promise<void> {
    await apiClient.delete(`/api/questions/${questionId}`);
  },

  // GET /search/questions
  async searchQuestions(params: SearchQuestionsRequest): Promise<SearchQuestionsResponse> {
    const response = await apiClient.get<ApiResponse<SearchQuestionsResponse>>(
      '/api/search/questions',
      { params }
    );
    return response.data.data;
  },
};
