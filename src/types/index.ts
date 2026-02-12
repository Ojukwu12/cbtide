// ==================== AUTH & USER ====================
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'admin';
  plan: 'free' | 'basic' | 'premium';
  planExpiry?: string;
  lastSelectedUniversityId?: string;
  lastSelectedDepartmentId?: string;
  lastSelectedCourseId?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

// ==================== ACADEMIC STRUCTURE ====================
export interface University {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Faculty {
  id: string;
  name: string;
  universityId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  facultyId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  courseCode: string;
  departmentId: string;
  description?: string;
  credits?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  name: string;
  courseId: string;
  description?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== QUESTIONS ====================
export interface Question {
  id: string;
  topicId: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  approved: boolean;
  rejectionReason?: string;
  sourceType: 'manual' | 'generated' | 'extracted';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionStats {
  topicId: string;
  totalQuestions: number;
  approvedQuestions: number;
  pendingQuestions: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

// ==================== MATERIALS ====================
export interface Material {
  id: string;
  courseId: string;
  topicId?: string;
  title: string;
  fileType: 'pdf' | 'video' | 'audio' | 'document' | 'link';
  fileUrl?: string;
  content?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialUploadRequest {
  file?: File;
  title: string;
  fileType: 'pdf' | 'video' | 'audio' | 'document' | 'link';
  topicId?: string;
  fileUrl?: string;
  content?: string;
}

export interface GenerateQuestionsResponse {
  questionsGenerated: number;
  questions: Question[];
  missingAnswers?: boolean;
  extractedQuestions?: any[];
}

// ==================== EXAMS ====================
export interface ExamSession {
  id: string;
  userId: string;
  universityId: string;
  departmentId: string;
  courseId: string;
  topicId?: string;
  examType: 'practice' | 'mock' | 'final';
  numberOfQuestions: number;
  duration: number; // in minutes
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'abandoned';
  score?: number;
  percentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: string;
  questionId: string;
  question: string;
  options: QuestionOption[];
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface ExamSummary {
  examSession: ExamSession;
  questions: ExamQuestion[];
  timeRemaining: number;
  answeredCount: number;
  totalQuestions: number;
}

export interface StartExamRequest {
  universityId: string;
  departmentId: string;
  courseId: string;
  examType: 'practice' | 'mock' | 'final';
  topicIds?: string[];
  totalQuestions: number;
  durationMinutes: number;
}

export interface AnswerQuestionRequest {
  questionId: string;
  answer: string;
}

export interface ExamResult {
  examSession: ExamSession;
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  timeTaken: number;
  questions: ExamQuestion[];
  topic: Topic;
  course: Course;
}

export interface ExamHistory {
  examSessions: ExamSession[];
  total: number;
  page: number;
  limit: number;
}

// ==================== STUDY PLANS ====================
export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  topicIds: string[];
  startDate: string;
  endDate: string;
  dailyGoal: number; // questions per day
  status: 'active' | 'completed' | 'paused';
  progress: number; // percentage
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudyPlanRequest {
  title: string;
  description?: string;
  topicIds: string[];
  startDate: string;
  endDate: string;
  dailyGoal: number;
}

export interface UpdateStudyPlanRequest {
  title?: string;
  description?: string;
  topicIds?: string[];
  startDate?: string;
  endDate?: string;
  dailyGoal?: number;
  status?: 'active' | 'completed' | 'paused';
}

// ==================== LEADERBOARD ====================
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  universityId: string;
  universityName: string;
  totalScore: number;
  averageScore: number;
  examsTaken: number;
  accuracy: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userPosition?: LeaderboardEntry;
  total: number;
}

// ==================== ANALYTICS ====================
export interface DashboardAnalytics {
  examsTaken: number;
  averageScore: number;
  accuracy: number;
  totalTimeSpent: number; // in minutes
  recentExams: ExamSession[];
  strongAreas: TopicPerformance[];
  weakAreas: TopicPerformance[];
  rank?: number;
  improvement: {
    examsTaken: number;
    averageScore: number;
    accuracy: number;
  };
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  examsTaken: number;
  averageScore: number;
  accuracy: number;
  lastAttempt?: string;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  topics: TopicPerformance[];
  overallScore: number;
  overallAccuracy: number;
  examsTaken: number;
}

export interface TrendData {
  date: string;
  score: number;
  examsTaken: number;
  accuracy: number;
}

export interface MonthlyAnalytics {
  month: string;
  examsTaken: number;
  averageScore: number;
  accuracy: number;
  hoursStudied: number;
}

export interface Recommendation {
  topicId: string;
  topicName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// ==================== ADMIN ANALYTICS ====================
export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  totalExams: number;
  totalQuestions: number;
  pendingQuestions: number;
  approvedQuestions: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowth: TrendData[];
  planDistribution: {
    free: number;
    basic: number;
    premium: number;
  };
}

export interface PerformanceAnalytics {
  averageScore: number;
  averageAccuracy: number;
  totalExamsTaken: number;
  topPerformers: LeaderboardEntry[];
  scoreDistribution: {
    range: string;
    count: number;
  }[];
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: TrendData[];
  revenueByPlan: {
    basic: number;
    premium: number;
  };
  recentTransactions: Transaction[];
}

export interface QuestionAnalytics {
  totalQuestions: number;
  approvedQuestions: number;
  pendingQuestions: number;
  questionsByTopic: {
    topicName: string;
    count: number;
  }[];
  questionsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface ExamAnalytics {
  totalExams: number;
  completedExams: number;
  abandonedExams: number;
  examsByTopic: {
    topicName: string;
    count: number;
  }[];
  examActivity: TrendData[];
}

// ==================== PAYMENTS ====================
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  plan: 'basic' | 'premium';
  duration: number; // months
  status: 'pending' | 'success' | 'failed';
  reference: string;
  paymentGateway: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitiatePaymentRequest {
  plan: 'basic' | 'premium';
  duration: number;
}

export interface InitiatePaymentResponse {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

export interface VerifyPaymentRequest {
  reference: string;
}

// ==================== SEARCH ====================
export interface SearchQuestionsRequest {
  query: string;
  topicId?: string;
  courseId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  limit?: number;
}

export interface SearchQuestionsResponse {
  questions: Question[];
  total: number;
}

// ==================== API RESPONSE ====================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
