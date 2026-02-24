import apiClient from '../api';
import {
  ApiResponse,
  StartExamRequest,
  StartExamResponse,
  ExamSubmitResponse,
  ExamSession,
  PaginatedResponse,
  DailyExamLimitResponse,
} from '../../types';

const unwrapPayload = <T = any>(payload: any): T => {
  if (payload && typeof payload === 'object') {
    if ('data' in payload && payload.data !== undefined) {
      return unwrapPayload<T>(payload.data);
    }
    if ('result' in payload && payload.result !== undefined) {
      return unwrapPayload<T>(payload.result);
    }
  }
  return payload as T;
};

const toNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeResultItem = (item: any) => {
  const options = Array.isArray(item?.options)
    ? item.options
    : Array.isArray(item?.choices)
    ? item.choices
    : [];

  return {
    ...item,
    _id: item?._id ?? item?.id ?? item?.questionId,
    text: item?.text ?? item?.questionText ?? item?.question ?? '',
    questionText: item?.questionText ?? item?.question ?? item?.text ?? '',
    options,
    userAnswer:
      item?.userAnswer ??
      item?.selectedAnswer ??
      item?.studentAnswer ??
      item?.answer,
    correctAnswer:
      item?.correctAnswer ??
      item?.correctOption ??
      item?.answerKey ??
      item?.expectedAnswer,
    isCorrect: Boolean(
      item?.isCorrect ?? item?.correct ?? item?.is_correct ?? item?.isAnswerCorrect
    ),
    explanation: item?.explanation ?? item?.solution,
  };
};

const normalizeExamSubmitResponse = (payload: any): ExamSubmitResponse => {
  const base = unwrapPayload<any>(payload) ?? {};
  const rawResults =
    base?.results ??
    base?.review ??
    base?.questionResults ??
    base?.answersReview ??
    [];

  const results = Array.isArray(rawResults)
    ? rawResults.map(normalizeResultItem)
    : [];

  const totalQuestions =
    toNumber(base?.totalQuestions, NaN) ||
    toNumber(base?.questionCount, NaN) ||
    results.length;

  const correctAnswers =
    toNumber(base?.correctAnswers, NaN) ||
    toNumber(base?.correctCount, NaN) ||
    toNumber(base?.scoreBreakdown?.correct, NaN) ||
    results.filter((item) => item.isCorrect).length;

  const percentage =
    toNumber(base?.percentage, NaN) ||
    toNumber(base?.score, NaN) ||
    (totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0);

  return {
    examSessionId:
      base?.examSessionId ??
      base?.examId ??
      base?._id ??
      base?.id ??
      '',
    totalQuestions,
    correctAnswers,
    percentage,
    isPassed:
      typeof base?.isPassed === 'boolean'
        ? base.isPassed
        : typeof base?.passed === 'boolean'
        ? base.passed
        : percentage >= 40,
    timeTaken:
      toNumber(base?.timeTaken, NaN) ||
      toNumber(base?.durationTaken, NaN) ||
      toNumber(base?.elapsedTime, NaN) ||
      undefined,
    results,
  };
};

const normalizeExamSession = (exam: any): ExamSession => ({
  ...exam,
  _id: exam?._id ?? exam?.id ?? exam?.examSessionId ?? '',
  totalQuestions:
    toNumber(exam?.totalQuestions, NaN) ||
    toNumber(exam?.questionCount, NaN) ||
    toNumber(exam?.questions?.length, 0),
  correctAnswers:
    toNumber(exam?.correctAnswers, NaN) ||
    toNumber(exam?.correctCount, NaN) ||
    toNumber(exam?.scoreBreakdown?.correct, 0),
  percentage:
    toNumber(exam?.percentage, NaN) ||
    toNumber(exam?.score, NaN) ||
    0,
  isPassed:
    typeof exam?.isPassed === 'boolean'
      ? exam.isPassed
      : typeof exam?.passed === 'boolean'
      ? exam.passed
      : (toNumber(exam?.percentage, NaN) || toNumber(exam?.score, 0)) >= 40,
});

const normalizeDailyLimitResponse = (payload: any, courseId: string): DailyExamLimitResponse => {
  const base = unwrapPayload<any>(payload) ?? {};

  return {
    plan: base?.plan ?? base?.tier ?? 'free',
    dailyLimit:
      toNumber(base?.dailyLimit, NaN) ||
      toNumber(base?.maxPerDay, NaN) ||
      toNumber(base?.limit, 0),
    usedToday:
      toNumber(base?.usedToday, NaN) ||
      toNumber(base?.questionsUsedToday, NaN) ||
      toNumber(base?.used, 0),
    remainingToday:
      toNumber(base?.remainingToday, NaN) ||
      toNumber(base?.remaining, NaN) ||
      toNumber(base?.questionsRemainingToday, 0),
    resetsAt: base?.resetsAt ?? base?.resetAt ?? base?.nextResetAt,
    courseId: base?.courseId ?? courseId,
  };
};

export interface ExamSubmitRequest {
  answers?: Record<string, string>;
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
  // GET /exams/daily-limit?courseId=...
  async getDailyLimit(courseId: string): Promise<DailyExamLimitResponse> {
    const response = await apiClient.get<ApiResponse<DailyExamLimitResponse>>(
      '/api/exams/daily-limit',
      { params: { courseId } }
    );
    console.log('[DEBUG] Daily Limit Raw Response for courseId', courseId, ':', response.data);
    const result = normalizeDailyLimitResponse(response.data, courseId);
    console.log('[DEBUG] Daily Limit Normalized:', result);
    return result;
  },

  // POST /exams/start
  async startExam(data: StartExamRequest): Promise<StartExamResponse> {
    const response = await apiClient.post<ApiResponse<StartExamResponse>>(
      '/api/exams/start',
      data
    );
    return unwrapPayload<StartExamResponse>(response.data);
  },

  // POST /exams/:examSessionId/answer
  async submitAnswer(examSessionId: string, data: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const response = await apiClient.post<ApiResponse<SubmitAnswerResponse>>(
      `/api/exams/${examSessionId}/answer`,
      data
    );
    return unwrapPayload<SubmitAnswerResponse>(response.data);
  },

  // GET /exams/:examSessionId/summary
  async getExamSummary(examSessionId: string): Promise<ExamSummaryResponse> {
    const response = await apiClient.get<ApiResponse<ExamSummaryResponse>>(
      `/api/exams/${examSessionId}/summary`
    );
    const payload = unwrapPayload<any>(response.data) ?? {};

    return {
      ...payload,
      examSessionId: payload?.examSessionId ?? payload?.examId ?? examSessionId,
      totalQuestions:
        toNumber(payload?.totalQuestions, NaN) ||
        toNumber(payload?.questionCount, 0),
      answeredQuestions:
        toNumber(payload?.answeredQuestions, NaN) ||
        toNumber(payload?.answeredCount, 0),
      correctAnswers:
        toNumber(payload?.correctAnswers, NaN) ||
        toNumber(payload?.correctCount, 0),
      currentScore:
        toNumber(payload?.currentScore, NaN) ||
        toNumber(payload?.score, 0),
      percentageComplete:
        toNumber(payload?.percentageComplete, NaN) ||
        toNumber(payload?.completion, 0),
      remainingTime:
        toNumber(payload?.remainingTime, NaN) ||
        toNumber(payload?.remainingTimeSeconds, NaN) ||
        (typeof payload?.remainingTimeMinutes === 'number'
          ? payload.remainingTimeMinutes * 60
          : 0),
      questionBreakdown: {
        answered:
          toNumber(payload?.questionBreakdown?.answered, NaN) ||
          toNumber(payload?.answeredQuestions, NaN) ||
          toNumber(payload?.answeredCount, 0),
        skipped:
          toNumber(payload?.questionBreakdown?.skipped, NaN) ||
          toNumber(payload?.skippedQuestions, NaN) ||
          0,
        flagged:
          toNumber(payload?.questionBreakdown?.flagged, NaN) ||
          toNumber(payload?.flaggedQuestions, NaN) ||
          0,
      },
    };
  },

  // POST /exams/:examSessionId/submit
  async submitExam(
    examSessionId: string,
    data?: ExamSubmitRequest
  ): Promise<ExamSubmitResponse> {
    const response = await apiClient.post<ApiResponse<ExamSubmitResponse>>(
      `/api/exams/${examSessionId}/submit`,
      data || {}
    );
    return normalizeExamSubmitResponse(response.data);
  },

  // GET /exams/:examSessionId/results
  async getResults(examSessionId: string): Promise<ExamSubmitResponse> {
    const response = await apiClient.get<ApiResponse<ExamSubmitResponse>>(
      `/api/exams/${examSessionId}/results`
    );
    console.log('[DEBUG] Exam Results Raw Response for', examSessionId, ':', response.data);
    const result = normalizeExamSubmitResponse(response.data);
    console.log('[DEBUG] Exam Results Normalized:', result);
    return result;
  },

  // GET /exams/history
  async getHistory(page = 1, limit = 10): Promise<PaginatedResponse<ExamSession>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ExamSession>>>(
      '/api/exams/history',
      { params: { page, limit } }
    );
    const payload = unwrapPayload<any>(response.data);

    if (Array.isArray(payload)) {
      const normalized = payload.map(normalizeExamSession);
      return {
        data: normalized,
        total: normalized.length,
        page,
        limit,
        totalPages: 1,
      };
    }

    const list =
      payload?.data ??
      payload?.items ??
      payload?.examSessions ??
      payload?.results ??
      [];

    const normalizedList = Array.isArray(list) ? list.map(normalizeExamSession) : [];

    return {
      data: normalizedList,
      total: toNumber(payload?.total, NaN) || toNumber(payload?.count, NaN) || normalizedList.length,
      page: toNumber(payload?.page, NaN) || toNumber(payload?.currentPage, NaN) || page,
      limit: toNumber(payload?.limit, NaN) || toNumber(payload?.perPage, NaN) || limit,
      totalPages: toNumber(payload?.totalPages, NaN) || toNumber(payload?.pages, NaN) || 1,
    };
  },

  // GET /exams/active
  async getActiveExam(): Promise<ActiveExamResponse> {
    const response = await apiClient.get<ApiResponse<ActiveExamResponse>>(
      '/api/exams/active'
    );
    const payload = unwrapPayload<any>(response.data) ?? {};
    return {
      ...payload,
      examSessionId: payload?.examSessionId ?? payload?.examId ?? payload?._id ?? '',
      totalQuestions:
        toNumber(payload?.totalQuestions, NaN) ||
        toNumber(payload?.questionCount, 0),
      answeredQuestions:
        toNumber(payload?.answeredQuestions, NaN) ||
        toNumber(payload?.answeredCount, 0),
      correctAnswers:
        toNumber(payload?.correctAnswers, NaN) ||
        toNumber(payload?.correctCount, 0),
      remainingTime:
        toNumber(payload?.remainingTime, NaN) ||
        toNumber(payload?.remainingTimeSeconds, NaN) ||
        (typeof payload?.remainingTimeMinutes === 'number'
          ? payload.remainingTimeMinutes * 60
          : 0),
      percentageComplete:
        toNumber(payload?.percentageComplete, NaN) ||
        toNumber(payload?.completion, 0),
    };
  },

  // POST /exams/:examSessionId/abandon
  async abandonExam(examSessionId: string): Promise<{ examSessionId: string; status: string; abandonedAt: string }> {
    const response = await apiClient.post<ApiResponse<{ examSessionId: string; status: string; abandonedAt: string }>>(
      `/api/exams/${examSessionId}/abandon`,
      {}
    );
    const payload = unwrapPayload<any>(response.data) ?? {};
    return {
      examSessionId: payload?.examSessionId ?? payload?.examId ?? examSessionId,
      status: payload?.status ?? 'abandoned',
      abandonedAt: payload?.abandonedAt ?? payload?.updatedAt ?? new Date().toISOString(),
    };
  },
};
