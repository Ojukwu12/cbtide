import apiClient from '../api';
import {
  ApiResponse,
  ExamSession,
  ExamSummary,
  ExamResult,
  StartExamRequest,
  AnswerQuestionRequest,
  PaginatedResponse,
} from '../../types';

export const examService = {
  async startExam(data: StartExamRequest): Promise<ExamSession> {
    const response = await apiClient.post<ApiResponse<ExamSession>>(
      '/api/exams/start',
      data
    );
    return response.data.data;
  },

  async answerQuestion(
    examSessionId: string,
    data: AnswerQuestionRequest
  ): Promise<void> {
    await apiClient.post(`/api/exams/${examSessionId}/answer`, data);
  },

  async getSummary(examSessionId: string): Promise<ExamSummary> {
    const response = await apiClient.get<ApiResponse<ExamSummary>>(
      `/api/exams/${examSessionId}/summary`
    );
    return response.data.data;
  },

  async submitExam(examSessionId: string): Promise<void> {
    await apiClient.post(`/api/exams/${examSessionId}/submit`);
  },

  async getResults(examSessionId: string): Promise<ExamResult> {
    const response = await apiClient.get<ApiResponse<ExamResult>>(
      `/api/exams/${examSessionId}/results`
    );
    return response.data.data;
  },

  async getHistory(page = 1, limit = 10): Promise<PaginatedResponse<ExamSession>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ExamSession>>>(
      '/api/exams/history',
      { params: { page, limit } }
    );
    return response.data.data;
  },

  async getActiveExams(): Promise<ExamSession[]> {
    const response = await apiClient.get<ApiResponse<ExamSession[]>>(
      '/api/exams/active'
    );
    return response.data.data;
  },

  async abandonExam(examSessionId: string): Promise<void> {
    await apiClient.post(`/api/exams/${examSessionId}/abandon`);
  },
};
