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

export interface SubmitAnswerRequest {
  questionId: string;
  selectedAnswer: string;
  timeSpentSeconds?: number;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
  explanation?: string;
  points: number;
  progress: {
    answeredQuestions: number;
    correctAnswers: number;
    percentage: number;
    remainingQuestions: number;
    remainingTime: number;
  };
}

export interface ExamSummaryResponse {
  examSessionId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  examType: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  currentScore: number;
  percentageComplete: number;
  remainingTime: number;
  questionBreakdown: {
    answered: number;
    skipped: number;
    flagged: number;
  };
}

export interface ActiveExamResponse {
  examSessionId: string;
  status: 'in_progress';
  examType: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  remainingTime: number;
  percentageComplete: number;
}

export const examService = {
  // POST /exams/start
  async startExam(data: StartExamRequest): Promise<StartExamResponse> {
    const response = await apiClient.post<ApiResponse<StartExamResponse>>(
      '/api/exams/start',
      data
    );
    return response.data.data;
  },

  // POST /exams/:examSessionId/answer
  async submitAnswer(examSessionId: string, data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const response = await apiClient.post<ApiResponse<SubmitAnswerResponse>>(
      `/api/exams/${examSessionId}/answer`,
      data
    );
    return response.data.data;
  },

  // GET /exams/:examSessionId/summary
  async getExamSummary(examSessionId: string): Promise<ExamSummaryResponse> {
    const response = await apiClient.get<ApiResponse<ExamSummaryResponse>>(
      `/api/exams/${examSessionId}/summary`
    );
    return response.data.data;
  },

  // POST /exams/:examSessionId/submit
  async submitExam(examSessionId: string): Promise<ExamSubmitResponse> {
    const response = await apiClient.post<ApiResponse<ExamSubmitResponse>>(
      `/api/exams/${examSessionId}/submit`,
      {}
    );
    return response.data.data;
  },

  // GET /exams/:examSessionId/results
  async getResults(examSessionId: string): Promise<ExamSubmitResponse> {
    const response = await apiClient.get<ApiResponse<ExamSubmitResponse>>(
      `/api/exams/${examSessionId}/results`
    );
    return response.data.data;
  },

  // GET /exams/history
  async getHistory(page = 1, limit = 10): Promise<PaginatedResponse<ExamSession>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ExamSession>>>(
      '/api/exams/history',
      { params: { page, limit } }
    );
    return response.data.data;
  },

  // GET /exams/active
  async getActiveExam(): Promise<ActiveExamResponse> {
    const response = await apiClient.get<ApiResponse<ActiveExamResponse>>(
      '/api/exams/active'
    );
    return response.data.data;
  },

  // POST /exams/:examSessionId/abandon
  async abandonExam(examSessionId: string): Promise<{ examSessionId: string; status: string; abandonedAt: string }> {
    const response = await apiClient.post<ApiResponse<{ examSessionId: string; status: string; abandonedAt: string }>>(
      `/api/exams/${examSessionId}/abandon`,
      {}
    );
    return response.data.data;
  },
};
