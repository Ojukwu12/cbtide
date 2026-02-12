import { Layout } from '../../components/Layout';
import { PendingQuestionsPanel } from '../../components/admin/PendingQuestionsPanel';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminDashboard() {
  const stats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalExams: 15678,
    revenue: 3245000,
    pendingQuestions: 34,
    approvedQuestions: 1256
  };

  const userGrowth = [
    { month: 'Aug', users: 450 },
    { month: 'Sep', users: 580 },
    { month: 'Oct', users: 720 },
    { month: 'Nov', users: 950 },
    { month: 'Dec', users: 1100 },
    { month: 'Jan', users: 1247 },
  ];

  const examActivity = [
    { day: 'Mon', exams: 245 },
    { day: 'Tue', exams: 312 },
    { day: 'Wed', exams: 289 },
    { day: 'Thu', exams: 356 },
    { day: 'Fri', exams: 401 },
    { day: 'Sat', exams: 189 },
    { day: 'Sun', exams: 156 },
  ];

  const recentActivity = [
    { user: 'Chioma Adebayo', action: 'Completed exam', course: 'CS 301', time: '5 min ago', status: 'success' },
    { user: 'Oluwaseun Ibrahim', action: 'Subscribed to Premium', course: '-', time: '12 min ago', status: 'revenue' },
    { user: 'Amina Mohammed', action: 'Started exam', course: 'MATH 201', time: '23 min ago', status: 'active' },
    { user: 'AI System', action: 'Generated 50 questions', course: 'PHY 101', time: '1 hour ago', status: 'ai' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'revenue': return 'bg-purple-100 text-purple-700';
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'ai': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

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
                +12.5%
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
                +8.3%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalExams.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Total Exams</p>
            <p className="text-xs text-gray-500 mt-2">2,341 this week</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +15.7%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">₦{(stats.revenue / 1000).toFixed(1)}M</h3>
            <p className="text-sm text-gray-600">Monthly Revenue</p>
            <p className="text-xs text-gray-500 mt-2">₦567K this week</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm text-amber-600 font-medium">Needs Review</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.pendingQuestions}</h3>
            <p className="text-sm text-gray-600">Pending AI Questions</p>
            <p className="text-xs text-gray-500 mt-2">{stats.approvedQuestions} approved total</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">User Growth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Exam Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Exam Activity (This Week)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={examActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="exams" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.user}</p>
                  <p className="text-sm text-gray-600">{activity.action} {activity.course !== '-' && `• ${activity.course}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Questions Panel */}
        <div>
          <PendingQuestionsPanel />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <Users className="w-10 h-10 text-blue-600 mb-3" />
            <h3 className="font-semibold text-blue-900 mb-2">Manage Users</h3>
            <p className="text-sm text-blue-700 mb-4">View and manage user accounts</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              Go to Users
            </button>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
            <AlertCircle className="w-10 h-10 text-amber-600 mb-3" />
            <h3 className="font-semibold text-amber-900 mb-2">Review Questions</h3>
            <p className="text-sm text-amber-700 mb-4">{stats.pendingQuestions} AI questions pending approval</p>
            <button className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
              Review Now
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <Activity className="w-10 h-10 text-green-600 mb-3" />
            <h3 className="font-semibold text-green-900 mb-2">View Analytics</h3>
            <p className="text-sm text-green-700 mb-4">Detailed platform analytics</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
              View Details
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
