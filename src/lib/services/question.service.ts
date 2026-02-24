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
  if (Array.isArray(payload?.docs)) return payload.docs as Question[];
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
    status?: 'pending' | 'approved' | 'rejected';
  }): Promise<PaginatedResponse<Question>> {
    const safePage = params?.page ? Math.max(1, Number(params.page)) : undefined;
    const safeLimit = params?.limit ? Math.min(100, Math.max(1, Number(params.limit))) : undefined;

    const providedParams: Record<string, any> = {};
    if (params?.topicId) providedParams.topicId = params.topicId;
    if (safePage) providedParams.page = safePage;
    if (safeLimit) providedParams.limit = safeLimit;
    if (params?.status) providedParams.status = params.status;

    const attempts = [
      ...(Object.keys(providedParams).length > 0 ? [{ params: providedParams }] : []),
      {},
      { params: { page: 1, limit: 50 } },
      { params: { page: 1 } },
    ];

    let lastError: unknown;

    for (const attempt of attempts) {
      try {
        const response = await apiClient.get<ApiResponse<PaginatedResponse<Question>>>(
          '/api/questions',
          attempt as any
        );
        const envelope: any = response.data;
        const payload: any = envelope?.data;

        if (Array.isArray(payload)) {
          const totalFromEnvelope = Number(
            envelope?.total ??
              envelope?.count ??
              envelope?.totalQuestions ??
              envelope?.pagination?.total ??
              envelope?.meta?.total ??
              payload.length
          );
          const pageFromEnvelope = Number(
            envelope?.page ?? envelope?.pagination?.page ?? envelope?.meta?.page ?? safePage ?? 1
          );
          const limitFromEnvelope = Number(
            envelope?.limit ??
              envelope?.pagination?.limit ??
              envelope?.meta?.limit ??
              safeLimit ??
              payload.length ??
              1
          );
          const totalPagesFromEnvelope = Number(
            envelope?.totalPages ??
              envelope?.pages ??
              envelope?.pagination?.pages ??
              envelope?.meta?.totalPages
          ) || Math.max(1, Math.ceil(totalFromEnvelope / Math.max(1, limitFromEnvelope)));

          return {
            data: payload,
            total: totalFromEnvelope,
            page: pageFromEnvelope,
            limit: limitFromEnvelope,
            totalPages: totalPagesFromEnvelope,
          } as PaginatedResponse<Question>;
        }

        const records = toQuestionArray(payload);
        const total =
          Number(
            payload?.total ??
              payload?.count ??
              payload?.totalQuestions ??
              payload?.pagination?.total ??
              payload?.meta?.total ??
              envelope?.total ??
              envelope?.count ??
              envelope?.totalQuestions ??
              envelope?.pagination?.total ??
              envelope?.meta?.total ??
              records.length
          ) || records.length;
        const page =
          Number(
            payload?.page ??
              payload?.pagination?.page ??
              payload?.meta?.page ??
              envelope?.page ??
              envelope?.pagination?.page ??
              envelope?.meta?.page ??
              safePage ??
              1
          ) || 1;
        const limit =
          Number(
            payload?.limit ??
              payload?.pagination?.limit ??
              payload?.meta?.limit ??
              envelope?.limit ??
              envelope?.pagination?.limit ??
              envelope?.meta?.limit ??
              safeLimit ??
              records.length ??
              1
          ) || 1;
        const totalPages =
          Number(
            payload?.totalPages ??
              payload?.pages ??
              payload?.pagination?.pages ??
              payload?.pagination?.totalPages ??
              payload?.meta?.totalPages ??
              envelope?.totalPages ??
              envelope?.pages ??
              envelope?.pagination?.pages ??
              envelope?.pagination?.totalPages ??
              envelope?.meta?.totalPages
          ) ||
          Math.max(1, Math.ceil(total / Math.max(1, limit)));

        return {
          data: records,
          total,
          page,
          limit,
          totalPages,
        } as PaginatedResponse<Question>;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
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
  async approveQuestion(questionId: string, data?: { adminId?: string; notes?: string }): Promise<void> {
    await apiClient.post(`/api/questions/approve/${questionId}`, data ?? {});
  },

  // POST /questions/reject/:questionId (admin only)
  async rejectQuestion(questionId: string, reason: string, data?: { adminId?: string; notes?: string }): Promise<void> {
    await apiClient.post(`/api/questions/reject/${questionId}`, { reason, ...(data ?? {}) });
  },

  // DELETE /questions/:questionId (admin only)
  async deleteQuestion(questionId: string): Promise<void> {
    await apiClient.delete(`/api/questions/${questionId}`);
  },

  // PUT /questions/:questionId (admin only)
  async updateQuestion(questionId: string, payload: Partial<Question>): Promise<Question> {
    const response = await apiClient.put<ApiResponse<Question>>(`/api/questions/${questionId}`, payload);
    return response.data.data;
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
