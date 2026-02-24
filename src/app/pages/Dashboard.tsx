import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { 
  FileText, 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  BookOpen,
  ArrowRight,
  Activity,
  Loader
} from 'lucide-react';
import { analyticsService } from '../../lib/services';
import { useAuth } from '../context/AuthContext';

// Safe score formatter - handles null, undefined, and NaN
const safeFormatScore = (score: any): string => {
  if (score === null || score === undefined) return '0.0';
  const num = Number(score);
  if (isNaN(num)) return '0.0';
  return num.toFixed(1);
};

// Safe integer formatter - handles null, undefined, and NaN
const safeFormatInt = (num: any): string => {
  if (num === null || num === undefined) return '0';
  const n = Number(num);
  if (isNaN(n)) return '0';
  return Math.round(n).toString();
};

export function Dashboard() {
  const { user } = useAuth();
  
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => analyticsService.getDashboard(),
  });

  if (analyticsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  const toNumber = (val: any, fallback = 0): number => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  const stats = {
    examsTaken: toNumber(analytics?.examsTaken, 0),
    averageScore: toNumber(analytics?.averageScore, 0),
    accuracy: toNumber(analytics?.accuracy, 0),
    totalTimeSpentSeconds: toNumber(analytics?.totalTimeSpent, 0),
  };

  const formatTimeSpent = (totalSeconds: number): string => {
    const totalMinutes = Math.floor(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return mins > 0 ? `${mins}m` : '0m';
  };

  const hasValidExams = stats.examsTaken > 0;
  const hasValidScore = stats.averageScore > 0 && stats.averageScore <= 100;
  const hasValidAccuracy = stats.accuracy > 0 && stats.accuracy <= 100;

  const recentExams = analytics?.recentExams || [];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, {user?.firstName}! 👋</h1>
          <p className="text-gray-600">Here's your academic performance overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              {analytics?.improvement?.examsTaken !== undefined && analytics.improvement?.examsTaken > 0 && (
                <span className="text-sm text-green-600 font-medium">+{analytics.improvement?.examsTaken} this week</span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.examsTaken}</h3>
            <p className="text-sm text-gray-600">Exams Taken</p>
          </div>

          {hasValidScore && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              {analytics?.improvement?.averageScore !== undefined && analytics.improvement?.averageScore > 0 && (
                <span className="text-sm text-green-600 font-medium">+{safeFormatScore(analytics.improvement?.averageScore)}%</span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{safeFormatScore(stats.averageScore)}%</h3>
            <p className="text-sm text-gray-600">Average Score</p>
          </div>
          )}

          {hasValidAccuracy && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              {analytics?.improvement?.accuracy !== undefined && analytics.improvement?.accuracy > 0 && (
                <span className="text-sm text-green-600 font-medium">+{safeFormatScore(analytics.improvement?.accuracy)}%</span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{safeFormatScore(stats.accuracy)}%</h3>
            <p className="text-sm text-gray-600">Accuracy Rate</p>
          </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatTimeSpent(stats.totalTimeSpentSeconds)}</h3>
            <p className="text-sm text-gray-600">Total Exam Time</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to Practice?</h2>
          <p className="text-green-100 mb-6">
            Start a new exam or continue where you left off
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/exams/start"
              className="bg-white text-green-700 rounded-xl p-4 hover:bg-green-50 transition-colors group"
            >
              <FileText className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-1">Start New Exam</h3>
              <p className="text-sm text-gray-600 mb-2">Practice with AI questions</p>
              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                Start now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/materials"
              className="bg-white/10 border-2 border-white/20 text-white rounded-xl p-4 hover:bg-white/20 transition-colors group"
            >
              <BookOpen className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-1">Study Materials</h3>
              <p className="text-sm text-green-100 mb-2">Access course resources</p>
              <div className="flex items-center gap-1 text-sm font-medium">
                Browse
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/analytics"
              className="bg-white/10 border-2 border-white/20 text-white rounded-xl p-4 hover:bg-white/20 transition-colors group"
            >
              <Activity className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-1">View Analytics</h3>
              <p className="text-sm text-green-100 mb-2">Track your progress</p>
              <div className="flex items-center gap-1 text-sm font-medium">
                View stats
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Exams */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Exams</h2>
            <Link to="/exams" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentExams.slice(0, 4).map((exam) => {
              const passed = (exam.percentage || 0) >= 50;
              return (
                <div key={exam._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      passed ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {passed ? (
                        <Award className="w-6 h-6 text-green-600" />
                      ) : (
                        <FileText className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Exam #{exam._id.slice(0, 8)}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(exam.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                      {safeFormatInt(exam.percentage)}%
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <Link
                    to={`/exams/${exam._id}/results`}
                    className="text-green-600 hover:text-green-700"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              );
            })}
            {recentExams.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No exams yet. Start your first exam!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
