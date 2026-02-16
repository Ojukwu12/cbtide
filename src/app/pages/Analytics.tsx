import { Layout } from '../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, Calendar, BookOpen, Loader } from 'lucide-react';
import { analyticsService } from '../../lib/services';

// Safe score formatter - handles null, undefined, and NaN
const safeFormatScore = (score: any): string => {
  if (score === null || score === undefined) return '0.0';
  const num = Number(score);
  if (isNaN(num)) return '0.0';
  return num.toFixed(1);
};

export function Analytics() {
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: () => analyticsService.getTrends(),
  });

  const { data: weakAreas } = useQuery({
    queryKey: ['weak-areas'],
    queryFn: () => analyticsService.getWeakAreas(),
  });

  const { data: strongAreas } = useQuery({
    queryKey: ['strong-areas'],
    queryFn: () => analyticsService.getStrongAreas(),
  });

  const { data: leaderboardPosition } = useQuery({
    queryKey: ['leaderboard-position'],
    queryFn: () => analyticsService.getLeaderboardPosition(),
  });

  if (trendsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  // Transform performance trends data for chart
  const performanceTrend = trends || [];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
          <p className="text-gray-600">Track your progress and identify areas for improvement</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{performanceTrend[performanceTrend.length - 1]?.score || 0}%</h3>
            <p className="text-sm text-gray-600">Latest Score</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{leaderboardPosition?.rank || 'N/A'}</h3>
            <p className="text-sm text-gray-600">Your Rank</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{performanceTrend.length}</h3>
            <p className="text-sm text-gray-600">Exams Tracked</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{strongAreas?.length || 0}</h3>
            <p className="text-sm text-gray-600">Strong Areas</p>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" />
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
                dataKey="score" 
                stroke="#16a34a" 
                strokeWidth={3}
                dot={{ fill: '#16a34a', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Topic Performance - Strong Areas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Strong Topics</h2>
            {strongAreas && strongAreas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strongAreas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="topicName" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="averageScore" fill="#16a34a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No strong topics data available yet
              </div>
            )}
          </div>

          {/* Weak Areas Performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Topics to Improve</h2>
            {weakAreas && weakAreas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weakAreas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="topicName" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="averageScore" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No weak topics data available yet
              </div>
            )}
          </div>
        </div>

        {/* Strong and Weak Areas List */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Strong Areas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Strong Areas</h2>
            </div>
            <div className="space-y-4">
              {strongAreas && strongAreas.length > 0 ? (
                strongAreas.map((area, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{area.topicName}</span>
                      <span className="text-sm font-bold text-green-600">{safeFormatScore(area.averageScore)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${area?.averageScore ? Number(area.averageScore) : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No strong areas data yet. Take more exams to see your progress!</p>
              )}
            </div>
          </div>

          {/* Weak Areas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Areas for Improvement</h2>
            </div>
            <div className="space-y-4">
              {weakAreas && weakAreas.length > 0 ? (
                weakAreas.map((area, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{area.topicName}</span>
                      <span className="text-sm font-bold text-red-600">{safeFormatScore(area.averageScore)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-600 rounded-full transition-all"
                        style={{ width: `${area?.averageScore ? Number(area.averageScore) : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Great job! No major weak areas detected. Keep practicing!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
