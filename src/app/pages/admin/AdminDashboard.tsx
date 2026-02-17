import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { PendingQuestionsPanel } from '../../components/admin/PendingQuestionsPanel';
import { adminService, AnalyticsOverview } from '../../../lib/services/admin.service';
import { Users, FileText, TrendingUp, DollarSign, Activity, AlertCircle, BarChart3, Loader, Ticket, BarChart2, Mail, BookOpen, Landmark, Building2, HelpCircle, FileStack } from 'lucide-react';
import toast from 'react-hot-toast';

// Safe formatter for numeric scores
const safeFormatScore = (score: any): string => {
  if (score === null || score === undefined || isNaN(score)) return '0.0';
  const num = Number(score);
  return isNaN(num) ? '0.0' : num.toFixed(1);
};

// Safe formatter for decimals (currency, etc)
const safeFormatDecimal = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined) return '0'.padEnd(decimals + 2, '0');
  const num = Number(value);
  if (isNaN(num)) return '0'.padEnd(decimals + 2, '0');
  return num.toFixed(decimals);
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const overview = await adminService.getAnalyticsOverview();
      setStats(overview);
    } catch (err) {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor platform performance and manage operations</p>
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{(stats?.totalUsers || 0).toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-xs text-gray-500 mt-2">{stats.activeUsers} active this month</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{(stats?.totalExamsCompleted || 0).toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Total Exams</p>
                <p className="text-xs text-gray-500 mt-2">Average: {safeFormatScore(stats?.averageExamScore)}% score</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">₦{safeFormatDecimal((stats?.monthlyRevenue || 0) / 1000000)}M</h3>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-xs text-gray-500 mt-2">Total: ₦{safeFormatDecimal((stats?.totalRevenue || 0) / 1000000)}M</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{safeFormatScore(stats?.platformGrowthRate)}%</h3>
                <p className="text-sm text-gray-600">Growth Rate</p>
                <p className="text-xs text-gray-500 mt-2">Monthly platform growth</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm text-gray-600 mb-3">Plan Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">Free Users</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.freeUsers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${(stats.freeUsers / stats.totalUsers) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">Basic Users</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.basicPlanUsers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${(stats.basicPlanUsers / stats.totalUsers) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">Premium Users</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.premiumPlanUsers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${(stats.premiumPlanUsers / stats.totalUsers) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm text-gray-600 mb-3">Engagement Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Questions Answered</p>
                    <p className="text-2xl font-bold text-gray-900">{safeFormatScore((stats?.totalQuestionsAnswered || 0) / 1000)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{(stats?.activeUsers || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">{safeFormatScore(stats?.averageExamScore)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-sm text-gray-600 mb-3">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-semibold text-gray-900">₦{safeFormatDecimal((stats?.totalRevenue || 0) / 1000000)}M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Average</span>
                    <span className="font-semibold text-gray-900">₦{safeFormatDecimal((stats?.monthlyRevenue || 0) / 1000000)}M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Growth</span>
                    <span className="font-semibold text-green-600">{safeFormatScore(stats?.platformGrowthRate)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Analytics Loading</h3>
              <p className="text-sm text-blue-700">Analytics data is being loaded. You can still manage users, pricing, and promo codes below.</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-6">
          {/* CORE OPERATIONS - ROW 1 */}
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-md transition-shadow text-left"
          >
            <Users className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">Users</h3>
            <p className="text-sm text-blue-700">Manage accounts</p>
          </button>

          <button
            onClick={() => navigate('/admin/pricing')}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-md transition-shadow text-left"
          >
            <DollarSign className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="font-semibold text-purple-900 mb-2">Pricing</h3>
            <p className="text-sm text-purple-700">Manage plans</p>
          </button>

          <button
            onClick={() => navigate('/admin/promos')}
            className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 hover:shadow-md transition-shadow text-left"
          >
            <Ticket className="w-10 h-10 text-orange-600 mb-3" />
            <h3 className="font-semibold text-orange-900 mb-2">Promos</h3>
            <p className="text-sm text-orange-700">Promo codes</p>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200 hover:shadow-md transition-shadow text-left"
          >
            <BarChart2 className="w-10 h-10 text-indigo-600 mb-3" />
            <h3 className="font-semibold text-indigo-900 mb-2">Analytics</h3>
            <p className="text-sm text-indigo-700">View reports</p>
          </button>

          {/* STRUCTURE & CONTENT - ROW 2 */}
          <button
            onClick={() => navigate('/admin/universities')}
            className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 hover:shadow-md transition-shadow text-left"
          >
            <Landmark className="w-10 h-10 text-red-600 mb-3" />
            <h3 className="font-semibold text-red-900 mb-2">Universities</h3>
            <p className="text-sm text-red-700">Manage institutions</p>
          </button>

          <button
            onClick={() => navigate('/admin/departments')}
            className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border border-pink-200 hover:shadow-md transition-shadow text-left"
          >
            <Building2 className="w-10 h-10 text-pink-600 mb-3" />
            <h3 className="font-semibold text-pink-900 mb-2">Departments</h3>
            <p className="text-sm text-pink-700">Manage departments</p>
          </button>

          <button
            onClick={() => navigate('/admin/courses')}
            className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border border-teal-200 hover:shadow-md transition-shadow text-left"
          >
            <BookOpen className="w-10 h-10 text-teal-600 mb-3" />
            <h3 className="font-semibold text-teal-900 mb-2">Courses</h3>
            <p className="text-sm text-teal-700">Manage courses</p>
          </button>

          <button
            onClick={() => navigate('/admin/topics')}
            className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-6 border border-violet-200 hover:shadow-md transition-shadow text-left"
          >
            <HelpCircle className="w-10 h-10 text-violet-600 mb-3" />
            <h3 className="font-semibold text-violet-900 mb-2">Topics</h3>
            <p className="text-sm text-violet-700">Create topics</p>
          </button>

          <button
            onClick={() => navigate('/admin/notifications')}
            className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border border-cyan-200 hover:shadow-md transition-shadow text-left"
          >
            <Mail className="w-10 h-10 text-cyan-600 mb-3" />
            <h3 className="font-semibold text-cyan-900 mb-2">Notifications</h3>
            <p className="text-sm text-cyan-700">Send messages</p>
          </button>

          {/* QUESTIONS & MATERIALS - ROW 3 */}
          <button
            onClick={() => navigate('/admin/questions-mgmt')}
            className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 hover:shadow-md transition-shadow text-left"
          >
            <HelpCircle className="w-10 h-10 text-amber-600 mb-3" />
            <h3 className="font-semibold text-amber-900 mb-2">Questions</h3>
            <p className="text-sm text-amber-700">Create & manage</p>
          </button>

          <button
            onClick={() => navigate('/admin/study-materials')}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-md transition-shadow text-left"
          >
            <FileStack className="w-10 h-10 text-green-600 mb-3" />
            <h3 className="font-semibold text-green-900 mb-2">Study Materials</h3>
            <p className="text-sm text-green-700">Upload for students</p>
          </button>

          <button
            onClick={() => navigate('/admin/questions')}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow text-left"
          >
            <AlertCircle className="w-10 h-10 text-gray-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Question Bank</h3>
            <p className="text-sm text-gray-700">Review questions</p>
          </button>

          <button
            onClick={() => navigate('/admin/materials')}
            className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl p-6 border border-lime-200 hover:shadow-md transition-shadow text-left"
          >
            <Activity className="w-10 h-10 text-lime-600 mb-3" />
            <h3 className="font-semibold text-lime-900 mb-2">Materials</h3>
            <p className="text-sm text-lime-700">Manage resources</p>
          </button>
        </div>

        <div>
          <PendingQuestionsPanel />
        </div>
      </div>
    </Layout>
  );
}
