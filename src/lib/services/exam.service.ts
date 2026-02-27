import apiClient from '../api';
import { applyLocalConsumptionToDailyLimit, recordStartedExamConsumption } from '../dailyLimitLedger';
import {
  ApiResponse,
  StartExamRequest,
  StartExamResponse,
  ExamSubmitResponse,
  ExamSession,
  PaginatedResponse,
  DailyExamLimitResponse,
} from '../../types';

const enableLegacyRouteFallback =
  String((import.meta as any).env?.VITE_ENABLE_LEGACY_ROUTE_FALLBACK || '').toLowerCase() === 'true';

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

const firstFiniteNumber = (...values: any[]): number | undefined => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const normalizeResultOptions = (item: any): Array<{ _id?: string; id?: string; text: string; option?: string; value?: string }> => {
  const rawOptions =
    item?.options ??
    item?.choices ??
    item?.answers;

  if (Array.isArray(rawOptions)) {
    return rawOptions
      .map((option: any) => {
        if (typeof option === 'string') {
          return { text: option };
        }

        const optionText = String(option?.text ?? option?.option ?? option?.value ?? '').trim();
        if (!optionText) return null;

        return {
          ...option,
          text: optionText,
        };
      })
      .filter((entry): entry is { _id?: string; id?: string; text: string; option?: string; value?: string } => Boolean(entry));
  }

  if (rawOptions && typeof rawOptions === 'object') {
    const orderedLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    return orderedLabels
      .map((label) => {
        const value = rawOptions[label] ?? rawOptions[label.toLowerCase()];
        if (value === undefined || value === null) return null;

        if (typeof value === 'string') {
          const text = value.trim();
          if (!text) return null;
          return { text };
        }

        const text = String(value?.text ?? value?.option ?? value?.value ?? '').trim();
        if (!text) return null;

        return {
          ...value,
          text,
        };
      })
      .filter((entry): entry is { _id?: string; id?: string; text: string; option?: string; value?: string } => Boolean(entry));
  }

  const fallbackKeys = ['optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF'];
  return fallbackKeys
    .map((key) => {
      const value = item?.[key];
      if (value === undefined || value === null) return null;
      const text = String(value).trim();
      return text ? { text } : null;
    })
    .filter((entry): entry is { text: string } => Boolean(entry));
};

const normalizeQuestionText = (item: any): string => {
  const directText =
    item?.questionText ??
    item?.question ??
    item?.text ??
    item?.title ??
    item?.prompt ??
    item?.stem;

  if (typeof directText === 'string') {
    return directText.trim();
  }

  if (directText && typeof directText === 'object') {
    const nested =
      directText?.text ??
      directText?.questionText ??
      directText?.question ??
      directText?.prompt ??
      directText?.title;

    if (typeof nested === 'string') {
      return nested.trim();
    }
  }

  return '';
};

const normalizeResultItem = (item: any, index?: number) => {
  const options = normalizeResultOptions(item);
  const questionText = normalizeQuestionText(item);
  const userAnswer = 
    item?.userAnswer ??
    item?.selectedAnswer ??
    item?.studentAnswer ??
    item?.answer ??
    item?.userResponse ??
    item?.response;
  
  const correctAnswer =
    item?.correctAnswer ??
    item?.correctOption ??
    item?.answerKey ??
    item?.expectedAnswer ??
    item?.correct;

  const isCorrect = Boolean(
    item?.isCorrect ?? 
    item?.correct ?? 
    item?.is_correct ?? 
    item?.isAnswerCorrect ??
    (userAnswer && correctAnswer && userAnswer === correctAnswer)
  );

  const normalized = {
    ...item,
    _id: item?._id ?? item?.id ?? item?.questionId ?? `q-${index}`,
    text: questionText,
    questionText,
    options,
    userAnswer,
    correctAnswer,
    isCorrect,
    explanation: item?.explanation ?? item?.solution ?? item?.hint,
  };

  // Log first few items for debugging
  if (index !== undefined && index < 2) {
    console.log(`[DEBUG normalizeResultItem] Item ${index} before:`, item);
    console.log(`[DEBUG normalizeResultItem] Item ${index} after:`, normalized);
  }

  return normalized;
};

const normalizeExamSubmitResponse = (payload: any): ExamSubmitResponse => {
  const base = unwrapPayload<any>(payload) ?? {};
  
  console.log('[DEBUG normalizeExamSubmitResponse] Unwrapped base keys:', base ? Object.keys(base) : 'null');
  console.log('[DEBUG normalizeExamSubmitResponse] base.results:', base?.results);
  console.log('[DEBUG normalizeExamSubmitResponse] base.review:', base?.review);
  console.log('[DEBUG normalizeExamSubmitResponse] base.questions:', base?.questions);
  console.log('[DEBUG normalizeExamSubmitResponse] base.questionResults:', base?.questionResults);
  console.log('[DEBUG normalizeExamSubmitResponse] base.answers:', base?.answers);
  console.log('[DEBUG normalizeExamSubmitResponse] base.answersReview:', base?.answersReview);
  
  const rawResults =
    base?.results ??
    base?.review ??
    base?.questions ??
    base?.questionResults ??
    base?.answers ??
    base?.answersReview ??
    base?.data ??
    base?.items ??
    [];

  console.log('[DEBUG normalizeExamSubmitResponse] rawResults type:', typeof rawResults, Array.isArray(rawResults));
  console.log('[DEBUG normalizeExamSubmitResponse] rawResults length:', Array.isArray(rawResults) ? rawResults.length : 'not array');
  console.log('[DEBUG normalizeExamSubmitResponse] First raw result:', Array.isArray(rawResults) ? rawResults[0] : null);

  const results = Array.isArray(rawResults)
    ? rawResults.map((item, index) => normalizeResultItem(item, index))
    : [];

  const totalQuestions =
    toNumber(base?.totalQuestions, NaN) ||
    toNumber(base?.questionCount, NaN) ||
    toNumber(base?.total, NaN) ||
    results.length;

  const correctAnswers =
    toNumber(base?.correctAnswers, NaN) ||
    toNumber(base?.correctCount, NaN) ||
    toNumber(base?.correct, NaN) ||
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
        : percentage >= 50,
    timeTaken:
      toNumber(base?.timeTaken, NaN) ||
      toNumber(base?.durationTaken, NaN) ||
      toNumber(base?.elapsedTime, NaN) ||
      toNumber(base?.duration, NaN) ||
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
    toNumber(exam?.scorePercentage, NaN) ||
    toNumber(exam?.percentageScore, NaN) ||
    toNumber(exam?.percent, NaN) ||
    toNumber(exam?.score, NaN) ||
    0,
  isPassed:
    typeof exam?.isPassed === 'boolean'
      ? exam.isPassed
      : typeof exam?.passed === 'boolean'
      ? exam.passed
      : (
          toNumber(exam?.percentage, NaN) ||
          toNumber(exam?.scorePercentage, NaN) ||
          toNumber(exam?.percentageScore, NaN) ||
          toNumber(exam?.percent, NaN) ||
          toNumber(exam?.score, 0)
        ) >= 50,
});

const normalizeDailyLimitResponse = (payload: any, courseId: string): DailyExamLimitResponse => {
  const base = unwrapPayload<any>(payload) ?? {};
  const limitContainer = base?.dailyLimit ?? base?.limitStatus ?? base?.limits ?? base?.quota ?? {};
  const tierInfo = base?.tierInfo ?? limitContainer?.tierInfo ?? {};
  const courseLimitFromArray = Array.isArray(base?.courseLimits)
    ? base.courseLimits.find((entry: any) => String(entry?.courseId ?? entry?.course ?? entry?.id ?? '') === String(courseId))
    : null;
  const courseLimitFromMap =
    base?.courseLimits && typeof base?.courseLimits === 'object' && !Array.isArray(base?.courseLimits)
      ? base.courseLimits?.[courseId]
      : null;
  const courseLimit =
    base?.courseLimit ??
    base?.courseQuota ??
    limitContainer?.courseLimit ??
    limitContainer?.courseQuota ??
    tierInfo?.courseLimit ??
    tierInfo?.courseQuota ??
    courseLimitFromArray ??
    courseLimitFromMap ??
    null;

  const metricSources = [
    base,
    limitContainer,
    tierInfo,
    tierInfo?.limits,
    tierInfo?.limitStatus,
    courseLimit,
    courseLimit?.limits,
  ].filter(Boolean);
  const pickMetric = (...keys: string[]): number | undefined => {
    for (const source of metricSources) {
      for (const key of keys) {
        const parsed = Number((source as any)?.[key]);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return undefined;
  };
  const plan = String(base?.plan ?? base?.tier ?? tierInfo?.plan ?? tierInfo?.tier ?? 'free').toLowerCase();
  const planDefaults: Record<string, number> = {
    free: 120,
    basic: 200,
    premium: 250,
    admin: 100000,
  };

  const resolvedDailyLimit = pickMetric(
    'dailyLimit',
    'dailyLimitForCourse',
    'courseDailyLimit',
    'maxPerDay',
    'limit',
    'maxQuestionsPerDay',
    'maxQuestionsPerDayForCourse',
    'questionDailyLimit',
    'quota'
  ) ?? 0;
  const resolvedUsedToday = pickMetric(
    'usedTodayForCourse',
    'questionsUsedTodayForCourse',
    'courseUsedToday',
    'usedToday',
    'questionsUsedToday',
    'used',
    'questionUsedToday',
    'consumedToday'
  ) ?? 0;
  const resolvedRemainingToday = pickMetric(
    'remainingTodayForCourse',
    'questionsRemainingTodayForCourse',
    'remainingQuestionsForCourse',
    'courseRemainingToday',
    'remainingToday',
    'remaining',
    'questionsRemainingToday',
    'remainingQuestions',
    'questionRemainingToday',
    'availableToday'
  ) ?? 0;

  const fallbackLimit = planDefaults[plan] ?? 120;
  const derivedRemainingToday =
    resolvedRemainingToday > 0
      ? resolvedRemainingToday
      : resolvedDailyLimit > 0
      ? Math.max(0, resolvedDailyLimit - resolvedUsedToday)
      : 0;

  const derivedDailyLimit =
    resolvedDailyLimit > 0
      ? resolvedDailyLimit
      : resolvedUsedToday + Math.max(0, derivedRemainingToday);

  const shouldFallbackToPlanDefault =
    derivedDailyLimit <= 0 && resolvedUsedToday <= 0 && derivedRemainingToday <= 0;

  const dailyLimit = shouldFallbackToPlanDefault ? fallbackLimit : derivedDailyLimit;
  const usedToday = shouldFallbackToPlanDefault ? 0 : resolvedUsedToday;
  const remainingToday = shouldFallbackToPlanDefault
    ? fallbackLimit
    : Math.max(0, derivedRemainingToday);

  return {
    plan: (base?.plan ?? base?.tier ?? tierInfo?.plan ?? tierInfo?.tier ?? 'free') as any,
    dailyLimit,
    usedToday,
    remainingToday,
    resetsAt: base?.resetsAt ?? base?.resetAt ?? base?.nextResetAt ?? tierInfo?.resetsAt ?? tierInfo?.resetAt ?? tierInfo?.nextResetAt,
    courseId: base?.courseId ?? tierInfo?.courseId ?? courseLimit?.courseId ?? courseId,
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
    const primaryEndpoints = [
      '/api/exams/daily-limit',
      `/api/exams/daily-limit/${courseId}`,
      '/api/exams/limit-status',
      '/api/exams/limits/daily',
      `/api/courses/${courseId}/exams/daily-limit`,
      `/api/courses/${courseId}/exams/limit-status`,
      `/api/courses/${courseId}/daily-limit`,
    ];

    const legacyEndpoints = enableLegacyRouteFallback
      ? primaryEndpoints
          .filter((endpoint) => endpoint.startsWith('/api/'))
          .map((endpoint) => endpoint.replace('/api/', '/'))
      : [];

    const endpointCandidates = Array.from(new Set([...primaryEndpoints, ...legacyEndpoints]));

    const queryParamAttempts: Array<Record<string, string>> = [
      { courseId },
      { course: courseId },
      { course_id: courseId },
      {},
    ];

    let lastError: any;
    for (const endpoint of endpointCandidates) {
      for (const params of queryParamAttempts) {
        try {
          const response = await apiClient.get<ApiResponse<DailyExamLimitResponse>>(endpoint, {
            params,
          });
          const normalized = normalizeDailyLimitResponse(response.data, courseId);
          return applyLocalConsumptionToDailyLimit(normalized, courseId);
        } catch (error: any) {
          lastError = error;
          const status = Number(error?.response?.status || 0);
          if (status !== 404 && status !== 400) {
            throw error;
          }
        }
      }
    }

    throw lastError;
  },

  // POST /exams/start
  async startExam(data: StartExamRequest): Promise<StartExamResponse> {
    const response = await apiClient.post<ApiResponse<StartExamResponse>>(
      '/api/exams/start',
      data
    );
    const result = unwrapPayload<StartExamResponse>(response.data);
    const allocatedQuestions = Array.isArray(result?.questions) && result.questions.length > 0
      ? result.questions.length
      : Number(data?.totalQuestions || 0);

    recordStartedExamConsumption(data.courseId, result.examSessionId, allocatedQuestions);
    return result;
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
    console.log('[DEBUG] Raw response.data type:', typeof response.data, Array.isArray(response.data));
    console.log('[DEBUG] Raw response keys:', response.data ? Object.keys(response.data) : 'null');
    
    const result = normalizeExamSubmitResponse(response.data);
    
    console.log('[DEBUG] Exam Results Normalized:', result);
    console.log('[DEBUG] Results array length:', result.results?.length || 0);
    console.log('[DEBUG] First result item:', result.results?.[0]);
    console.log('[DEBUG] Total questions:', result.totalQuestions);
    console.log('[DEBUG] Correct answers:', result.correctAnswers);
    
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
      payload?.exams ??
      payload?.history ??
      payload?.records ??
      payload?.rows ??
      payload?.results?.data ??
      payload?.history?.data ??
      payload?.history?.items ??
      payload?.history?.examSessions ??
      payload?.history?.exams ??
      payload?.results ??
      [];

    const normalizedList = Array.isArray(list) ? list.map(normalizeExamSession) : [];

    const meta = payload?.meta ?? payload?.pagination ?? payload?.pager ?? payload?.history?.meta ?? {};

    return {
      data: normalizedList,
      total:
        toNumber(payload?.total, NaN) ||
        toNumber(payload?.count, NaN) ||
        toNumber(payload?.totalCount, NaN) ||
        toNumber(meta?.total, NaN) ||
        toNumber(meta?.count, NaN) ||
        toNumber(meta?.totalCount, NaN) ||
        normalizedList.length,
      page:
        toNumber(payload?.page, NaN) ||
        toNumber(payload?.currentPage, NaN) ||
        toNumber(meta?.page, NaN) ||
        toNumber(meta?.currentPage, NaN) ||
        page,
      limit:
        toNumber(payload?.limit, NaN) ||
        toNumber(payload?.perPage, NaN) ||
        toNumber(meta?.limit, NaN) ||
        toNumber(meta?.perPage, NaN) ||
        limit,
      totalPages:
        toNumber(payload?.totalPages, NaN) ||
        toNumber(payload?.pages, NaN) ||
        toNumber(meta?.totalPages, NaN) ||
        toNumber(meta?.pages, NaN) ||
        1,
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
