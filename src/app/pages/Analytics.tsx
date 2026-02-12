import { Layout } from '../components/Layout';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, Calendar, BookOpen } from 'lucide-react';

export function Analytics() {
  // Mock data
  const performanceTrend = [
    { date: 'Feb 1', score: 72 },
    { date: 'Feb 3', score: 68 },
    { date: 'Feb 5', score: 75 },
    { date: 'Feb 7', score: 78 },
    { date: 'Feb 9', score: 85 },
  ];

  const topicPerformance = [
    { topic: 'Data Structures', score: 85, total: 20 },
    { topic: 'Algorithms', score: 78, total: 18 },
    { topic: 'OOP', score: 92, total: 22 },
    { topic: 'Databases', score: 65, total: 15 },
  ];

  const accuracyData = [
    { name: 'Correct', value: 82, color: '#16a34a' },
    { name: 'Incorrect', value: 18, color: '#dc2626' },
  ];

  const strongAreas = [
    { area: 'Object Oriented Programming', accuracy: 92 },
    { area: 'Data Structures', accuracy: 85 },
    { area: 'Sorting Algorithms', accuracy: 88 },
  ];

  const weakAreas = [
    { area: 'Database Normalization', accuracy: 58 },
    { area: 'Dynamic Programming', accuracy: 62 },
    { area: 'Graph Algorithms', accuracy: 65 },
  ];

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
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                +5.2%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">78.5%</h3>
            <p className="text-sm text-gray-600">Average Score</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                +2.1%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">82.3%</h3>
            <p className="text-sm text-gray-600">Accuracy Rate</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">24</h3>
            <p className="text-sm text-gray-600">Exams This Month</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">12h 45m</h3>
            <p className="text-sm text-gray-600">Study Time</p>
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
          {/* Topic Performance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Topic Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="topic" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="score" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Accuracy Breakdown</h2>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={accuracyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {accuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {accuracyData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Strong and Weak Areas */}
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
              {strongAreas.map((area, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{area.area}</span>
                    <span className="text-sm font-bold text-green-600">{area.accuracy}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${area.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
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
              {weakAreas.map((area, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{area.area}</span>
                    <span className="text-sm font-bold text-red-600">{area.accuracy}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 rounded-full transition-all"
                      style={{ width: `${area.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 AI Recommendations</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">Focus on Database Topics</h3>
              <p className="text-sm text-gray-600">Your database performance is below average. We recommend spending 2-3 hours on normalization and SQL queries.</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-1">Consistent Improvement Detected</h3>
              <p className="text-sm text-gray-600">Your scores have improved by 13% over the last 7 days. Keep up the excellent work!</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
