import { createBrowserRouter } from 'react-router';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { EmailVerified } from './pages/EmailVerified';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Universities } from './pages/Universities';
import { Departments } from './pages/Departments';
import { Courses } from './pages/Courses';
import { Topics } from './pages/Topics';
import { StartExam } from './pages/StartExam';
import { ExamInProgress } from './pages/ExamInProgress';
import { ExamResults } from './pages/ExamResults';
import { ExamHistory } from './pages/ExamHistory';
import { Analytics } from './pages/Analytics';
import { Leaderboard } from './pages/Leaderboard';
import { StudyMaterials } from './pages/StudyMaterials';
import { StudyPlans } from './pages/StudyPlans';
import { SearchQuestions } from './pages/SearchQuestions';
import { AdvancedSearch } from './pages/AdvancedSearch';
import { UserProfile } from './pages/UserProfile';
import { Payments } from './pages/Payments';
import { Plans } from './pages/Plans';
import { PaymentCallback } from './pages/PaymentCallback';
import { About } from './pages/About';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { QuestionBank } from './pages/admin/QuestionBank';
import { MaterialManagement } from './pages/admin/MaterialManagement';
import { PricingManagement } from './pages/admin/PricingManagement';
import { PromoCodeManagement } from './pages/admin/PromoCodeManagement';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { UniversityManagement } from './pages/admin/UniversityManagement';
import { DepartmentManagement } from './pages/admin/DepartmentManagement';
import { CourseManagement } from './pages/admin/CourseManagement';
import { TopicManagement } from './pages/admin/TopicManagement';
import { QuestionManagement } from './pages/admin/QuestionManagement';
import { StudyMaterialsManagement } from './pages/admin/StudyMaterialsManagement';
import { NotFound } from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
    ErrorBoundary: ErrorBoundary,
  },
  {
    path: '/about',
    Component: About,
    ErrorBoundary: ErrorBoundary,
  },
  {
    path: '/faq',
    Component: FAQ,
    ErrorBoundary: ErrorBoundary,
  },
  {
    path: '/contact',
    Component: Contact,
    ErrorBoundary: ErrorBoundary,
  },
  {
    Component: GuestRoute,
    ErrorBoundary: ErrorBoundary,
    children: [
      {
        path: '/login',
        Component: Login,
      },
      {
        path: '/register',
        Component: Register,
      },
      {
        path: '/forgot-password',
        Component: ForgotPassword,
      },
    ],
  },
  {
    path: '/verify-email',
    Component: VerifyEmail,
    ErrorBoundary: ErrorBoundary,
  },
  {
    path: '/email-verified',
    Component: EmailVerified,
    ErrorBoundary: ErrorBoundary,
  },
  {
    path: '/reset-password',
    Component: ResetPassword,
    ErrorBoundary: ErrorBoundary,
  },
  {
    Component: ProtectedRoute,
    ErrorBoundary: ErrorBoundary,
    children: [
      {
        path: '/dashboard',
        Component: Dashboard,
      },
      {
        path: '/universities',
        Component: Universities,
      },
      {
        path: '/universities/:universityId',
        Component: Departments,
      },
      {
        path: '/departments/:departmentId',
        Component: Courses,
      },
      {
        path: '/courses/:courseId',
        Component: Topics,
      },
      {
        path: '/exams',
        Component: ExamHistory,
      },
      {
        path: '/exams/start',
        Component: StartExam,
      },
      {
        path: '/exams/:examSessionId/in-progress',
        Component: ExamInProgress,
      },
      {
        path: '/exams/:examSessionId/results',
        Component: ExamResults,
      },
      {
        path: '/analytics',
        Component: Analytics,
      },
      {
        path: '/leaderboard',
        Component: Leaderboard,
      },
      {
        path: '/materials',
        Component: StudyMaterials,
      },
      {
        path: '/materials/:courseId',
        Component: StudyMaterials,
      },
      {
        path: '/study-plans',
        Component: StudyPlans,
      },
      {
        path: '/search',
        Component: SearchQuestions,
      },
      {
        path: '/search/advanced',
        Component: AdvancedSearch,
      },
      {
        path: '/users/:id',
        Component: UserProfile,
      },
      {
        path: '/payments',
        Component: Payments,
      },
      {
        path: '/plans',
        Component: Plans,
      },
      {
        path: '/payment-callback',
        Component: PaymentCallback,
      },
    ],
  },
  {
    Component: AdminRoute,
    ErrorBoundary: ErrorBoundary,
    children: [
      {
        path: '/admin',
        Component: AdminDashboard,
      },
      {
        path: '/admin/users',
        Component: UserManagement,
      },
      {
        path: '/admin/pricing',
        Component: PricingManagement,
      },
      {
        path: '/admin/promos',
        Component: PromoCodeManagement,
      },
      {
        path: '/admin/questions',
        Component: QuestionBank,
      },
      {
        path: '/admin/materials',
        Component: StudyMaterialsManagement,
      },
      {
        path: '/admin/source-materials',
        Component: MaterialManagement,
      },
      {
        path: '/admin/analytics',
        Component: AdminAnalytics,
      },
      {
        path: '/admin/notifications',
        Component: AdminNotifications,
      },
      {
        path: '/admin/universities',
        Component: UniversityManagement,
      },
      {
        path: '/admin/departments',
        Component: DepartmentManagement,
      },
      {
        path: '/admin/courses',
        Component: CourseManagement,
      },
      {
        path: '/admin/topics',
        Component: TopicManagement,
      },
      {
        path: '/admin/questions-mgmt',
        Component: QuestionManagement,
      },
      {
        path: '/admin/study-materials',
        Component: StudyMaterialsManagement,
      },
    ],
  },
  {
    path: '*',
    Component: NotFound,
    ErrorBoundary: ErrorBoundary,
  },
]);