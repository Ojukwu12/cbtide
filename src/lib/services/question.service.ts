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

const toQuestionArray = (payload: any): Question[] => {
  if (Array.isArray(payload)) return payload as Question[];
  if (Array.isArray(payload?.data)) return payload.data as Question[];
  if (Array.isArray(payload?.questions)) return payload.questions as Question[];
  if (Array.isArray(payload?.items)) return payload.items as Question[];
  if (Array.isArray(payload?.results)) return payload.results as Question[];
  return [];
};

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

  // GET pending questions (admin dashboard compatibility)
  async getPendingQuestions(adminId?: string): Promise<Question[]> {
    const endpointCandidates = [
      ...(adminId
        ? [
            { url: `/api/questions/pending/${adminId}` },
            { url: '/api/questions/pending', params: { adminId } },
            { url: `/api/admin/questions/pending/${adminId}` },
            { url: '/api/admin/questions/pending', params: { adminId } },
          ]
        : [
            { url: '/api/questions/pending' },
            { url: '/api/admin/questions/pending' },
          ]),
      { url: '/api/questions', params: { status: 'pending', page: 1, limit: 100 } },
    ];

    let lastError: unknown;

    for (const candidate of endpointCandidates) {
      try {
        const response = await apiClient.get<any>(candidate.url, {
          params: candidate.params,
        });
        const data = response?.data;
        const normalized = toQuestionArray(data?.data ?? data);
        return normalized;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
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
