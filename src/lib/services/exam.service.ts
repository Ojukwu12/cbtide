import apiClient from '../api';
import {
  ApiResponse,
  StartExamRequest,
  StartExamResponse,
  ExamSubmitResponse,
  ExamSession,
  PaginatedResponse,
} from '../../types';

export interface ExamSubmitRequest {
  examSessionId: string;
  answers: Record<string, string>;
}

export const examService = {
  async startExam(data: StartExamRequest): Promise<StartExamResponse> {
    const response = await apiClient.post<ApiResponse<StartExamResponse>>(
      '/api/exam/start',
      data
    );
    return response.data.data;
  },

  async submitExam(data: ExamSubmitRequest): Promise<ExamSubmitResponse> {
    const response = await apiClient.post<ApiResponse<ExamSubmitResponse>>(
      '/api/exam/submit',
      data
    );
    return response.data.data;
  },

  async getResults(examSessionId: string): Promise<ExamSubmitResponse> {
    const response = await apiClient.get<ApiResponse<ExamSubmitResponse>>(
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
};
