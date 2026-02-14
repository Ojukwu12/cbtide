import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { PendingQuestionsPanel } from '../../components/admin/PendingQuestionsPanel';
import { adminService, AnalyticsOverview } from '../../../lib/services/admin.service';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign,
  Activity,
  AlertCircle,
  BarChart3,
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const overview = await adminService.getAnalyticsOverview();
      setStats(overview);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
      toast.error(message);
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

  if (error || !stats) {
    return (
      <Layout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor platform performance and manage operations</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Failed to load analytics</h3>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={loadAnalytics}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Monitor platform performance and manage operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalUsers.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-xs text-gray-500 mt-2">{stats.activeUsers} active this month</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalExamsCompleted.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Total Exams</p>
            <p className="text-xs text-gray-500 mt-2">Average: {Math.round(stats.averageExamScore)}% score</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">₦{(stats.monthlyRevenue / 1000000).toFixed(2)}M</h3>
            <p className="text-sm text-gray-600">Monthly Revenue</p>
            <p className="text-xs text-gray-500 mt-2">Total: ₦{(stats.totalRevenue / 1000000).toFixed(2)}M</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm text-amber-600 font-medium">Overview</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.platformGrowthRate.toFixed(1)}%</h3>
            <p className="text-sm text-gray-600">Growth Rate</p>
            <p className="text-xs text-gray-500 mt-2">Monthly platform growth</p>
          </div>
        </div>

        {/* Plan Distribution */}
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
                <p className="text-2xl font-bold text-gray-900">{(stats.totalQuestionsAnswered / 1000).toFixed(1)}K</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageExamScore.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm text-gray-600 mb-3">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="font-semibold text-gray-900">₦{(stats.totalRevenue / 1000000).toFixed(2)}M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Average</span>
                <span className="font-semibold text-gray-900">₦{(stats.monthlyRevenue / 1000000).toFixed(2)}M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Growth</span>
                <span className="font-semibold text-green-600">{stats.platformGrowthRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-md transition-shadow text-left"
          >
            <Users className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">Manage Users</h3>
            <p className="text-sm text-blue-700">View and manage user accounts</p>
          </button>

          <button
            onClick={() => navigate('/admin/pricing')}
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-md transition-shadow text-left"
          >
            <DollarSign className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="font-semibold text-purple-900 mb-2">Pricing Plans</h3>
            <p className="text-sm text-purple-700">Manage subscription plans</p>
          </button>

          <button
            onClick={() => navigate('/admin/questions')}
            className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 hover:shadow-md transition-shadow text-left"
          >
            <AlertCircle className="w-10 h-10 text-amber-600 mb-3" />
            <h3 className="font-semibold text-amber-900 mb-2">Review Questions</h3>
            <p className="text-sm text-amber-700">Manage AI-generated questions</p>
          </button>

          <button
            onClick={() => navigate('/admin/materials')}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-md transition-shadow text-left"
          >
            <Activity className="w-10 h-10 text-green-600 mb-3" />
            <h3 className="font-semibold text-green-900 mb-2">Study Materials</h3>
            <p className="text-sm text-green-700">Manage course materials</p>
          </button>
        </div>

        {/* Pending Questions Panel */}
        <div>
          <PendingQuestionsPanel />
        </div>
      </div>
    </Layout>
  );
