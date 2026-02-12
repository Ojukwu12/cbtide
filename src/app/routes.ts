import { createBrowserRouter } from 'react-router';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Universities } from './pages/Universities';
import { Faculties } from './pages/Faculties';
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
import { Payments } from './pages/Payments';
import { Plans } from './pages/Plans';
import { About } from './pages/About';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { QuestionBank } from './pages/admin/QuestionBank';
import { MaterialManagement } from './pages/admin/MaterialManagement';
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
        Component: Faculties,
      },
      {
        path: '/faculties/:facultyId',
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
        path: '/payments',
        Component: Payments,
      },
      {
        path: '/plans',
        Component: Plans,
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
        path: '/admin/questions',
        Component: QuestionBank,
      },
      {
        path: '/admin/materials',
        Component: MaterialManagement,
      },
    ],
  },
  {
    path: '*',
    Component: NotFound,
    ErrorBoundary: ErrorBoundary,
  },
]);