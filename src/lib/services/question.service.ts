import apiClient from '../api';
import {
  ApiResponse,
  Question,
  QuestionStats,
  PaginatedResponse,
  SearchQuestionsRequest,
  SearchQuestionsResponse,
} from '../../types';

export const questionService = {
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

  async getRandomQuestions(topicId: string, count = 10): Promise<Question[]> {
    const response = await apiClient.get<ApiResponse<Question[]>>(
      `/api/questions/random/${topicId}`,
      { params: { count } }
    );
    return response.data.data;
  },

  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    const response = await apiClient.get<ApiResponse<Question[]>>(
      `/api/questions/${topicId}`
    );
    return response.data.data;
  },

  async getQuestionStats(topicId: string): Promise<QuestionStats> {
    const response = await apiClient.get<ApiResponse<QuestionStats>>(
      `/api/questions/stats/${topicId}`
    );
    return response.data.data;
  },

  async getPendingQuestions(universityId: string): Promise<Question[]> {
    const response = await apiClient.get<ApiResponse<Question[]>>(
      `/api/questions/pending/${universityId}`
    );
    return response.data.data;
  },

  async createQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Question> {
    const response = await apiClient.post<ApiResponse<Question>>(
      '/api/questions',
      question
    );
    return response.data.data;
  },

  async approveQuestion(questionId: string): Promise<void> {
    await apiClient.post(`/api/questions/approve/${questionId}`);
  },

  async rejectQuestion(questionId: string, reason: string): Promise<void> {
    await apiClient.post(`/api/questions/reject/${questionId}`, { reason });
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await apiClient.delete(`/api/questions/${questionId}`);
  },

  async searchQuestions(params: SearchQuestionsRequest): Promise<SearchQuestionsResponse> {
    const response = await apiClient.get<ApiResponse<SearchQuestionsResponse>>(
      '/api/search/questions',
      { params }
    );
    return response.data.data;
  },
};
