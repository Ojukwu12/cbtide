import apiClient from '../api';
import { ApiResponse } from '../../types';

const toArray = <T = any>(value: any): T[] => (Array.isArray(value) ? value : []);

const toNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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

const normalizePriceHistory = (value: any): PriceHistory[] =>
  toArray<any>(value).map((entry) => ({
    price: Number(entry?.price ?? entry?.newPrice ?? entry?.amount ?? 0) || 0,
    changedAt: entry?.changedAt || entry?.createdAt || entry?.updatedAt || entry?.date || entry?.timestamp || new Date().toISOString(),
    changedBy:
      entry?.changedBy ??
      entry?.updatedBy ??
      entry?.admin ??
      entry?.author ??
      'System',
    reason: entry?.reason || entry?.description || entry?.note || 'Price updated',
  }));

const normalizeAdminPlan = (plan: any): AdminPlan => ({
  ...plan,
  price: Number(plan?.price ?? 0) || 0,
  duration: Number(plan?.duration ?? 30) || 30,
  features: toArray<string>(plan?.features),
  priceHistory: normalizePriceHistory(
    plan?.priceHistory ??
    plan?.history ??
    plan?.pricingHistory ??
    plan?.changes ??
    plan?.priceChanges
  ),
});

const normalizePromoCode = (promo: any): AdminPromoCode => ({
  ...promo,
  discountValue: Number(promo?.discountValue ?? 0) || 0,
  usageCount: Number(promo?.usageCount ?? 0) || 0,
  applicablePlans: toArray<string>(promo?.applicablePlans),
});

const normalizeAnalyticsOverview = (payload: any): AnalyticsOverview => ({
  totalUsers: toNumber(payload?.totalUsers ?? payload?.usersTotal ?? payload?.users),
  activeUsers: toNumber(payload?.activeUsers ?? payload?.activeUsersToday ?? payload?.usersActive),
  totalRevenue: toNumber(payload?.totalRevenue ?? payload?.revenueTotal ?? payload?.revenue),
  monthlyRevenue: toNumber(payload?.monthlyRevenue ?? payload?.monthRevenue ?? payload?.revenueThisMonth),
  freeUsers: toNumber(payload?.freeUsers ?? payload?.planDistribution?.free ?? payload?.freePlanUsers),
  basicPlanUsers: toNumber(payload?.basicPlanUsers ?? payload?.planDistribution?.basic ?? payload?.basicUsers),
  premiumPlanUsers: toNumber(payload?.premiumPlanUsers ?? payload?.planDistribution?.premium ?? payload?.premiumUsers),
  averageExamScore: toNumber(payload?.averageExamScore ?? payload?.avgExamScore ?? payload?.averageScore),
  totalExamsCompleted: toNumber(payload?.totalExamsCompleted ?? payload?.totalExams ?? payload?.examsCompleted),
  totalQuestionsAnswered: toNumber(payload?.totalQuestionsAnswered ?? payload?.questionsAnswered ?? payload?.totalAnswers),
  platformGrowthRate: toNumber(payload?.platformGrowthRate ?? payload?.growthRate ?? payload?.monthlyGrowthRate),
});

const normalizeUserMetrics = (payload: any): UserMetrics => ({
  totalUsers: toNumber(payload?.totalUsers ?? payload?.usersTotal),
  newUsersThisMonth: toNumber(payload?.newUsersThisMonth ?? payload?.newUsers ?? payload?.usersThisMonth),
  activeUsersToday: toNumber(payload?.activeUsersToday ?? payload?.activeToday),
  activeUsersThisWeek: toNumber(payload?.activeUsersThisWeek ?? payload?.activeThisWeek),
  activeUsersThisMonth: toNumber(payload?.activeUsersThisMonth ?? payload?.activeThisMonth),
  userRetentionRate: toNumber(payload?.userRetentionRate ?? payload?.retentionRate ?? payload?.retention),
  planDistribution: {
    free: toNumber(payload?.planDistribution?.free ?? payload?.freeUsers),
    basic: toNumber(payload?.planDistribution?.basic ?? payload?.basicUsers),
    premium: toNumber(payload?.planDistribution?.premium ?? payload?.premiumUsers),
  },
  roleDistribution: {
    student: toNumber(payload?.roleDistribution?.student ?? payload?.students),
    admin: toNumber(payload?.roleDistribution?.admin ?? payload?.admins),
  },
  averageSessionDuration: toNumber(payload?.averageSessionDuration ?? payload?.avgSessionDuration ?? payload?.sessionDuration),
  bannedUsersCount: toNumber(payload?.bannedUsersCount ?? payload?.bannedUsers ?? payload?.suspendedUsers),
});

const normalizeQuestionMetrics = (payload: any): QuestionMetrics => ({
  totalQuestions: toNumber(payload?.totalQuestions ?? payload?.questionsTotal),
  averageDifficulty: toNumber(payload?.averageDifficulty ?? payload?.avgDifficulty),
  mostAnsweredQuestions: toArray<any>(payload?.mostAnsweredQuestions ?? payload?.topAnsweredQuestions).map((item) => ({
    questionId: item?.questionId ?? item?._id ?? item?.id ?? '',
    text: item?.text ?? item?.questionText ?? item?.question ?? '',
    timesAnswered: toNumber(item?.timesAnswered ?? item?.count ?? item?.attempts),
    correctAnswerPercentage: toNumber(item?.correctAnswerPercentage ?? item?.accuracy ?? item?.correctRate),
  })),
  leastAnsweredQuestions: toArray<any>(payload?.leastAnsweredQuestions ?? payload?.bottomAnsweredQuestions).map((item) => ({
    questionId: item?.questionId ?? item?._id ?? item?.id ?? '',
    text: item?.text ?? item?.questionText ?? item?.question ?? '',
    timesAnswered: toNumber(item?.timesAnswered ?? item?.count ?? item?.attempts),
    correctAnswerPercentage: toNumber(item?.correctAnswerPercentage ?? item?.accuracy ?? item?.correctRate),
  })),
  averageAnswerTime: toNumber(payload?.averageAnswerTime ?? payload?.avgAnswerTime),
  questionsByDifficulty: {
    easy: toNumber(payload?.questionsByDifficulty?.easy ?? payload?.difficultyDistribution?.easy),
    medium: toNumber(payload?.questionsByDifficulty?.medium ?? payload?.difficultyDistribution?.medium),
    hard: toNumber(payload?.questionsByDifficulty?.hard ?? payload?.difficultyDistribution?.hard),
    veryhard: toNumber(payload?.questionsByDifficulty?.veryhard ?? payload?.difficultyDistribution?.veryhard),
  },
});

const normalizeExamMetrics = (payload: any): ExamMetrics => ({
  totalExamsCompleted: toNumber(payload?.totalExamsCompleted ?? payload?.totalExams ?? payload?.completedExams),
  examsThisMonth: toNumber(payload?.examsThisMonth ?? payload?.monthlyExams),
  averageScore: toNumber(payload?.averageScore ?? payload?.avgScore),
  passRate: toNumber(payload?.passRate ?? payload?.successRate),
  averageTimeSpent: toNumber(payload?.averageTimeSpent ?? payload?.avgTimeSpent),
  examsByStatus: {
    completed: toNumber(payload?.examsByStatus?.completed ?? payload?.completedExams),
    in_progress: toNumber(payload?.examsByStatus?.in_progress ?? payload?.inProgressExams),
    abandoned: toNumber(payload?.examsByStatus?.abandoned ?? payload?.abandonedExams),
  },
  topPerformingCourses: toArray<any>(payload?.topPerformingCourses ?? payload?.topCourses).map((item) => ({
    courseId: item?.courseId ?? item?._id ?? item?.id ?? '',
    courseName: item?.courseName ?? item?.name ?? item?.title ?? '',
    averageScore: toNumber(item?.averageScore ?? item?.avgScore),
    completedCount: toNumber(item?.completedCount ?? item?.count ?? item?.examCount),
  })),
  averageQuestionsDifficulty: toNumber(payload?.averageQuestionsDifficulty ?? payload?.avgQuestionDifficulty),
});

const normalizeRevenueMetrics = (payload: any): RevenueMetrics => ({
  totalRevenue: toNumber(payload?.totalRevenue ?? payload?.revenueTotal),
  monthlyRevenue: toNumber(payload?.monthlyRevenue ?? payload?.monthRevenue ?? payload?.revenueThisMonth),
  weeklyRevenue: toNumber(payload?.weeklyRevenue ?? payload?.weekRevenue),
  dailyRevenue: toNumber(payload?.dailyRevenue ?? payload?.todayRevenue),
  transactionCount: toNumber(payload?.transactionCount ?? payload?.transactionsTotal),
  averageTransactionValue: toNumber(payload?.averageTransactionValue ?? payload?.avgTransactionValue),
  revenueByPlan: {
    basic: toNumber(payload?.revenueByPlan?.basic ?? payload?.planRevenue?.basic),
    premium: toNumber(payload?.revenueByPlan?.premium ?? payload?.planRevenue?.premium),
  },
  promoCodeDiscountsApplied: toNumber(payload?.promoCodeDiscountsApplied ?? payload?.discountsApplied),
  pendingTransactions: toNumber(payload?.pendingTransactions ?? payload?.transactionsByStatus?.pending),
  failedTransactions: toNumber(payload?.failedTransactions ?? payload?.transactionsByStatus?.failed),
  successfulTransactions: toNumber(payload?.successfulTransactions ?? payload?.transactionsByStatus?.success),
  successRate: toNumber(payload?.successRate ?? payload?.transactionSuccessRate),
  topPromoCodes: toArray<any>(payload?.topPromoCodes ?? payload?.topPromos).map((item) => ({
    code: item?.code ?? '',
    usageCount: toNumber(item?.usageCount ?? item?.count),
    discountAmount: toNumber(item?.discountAmount ?? item?.discountTotal),
  })),
});

const normalizeUniversityAnalytics = (payload: any, universityId: string): UniversityAnalytics => ({
  universityId: payload?.universityId ?? payload?._id ?? universityId,
  universityName: payload?.universityName ?? payload?.name ?? '',
  totalStudents: toNumber(payload?.totalStudents ?? payload?.studentsTotal),
  totalFaculty: toNumber(payload?.totalFaculty ?? payload?.facultyTotal),
  totalDepartments: toNumber(payload?.totalDepartments ?? payload?.departmentsTotal),
  activeStudents: toNumber(payload?.activeStudents ?? payload?.studentsActive),
  totalExamsCompleted: toNumber(payload?.totalExamsCompleted ?? payload?.totalExams),
  averageExamScore: toNumber(payload?.averageExamScore ?? payload?.avgExamScore),
  passRate: toNumber(payload?.passRate ?? payload?.successRate),
  revenueGenerated: toNumber(payload?.revenueGenerated ?? payload?.totalRevenue),
  topPerformingCourses: toArray<any>(payload?.topPerformingCourses ?? payload?.topCourses).map((item) => ({
    courseId: item?.courseId ?? item?._id ?? item?.id ?? '',
    courseName: item?.courseName ?? item?.name ?? item?.title ?? '',
    averageScore: toNumber(item?.averageScore ?? item?.avgScore),
  })),
  departmentBreakdown: toArray<any>(payload?.departmentBreakdown ?? payload?.departments).map((item) => ({
    departmentName: item?.departmentName ?? item?.name ?? '',
    studentCount: toNumber(item?.studentCount ?? item?.students),
    averageScore: toNumber(item?.averageScore ?? item?.avgScore),
  })),
});

// ============== PRICING TYPES ==============
export interface AdminPlan {
  _id: string;
  plan: 'basic' | 'premium' | 'free';
  name: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
  priceHistory: PriceHistory[];
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistory {
  price: number;
  changedAt: string;
  changedBy: string | { _id: string; firstName: string; lastName: string; email: string };
  reason: string;
}

export interface CreateOrUpdatePlanRequest {
  price: number;
  name?: string;
  duration?: number;
  features?: string[];
  reason?: string;
  isActive?: boolean;
}

export interface PricingAnalytics {
  totalRevenue: number;
  revenueByPlan: { basic: number; premium: number };
  planCounts: { free: number; basic: number; premium: number };
  activePromos: number;
  totalDiscounts: number;
}

// ============== PROMO CODE TYPES ==============
export interface AdminPromoCode {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicablePlans: string[];
  maxUsageCount: number | null;
  maxUsagePerUser: number;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdBy: string | { _id: string; firstName: string; lastName: string; email: string };
  usedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromoCodeRequest {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicablePlans?: string[];
  maxUsageCount?: number;
  maxUsagePerUser: number;
  validFrom: string;
  validUntil: string;
}

export interface UpdatePromoCodeRequest {
  description?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  applicablePlans?: string[];
  maxUsageCount?: number;
  maxUsagePerUser?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

export interface AdminPromoCodeStats {
  code: string;
  description: string;
  usageCount: number;
  maxUsageCount: number | null;
  totalDiscountGiven: number;
  totalRevenue: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  usages: Array<{
    _id: string;
    userId: { _id: string; firstName: string; lastName: string; email: string };
    transactionId: string;
    usedAt: string;
    amount: number;
    discountApplied: number;
  }>;
}

export interface PaginatedPromoResponse {
  data: AdminPromoCode[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

// ============== USER TYPES ==============
export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  universityId: string;
  plan: 'free' | 'basic' | 'premium';
  planExpiresAt: string | null;
  role: 'student' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  banReason?: string;
  bannedAt?: string;
  unbanDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetails extends AdminUser {
  banDuration?: string;
}

export interface BanUserRequest {
  reason: string;
  duration?: '7days' | '30days' | '90days' | 'permanent';
}

export interface ChangeUserRoleRequest {
  newRole: 'student' | 'admin';
}

export interface DowngradePlanRequest {
  reason?: string;
}

export interface ChangePlanRequest {
  plan: 'free' | 'basic' | 'premium';
  expiryDays?: number;
}

export interface SendUserNotificationRequest {
  subject: string;
  message: string;
}

export interface PaginatedUserResponse {
  users: AdminUser[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

// ============== ANALYTICS TYPES ==============
export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  freeUsers: number;
  basicPlanUsers: number;
  premiumPlanUsers: number;
  averageExamScore: number;
  totalExamsCompleted: number;
  totalQuestionsAnswered: number;
  platformGrowthRate: number;
}

export interface UserMetrics {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  userRetentionRate: number;
  planDistribution: { free: number; basic: number; premium: number };
  roleDistribution: { student: number; admin: number };
  averageSessionDuration: number;
  bannedUsersCount: number;
}

export interface QuestionMetrics {
  totalQuestions: number;
  averageDifficulty: number;
  mostAnsweredQuestions: Array<{
    questionId: string;
    text: string;
    timesAnswered: number;
    correctAnswerPercentage: number;
  }>;
  leastAnsweredQuestions: Array<{
    questionId: string;
    text: string;
    timesAnswered: number;
    correctAnswerPercentage: number;
  }>;
  averageAnswerTime: number;
  questionsByDifficulty: { easy: number; medium: number; hard: number; veryhard: number };
}

export interface ExamMetrics {
  totalExamsCompleted: number;
  examsThisMonth: number;
  averageScore: number;
  passRate: number;
  averageTimeSpent: number;
  examsByStatus: { completed: number; in_progress: number; abandoned: number };
  topPerformingCourses: Array<{
    courseId: string;
    courseName: string;
    averageScore: number;
    completedCount: number;
  }>;
  averageQuestionsDifficulty: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  revenueByPlan: { basic: number; premium: number };
  promoCodeDiscountsApplied: number;
  pendingTransactions: number;
  failedTransactions: number;
  successfulTransactions: number;
  successRate: number;
  topPromoCodes: Array<{ code: string; usageCount: number; discountAmount: number }>;
}

export interface UniversityAnalytics {
  universityId: string;
  universityName: string;
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
  activeStudents: number;
  totalExamsCompleted: number;
  averageExamScore: number;
  passRate: number;
  revenueGenerated: number;
  topPerformingCourses: Array<{ courseId: string; courseName: string; averageScore: number }>;
  departmentBreakdown: Array<{ departmentName: string; studentCount: number; averageScore: number }>;
}

// ============== NOTIFICATION TYPES ==============
export interface SendBulkNotificationRequest {
  subject: string;
  template: string;
  variables?: Record<string, string>;
  filters?: {
    plan?: 'free' | 'basic' | 'premium';
    role?: 'student' | 'admin';
    universityId?: string;
    isActive?: boolean;
  };
}

export interface SendAnnouncementRequest {
  title: string;
  content: string;
}

export interface SendMaintenanceNotificationRequest {
  title: string;
  startTime: string;
  endTime: string;
  impact?: string;
}

export interface SendPlanExpiryReminderRequest {
  daysUntilExpiry?: number;
}

export interface NotificationResponse {
  recipientCount: number;
  messageId: string;
  timestamp: string;
}

// ============== UNIVERSITY TYPES ==============
export interface AdminUniversity {
  _id: string;
  code: string;
  name: string;
  abbreviation: string;
  state: string;
  departmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUniversityRequest {
  code: string;
  name: string;
  abbreviation: string;
  state: string;
}

export interface UpdateUniversityRequest {
  code?: string;
  name?: string;
  abbreviation?: string;
  state?: string;
}

// ============== DEPARTMENT TYPES ==============
export interface AdminDepartment {
  _id: string;
  code: string;
  name: string;
  description?: string;
  universityId: string;
  isActive: boolean;
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  code?: string;
  name?: string;
  description?: string;
}

// ============== COURSE TYPES ==============
export interface AdminCourse {
  _id: string;
  code: string;
  title: string;
  level: number;
  creditUnits: number;
  description?: string;
  departmentId: string;
  universityId: string;
  isActive: boolean;
  questionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseRequest {
  code: string;
  title: string;
  level: number;
  creditUnits: number;
  description?: string;
}

export interface UpdateCourseRequest {
  code?: string;
  title?: string;
  level?: number;
  creditUnits?: number;
  description?: string;
}

// ============== QUESTION TYPES ==============
export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface AdminQuestion {
  _id: string;
  text: string;
  questionType: 'mcq' | 'essay' | 'short-answer';
  difficulty: 'easy' | 'medium' | 'hard';
  topicId: string;
  courseId: string;
  universityId: string;
  departmentId: string;
  options?: QuestionOption[];
  explanation?: string;
  correctAnswer?: string;
  status: 'pending' | 'approved' | 'rejected';
  source: 'Human' | 'AI';
  accessLevel: 'free' | 'basic' | 'premium';
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionRequest {
  text: string;
  questionType: 'mcq' | 'essay' | 'short-answer';
  difficulty: 'easy' | 'medium' | 'hard';
  topicId: string;
  explanation?: string;
  accessLevel?: 'free' | 'basic' | 'premium';
  options?: QuestionOption[];
  correctAnswer?: string;
}

export interface UpdateQuestionRequest {
  text?: string;
  questionType?: 'mcq' | 'essay' | 'short-answer';
  difficulty?: 'easy' | 'medium' | 'hard';
  topicId?: string;
  explanation?: string;
  accessLevel?: 'free' | 'basic' | 'premium';
  options?: QuestionOption[];
  correctAnswer?: string;
}

export interface ApproveQuestionRequest {
  adminId: string;
  notes?: string;
}

export interface RejectQuestionRequest {
  adminId: string;
  notes?: string;
}

// ============== MATERIAL TYPES ==============
export interface AdminSourceMaterial {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  topicId?: string;
  fileUrl: string;
  fileSize: number;
  processingStatus: 'uploaded' | 'processing' | 'completed' | 'failed';
  extractionMethod: 'ocr' | 'ai';
  uploadedBy: string;
  extractedQuestions: Array<{ _id: string; text: string; status: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStudyMaterial {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  topicId?: string;
  fileUrl: string;
  fileSize: number;
  accessLevel: 'free' | 'premium';
  uploaderType: 'admin' | 'faculty';
  uploadedBy: string;
  views: number;
  downloads: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialRequest {
  title: string;
  description?: string;
  topicId?: string;
  extractionMethod?: 'ocr' | 'ai';
}

export interface GenerateQuestionsRequest {
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

export interface ImportQuestionsRequest {
  questions: CreateQuestionRequest[];
}

export interface CreateStudyMaterialRequest {
  title: string;
  description?: string;
  topicId?: string;
  accessLevel?: 'free' | 'premium';
}

export interface MaterialsListResponse {
  success: boolean;
  data: AdminSourceMaterial[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface GenerateQuestionsResponse {
  success: boolean;
  data: {
    log: {
      _id: string;
      materialId: string;
      mode: 'ocr' | 'ai';
      extractedText: string;
      generatedQuestionsCount: number;
      processedAt: string;
    };
    mode: 'ocr' | 'ai';
    questionsCount: number;
    questionIds: string[];
  };
  message: string;
}

export interface PendingQuestionsResponse {
  success: boolean;
  data: AdminQuestion[];
  count: number;
}

// ============== ADMIN SERVICE ==============
export const adminService = {
  // ============== PRICING ENDPOINTS ==============
  async getAllPlans(): Promise<AdminPlan[]> {
    const response = await apiClient.get<ApiResponse<AdminPlan[]>>('/api/admin/pricing');
    const payload: any = response.data?.data;
    const plansRaw =
      (Array.isArray(payload) ? payload : null) ??
      payload?.plans ??
      payload?.data ??
      payload?.items ??
      [];
    return toArray<any>(plansRaw).map(normalizeAdminPlan);
  },

  async createOrUpdatePlan(planType: 'basic' | 'premium', data: CreateOrUpdatePlanRequest): Promise<AdminPlan> {
    const response = await apiClient.put<ApiResponse<AdminPlan>>(
      `/api/admin/pricing/${planType}`,
      data
    );
    return response.data.data;
  },

  async getPlanPriceHistory(planType: 'basic' | 'premium'): Promise<PriceHistory[]> {
    const response = await apiClient.get<ApiResponse<{ currentPrice: number; history: PriceHistory[] }>>(
      `/api/admin/pricing/${planType}/history`
    );
    const payload: any = response.data?.data;
    return normalizePriceHistory(
      payload?.history ??
      payload?.priceHistory ??
      payload?.pricingHistory ??
      payload?.changes ??
      payload?.entries ??
      payload?.plan?.priceHistory ??
      payload?.data ??
      payload
    );
  },

  async getPricingAnalytics(): Promise<PricingAnalytics> {
    const response = await apiClient.get<ApiResponse<PricingAnalytics>>('/api/admin/pricing/analytics');
    return response.data.data;
  },

  // ============== PROMO CODE ENDPOINTS ==============
  async createPromoCode(data: CreatePromoCodeRequest): Promise<AdminPromoCode> {
    const response = await apiClient.post<ApiResponse<AdminPromoCode>>('/api/admin/promo-codes', data);
    return response.data.data;
  },

  async getPromoCodes(page = 1, limit = 20, isActive?: boolean): Promise<PaginatedPromoResponse> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (isActive !== undefined) params.append('isActive', isActive.toString());
    const response = await apiClient.get<ApiResponse<PaginatedPromoResponse>>(
      `/api/admin/promo-codes?${params}`
    );
    const payload: any = response.data?.data;
    const listRaw = payload?.data ?? payload?.promoCodes ?? payload?.codes ?? payload?.items ?? [];
    const paginationRaw = payload?.pagination ?? {};

    return {
      data: toArray<any>(listRaw).map(normalizePromoCode),
      pagination: {
        total: Number(paginationRaw.total ?? payload?.total ?? 0) || 0,
        page: Number(paginationRaw.page ?? payload?.page ?? page) || page,
        limit: Number(paginationRaw.limit ?? payload?.limit ?? limit) || limit,
        pages: Number(paginationRaw.pages ?? paginationRaw.totalPages ?? payload?.pages ?? payload?.totalPages ?? 1) || 1,
      },
    };
  },

  async updatePromoCode(code: string, data: UpdatePromoCodeRequest): Promise<AdminPromoCode> {
    const response = await apiClient.put<ApiResponse<AdminPromoCode>>(`/api/admin/promo-codes/${code}`, data);
    return response.data.data;
  },

  async deletePromoCode(code: string): Promise<void> {
    await apiClient.delete(`/api/admin/promo-codes/${code}`);
  },

  async getPromoCodeStats(code: string): Promise<AdminPromoCodeStats> {
    const response = await apiClient.get<ApiResponse<AdminPromoCodeStats>>(`/api/admin/promo-codes/${code}/stats`);
    const payload: any = response.data?.data ?? {};
    const statsPayload: any = payload?.stats ?? payload;
    const usagesRaw =
      payload?.usages ??
      payload?.usageHistory ??
      payload?.history ??
      statsPayload?.usages ??
      statsPayload?.usageHistory ??
      statsPayload?.history ??
      [];

    return {
      ...statsPayload,
      code: statsPayload?.code || code,
      description: statsPayload?.description || '',
      usageCount: Number(statsPayload?.usageCount ?? statsPayload?.totalUsage ?? 0) || 0,
      maxUsageCount: statsPayload?.maxUsageCount ?? null,
      totalDiscountGiven: Number(statsPayload?.totalDiscountGiven ?? statsPayload?.discountTotal ?? 0) || 0,
      totalRevenue: Number(statsPayload?.totalRevenue ?? statsPayload?.revenueTotal ?? 0) || 0,
      isActive: Boolean(statsPayload?.isActive),
      validFrom: statsPayload?.validFrom || '',
      validUntil: statsPayload?.validUntil || '',
      usages: toArray<any>(usagesRaw).map((usage, index) => ({
        ...usage,
        _id: usage?._id || usage?.id || usage?.transactionId || usage?.reference || `${code}-${index}`,
        userId: usage?.userId ?? usage?.user ?? usage?.usedBy ?? null,
        transactionId: usage?.transactionId ?? usage?.transaction?._id ?? usage?.reference ?? '',
        usedAt: usage?.usedAt ?? usage?.createdAt ?? usage?.date ?? new Date().toISOString(),
        amount: Number(usage?.amount ?? usage?.originalAmount ?? usage?.transactionAmount ?? 0) || 0,
        discountApplied: Number(usage?.discountApplied ?? usage?.discountAmount ?? usage?.discount ?? 0) || 0,
      })),
    };
  },

  // ============== USER MANAGEMENT ENDPOINTS ==============
  async getUsers(page = 1, limit = 20, filters?: { plan?: string; role?: string; isActive?: boolean; search?: string }): Promise<PaginatedUserResponse> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filters?.plan) params.append('plan', filters.plan);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.search) params.append('search', filters.search);
    const response = await apiClient.get<ApiResponse<PaginatedUserResponse>>(`/api/admin/users?${params}`);
    return response.data.data;
  },

  async getUserDetails(userId: string): Promise<AdminUserDetails> {
    const response = await apiClient.get<ApiResponse<AdminUserDetails>>(`/api/admin/users/${userId}`);
    return response.data.data;
  },

  async banUser(userId: string, data: BanUserRequest): Promise<AdminUserDetails> {
    const response = await apiClient.post<ApiResponse<AdminUserDetails>>(`/api/admin/users/${userId}/ban`, data);
    return response.data.data;
  },

  async unbanUser(userId: string): Promise<AdminUserDetails> {
    const response = await apiClient.post<ApiResponse<AdminUserDetails>>(`/api/admin/users/${userId}/unban`);
    return response.data.data;
  },

  async changeUserRole(userId: string, data: ChangeUserRoleRequest): Promise<AdminUserDetails> {
    const response = await apiClient.post<ApiResponse<AdminUserDetails>>(`/api/admin/users/${userId}/role`, data);
    return response.data.data;
  },

  async downgradeUserPlan(userId: string, data?: DowngradePlanRequest): Promise<AdminUserDetails> {
    const response = await apiClient.post<ApiResponse<AdminUserDetails>>(`/api/admin/users/${userId}/downgrade-plan`, data);
    return response.data.data;
  },

  async changePlan(userId: string, data: ChangePlanRequest): Promise<AdminUserDetails> {
    const response = await apiClient.post<ApiResponse<AdminUserDetails>>(`/api/admin/users/${userId}/change-plan`, data);
    return response.data.data;
  },

  async sendUserNotification(userId: string, data: SendUserNotificationRequest): Promise<{ sent: boolean }> {
    const response = await apiClient.post<ApiResponse<{ sent: boolean }>>(`/api/admin/users/${userId}/send-notification`, data);
    return response.data.data;
  },

  // ============== ANALYTICS ENDPOINTS ==============
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const response = await apiClient.get<ApiResponse<AnalyticsOverview>>('/api/admin/analytics/overview');
    const payload = unwrapPayload<any>(response.data) ?? {};
    return normalizeAnalyticsOverview(payload);
  },

  async getUserMetrics(): Promise<UserMetrics> {
    const response = await apiClient.get<ApiResponse<UserMetrics>>('/api/admin/analytics/users');
    const payload = unwrapPayload<any>(response.data) ?? {};
    return normalizeUserMetrics(payload);
  },

  async getQuestionMetrics(): Promise<QuestionMetrics> {
    const response = await apiClient.get<ApiResponse<QuestionMetrics>>('/api/admin/analytics/questions');
    const payload = unwrapPayload<any>(response.data) ?? {};
    return normalizeQuestionMetrics(payload);
  },

  async getExamMetrics(): Promise<ExamMetrics> {
    const response = await apiClient.get<ApiResponse<ExamMetrics>>('/api/admin/analytics/exams');
    const payload = unwrapPayload<any>(response.data) ?? {};
    return normalizeExamMetrics(payload);
  },

  async getRevenueMetrics(): Promise<RevenueMetrics> {
    const response = await apiClient.get<ApiResponse<RevenueMetrics>>('/api/admin/analytics/revenue');
    const payload = unwrapPayload<any>(response.data) ?? {};
    return normalizeRevenueMetrics(payload);
  },

  async getUniversityAnalytics(universityId: string): Promise<UniversityAnalytics> {
    const response = await apiClient.get<ApiResponse<UniversityAnalytics>>(`/api/admin/analytics/university/${universityId}`);
    const payload = unwrapPayload<any>(response.data) ?? {};
    return normalizeUniversityAnalytics(payload, universityId);
  },

  async exportAnalytics(format: 'json' | 'csv' = 'json'): Promise<string> {
    const response = await apiClient.get(`/api/admin/analytics/export?format=${format}`);
    return response.data;
  },

  async generateReport(type: 'performance' | 'users' | 'revenue' | 'questions' | 'overview'): Promise<Record<string, any>> {
    const response = await apiClient.get<ApiResponse<Record<string, any>>>(`/api/admin/analytics/report/${type}`);
    return response.data.data;
  },

  // ============== NOTIFICATION ENDPOINTS ==============
  async sendBulkNotification(data: SendBulkNotificationRequest): Promise<NotificationResponse> {
    const response = await apiClient.post<ApiResponse<NotificationResponse>>('/api/admin/analytics/notifications/send-bulk', data);
    return response.data.data;
  },

  async sendAnnouncement(data: SendAnnouncementRequest): Promise<NotificationResponse> {
    const response = await apiClient.post<ApiResponse<NotificationResponse>>('/api/admin/analytics/notifications/announcement', data);
    return response.data.data;
  },

  async sendMaintenanceNotification(data: SendMaintenanceNotificationRequest): Promise<NotificationResponse> {
    const response = await apiClient.post<ApiResponse<NotificationResponse>>('/api/admin/analytics/notifications/maintenance', data);
    return response.data.data;
  },

  async sendPlanExpiryReminder(data?: SendPlanExpiryReminderRequest): Promise<NotificationResponse> {
    const response = await apiClient.post<ApiResponse<NotificationResponse>>('/api/admin/analytics/notifications/plan-expiry-reminder', data);
    return response.data.data;
  },

  // ============== UNIVERSITY ENDPOINTS ==============
  async getUniversities(): Promise<AdminUniversity[]> {
    const response = await apiClient.get<ApiResponse<AdminUniversity[]>>('/api/universities');
    return response.data.data;
  },

  async createUniversity(data: CreateUniversityRequest): Promise<AdminUniversity> {
    const response = await apiClient.post<ApiResponse<AdminUniversity>>('/api/universities', data);
    return response.data.data;
  },

  async updateUniversity(id: string, data: UpdateUniversityRequest): Promise<AdminUniversity> {
    const response = await apiClient.put<ApiResponse<AdminUniversity>>(`/api/universities/${id}`, data);
    return response.data.data;
  },

  async deleteUniversity(id: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete<ApiResponse<{ _id: string }>>(`/api/universities/${id}`);
    return { success: response.data.success, message: response.data.message };
  },

  // ============== DEPARTMENT ENDPOINTS ==============
  async createDepartment(universityId: string, data: CreateDepartmentRequest): Promise<AdminDepartment> {
    const response = await apiClient.post<ApiResponse<AdminDepartment>>(`/api/universities/${universityId}/departments`, data);
    return response.data.data;
  },

  async updateDepartment(universityId: string, id: string, data: UpdateDepartmentRequest): Promise<AdminDepartment> {
    const response = await apiClient.put<ApiResponse<AdminDepartment>>(`/api/universities/${universityId}/departments/${id}`, data);
    return response.data.data;
  },

  // ============== COURSE ENDPOINTS ==============
  async createCourse(departmentId: string, data: CreateCourseRequest): Promise<AdminCourse> {
    const response = await apiClient.post<ApiResponse<AdminCourse>>(`/api/departments/${departmentId}/courses`, data);
    return response.data.data;
  },

  async updateCourse(departmentId: string, id: string, data: UpdateCourseRequest): Promise<AdminCourse> {
    const response = await apiClient.put<ApiResponse<AdminCourse>>(`/api/departments/${departmentId}/courses/${id}`, data);
    return response.data.data;
  },

  // ============== QUESTION ENDPOINTS ==============
  async createQuestion(courseId: string, data: CreateQuestionRequest): Promise<AdminQuestion> {
    const response = await apiClient.post<ApiResponse<AdminQuestion>>(`/api/courses/${courseId}/questions`, data);
    return response.data.data;
  },

  async getPendingQuestions(courseId: string, universityId: string): Promise<PendingQuestionsResponse> {
    const response = await apiClient.get<PendingQuestionsResponse>(`/api/courses/${courseId}/questions/pending/${universityId}`);
    return response.data;
  },

  async approveQuestion(courseId: string, questionId: string, data: ApproveQuestionRequest): Promise<AdminQuestion> {
    const response = await apiClient.post<ApiResponse<AdminQuestion>>(`/api/courses/${courseId}/questions/approve/${questionId}`, data);
    return response.data.data;
  },

  async rejectQuestion(courseId: string, questionId: string, data: RejectQuestionRequest): Promise<AdminQuestion> {
    const response = await apiClient.post<ApiResponse<AdminQuestion>>(`/api/courses/${courseId}/questions/reject/${questionId}`, data);
    return response.data.data;
  },

  async deleteQuestion(courseId: string, questionId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete<ApiResponse<{ _id: string; text: string }>>(`/api/courses/${courseId}/questions/${questionId}`);
    return { success: response.data.success, message: response.data.message };
  },

  async updateQuestion(courseId: string, questionId: string, data: UpdateQuestionRequest): Promise<AdminQuestion> {
    const response = await apiClient.put<ApiResponse<AdminQuestion>>(`/api/courses/${courseId}/questions/${questionId}`, data);
    return response.data.data;
  },

  // ============== MATERIAL ENDPOINTS ==============
  async uploadSourceMaterial(courseId: string, formData: FormData): Promise<AdminSourceMaterial> {
    const response = await apiClient.post<ApiResponse<AdminSourceMaterial>>(`/api/courses/${courseId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  async generateQuestionsFromMaterial(courseId: string, materialId: string, data: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> {
    const response = await apiClient.post<GenerateQuestionsResponse>(`/api/courses/${courseId}/materials/${materialId}/generate-questions`, data);
    return response.data;
  },

  async importQuestionsFromMaterial(courseId: string, materialId: string, data: ImportQuestionsRequest): Promise<{ success: boolean; data: { questionsCount: number; questionIds: string[] }; message: string }> {
    const response = await apiClient.post(`/api/courses/${courseId}/materials/${materialId}/import-questions`, data);
    return response.data;
  },

  async getMaterials(courseId: string, status?: string, page = 1, limit = 20): Promise<MaterialsListResponse> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await apiClient.get<MaterialsListResponse>(`/api/courses/${courseId}/materials?${params}`);
    return response.data;
  },

  async getMaterialDetails(courseId: string, materialId: string): Promise<AdminSourceMaterial> {
    const response = await apiClient.get<ApiResponse<AdminSourceMaterial>>(`/api/courses/${courseId}/materials/${materialId}`);
    return response.data.data;
  },

  // ============== STUDY MATERIAL ENDPOINTS ==============
  async uploadStudyMaterial(courseId: string, formData: FormData): Promise<AdminStudyMaterial> {
    const response = await apiClient.post<ApiResponse<AdminStudyMaterial>>(`/api/study-materials/${courseId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },
};
