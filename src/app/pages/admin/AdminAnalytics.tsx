import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { adminService, AnalyticsOverview, UserMetrics, QuestionMetrics, ExamMetrics, RevenueMetrics, UniversityAnalytics } from '../../../lib/services/admin.service';
import { Users, FileText, TrendingUp, DollarSign, Download, Loader, AlertCircle, BarChart3, Calendar, Grid3x3 } from 'lucide-react';
import toast from 'react-hot-toast';

type AnalyticsTab = 'overview' | 'users' | 'questions' | 'exams' | 'revenue' | 'university';

// Safe formatters - handle null, undefined, and NaN
const safeFormatScore = (score: any): string => {
  if (score === null || score === undefined) return '0.0';
  const num = Number(score);
  if (isNaN(num)) return '0.0';
  return num.toFixed(1);
};

const safeFormatDecimal = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined) return '0'.padEnd(decimals + 2, '0');
  const num = Number(value);
  if (isNaN(num)) return '0'.padEnd(decimals + 2, '0');
  return num.toFixed(decimals);
};

const safeFormatInt = (value: any): string => {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toFixed(0);
};

export function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [questionMetrics, setQuestionMetrics] = useState<QuestionMetrics | null>(null);
  const [examMetrics, setExamMetrics] = useState<ExamMetrics | null>(null);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [universityAnalytics, setUniversityAnalytics] = useState<UniversityAnalytics | null>(null);
  
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [activeTab, selectedUniversity]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      switch (activeTab) {
        case 'overview':
          const overviewData = await adminService.getAnalyticsOverview();
          setOverview(overviewData);
          break;
        case 'users':
          const usersData = await adminService.getUserMetrics();
          setUserMetrics(usersData);
          break;
        case 'questions':
          const questionsData = await adminService.getQuestionMetrics();
          setQuestionMetrics(questionsData);
          break;
        case 'exams':
          const examsData = await adminService.getExamMetrics();
          setExamMetrics(examsData);
          break;
        case 'revenue':
          const revenueData = await adminService.getRevenueMetrics();
          setRevenueMetrics(revenueData);
          break;
        case 'university':
          if (selectedUniversity) {
            const universityData = await adminService.getUniversityAnalytics(selectedUniversity);
            setUniversityAnalytics(universityData);
          }
          break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAnalytics = async (format: 'json' | 'csv') => {
    try {
      setIsExporting(true);
      const data = await adminService.exportAnalytics(format);
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export analytics');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateReport = async (type: 'performance' | 'users' | 'revenue' | 'questions' | 'overview') => {
    try {
      setIsLoading(true);
      const report = await adminService.generateReport(type);
      
      // Download report
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${type}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${type} report generated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
            <p className="text-gray-600">Comprehensive platform analytics and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExportAnalytics('json')}
              disabled={isExporting}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => handleExportAnalytics('csv')}
              disabled={isExporting}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-2 overflow-x-auto">
          {[
            { id: 'overview' as AnalyticsTab, label: 'Overview' },
            { id: 'users' as AnalyticsTab, label: 'Users' },
            { id: 'questions' as AnalyticsTab, label: 'Questions' },
            { id: 'exams' as AnalyticsTab, label: 'Exams' },
            { id: 'revenue' as AnalyticsTab, label: 'Revenue' },
            { id: 'university' as AnalyticsTab, label: 'University' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error loading analytics</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{(overview?.totalUsers || 0).toLocaleString()}</h3>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-xs text-gray-500 mt-2">{overview?.activeUsers || 0} active</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <FileText className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{(overview?.totalExamsCompleted || 0).toLocaleString()}</h3>
                    <p className="text-sm text-gray-600">Exams Completed</p>
                    <p className="text-xs text-gray-500 mt-2">{safeFormatScore(overview?.averageExamScore)}% avg</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <DollarSign className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">₦{safeFormatDecimal((overview?.totalRevenue || 0) / 1000000)}M</h3>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-xs text-gray-500 mt-2">₦{safeFormatDecimal((overview?.monthlyRevenue || 0) / 1000000)}M/mo</p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="w-10 h-10 text-amber-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{safeFormatScore(overview?.platformGrowthRate)}%</h3>
                    <p className="text-sm text-gray-600">Growth Rate</p>
                    <p className="text-xs text-gray-500 mt-2">Monthly growth</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Plan Distribution</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Free</span>
                          <span className="font-semibold text-gray-900">{overview.freeUsers}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gray-400 h-2 rounded-full"
                            style={{ width: `${(overview.freeUsers / overview.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Basic</span>
                          <span className="font-semibold text-gray-900">{overview.basicPlanUsers}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-400 h-2 rounded-full"
                            style={{ width: `${(overview.basicPlanUsers / overview.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Premium</span>
                          <span className="font-semibold text-gray-900">{overview.premiumPlanUsers}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-400 h-2 rounded-full"
                            style={{ width: `${(overview.premiumPlanUsers / overview.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Questions Metrics</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Answered</p>
                        <p className="text-2xl font-bold text-gray-900">{safeFormatScore(overview.totalQuestionsAnswered / 1000)}K</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Score</p>
                        <p className="text-2xl font-bold text-gray-900">{safeFormatScore(overview.averageExamScore)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Reports</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleGenerateReport('overview')}
                        className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                      >
                        Export Overview
                      </button>
                      <button
                        onClick={() => handleGenerateReport('performance')}
                        className="w-full px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                      >
                        Performance Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && userMetrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{userMetrics.totalUsers.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">New This Month</p>
                    <p className="text-3xl font-bold text-green-600">{userMetrics.newUsersThisMonth.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Active Today</p>
                    <p className="text-3xl font-bold text-blue-600">{userMetrics.activeUsersToday.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Retention Rate</p>
                    <p className="text-3xl font-bold text-purple-600">{safeFormatScore(userMetrics.userRetentionRate * 100)}%</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Plan Distribution</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Free</span>
                          <span className="font-semibold text-gray-900">{userMetrics.planDistribution.free}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gray-400 h-2 rounded-full"
                            style={{
                              width: `${(userMetrics.planDistribution.free / userMetrics.totalUsers) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Basic</span>
                          <span className="font-semibold text-gray-900">{userMetrics.planDistribution.basic}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-400 h-2 rounded-full"
                            style={{
                              width: `${(userMetrics.planDistribution.basic / userMetrics.totalUsers) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Premium</span>
                          <span className="font-semibold text-gray-900">{userMetrics.planDistribution.premium}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-400 h-2 rounded-full"
                            style={{
                              width: `${(userMetrics.planDistribution.premium / userMetrics.totalUsers) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Activity Metrics</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Active This Week</p>
                        <p className="text-2xl font-bold text-gray-900">{userMetrics.activeUsersThisWeek.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active This Month</p>
                        <p className="text-2xl font-bold text-gray-900">{userMetrics.activeUsersThisMonth.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Banned Users</p>
                        <p className="text-2xl font-bold text-red-600">{userMetrics.bannedUsersCount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Generate Reports</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleGenerateReport('users')}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                    >
                      User Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && questionMetrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Total Questions</p>
                    <p className="text-3xl font-bold text-gray-900">{questionMetrics.totalQuestions.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Avg Difficulty</p>
                    <p className="text-3xl font-bold text-blue-600">{safeFormatDecimal(questionMetrics.averageDifficulty)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Avg Answer Time</p>
                    <p className="text-3xl font-bold text-purple-600">{safeFormatInt(questionMetrics.averageAnswerTime)}s</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">By Difficulty</h3>
                    <div className="space-y-3">
                      {Object.entries(questionMetrics.questionsByDifficulty).map(([difficulty, count]) => (
                        <div key={difficulty}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600 capitalize">{difficulty}</span>
                            <span className="font-semibold text-gray-900">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-400 h-2 rounded-full"
                              style={{
                                width: `${(count / questionMetrics.totalQuestions) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Top Performing</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {questionMetrics.mostAnsweredQuestions.slice(0, 5).map((q) => (
                        <div key={q.questionId} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.text}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                            <span>{q.timesAnswered} attempts</span>
                            <span className="text-green-600 font-medium">{safeFormatScore(q.correctAnswerPercentage)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateReport('questions')}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                >
                  Generate Questions Report
                </button>
              </div>
            )}

            {/* Exams Tab */}
            {activeTab === 'exams' && examMetrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Total Exams</p>
                    <p className="text-3xl font-bold text-gray-900">{examMetrics.totalExamsCompleted.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">This Month</p>
                    <p className="text-3xl font-bold text-green-600">{examMetrics.examsThisMonth.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Avg Score</p>
                    <p className="text-3xl font-bold text-blue-600">{safeFormatScore(examMetrics.averageScore)}%</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Pass Rate</p>
                    <p className="text-3xl font-bold text-purple-600">{safeFormatScore(examMetrics.passRate * 100)}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Performing Courses</h3>
                  <div className="space-y-3">
                    {examMetrics.topPerformingCourses.map((course) => (
                      <div key={course.courseId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{course.courseName}</p>
                          <p className="text-xs text-gray-600">{course.completedCount} completed</p>
                        </div>
                        <p className="font-semibold text-gray-900">{safeFormatScore(course.averageScore)}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateReport('performance')}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                >
                  Generate Performance Report
                </button>
              </div>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && revenueMetrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">₦{safeFormatDecimal(revenueMetrics.totalRevenue / 1000000)}M</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Monthly</p>
                    <p className="text-3xl font-bold text-green-600">₦{safeFormatDecimal(revenueMetrics.monthlyRevenue / 1000000)}M</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Success Rate</p>
                    <p className="text-3xl font-bold text-blue-600">{safeFormatScore(revenueMetrics.successRate * 100)}%</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-sm text-gray-600 mb-2">Transactions</p>
                    <p className="text-3xl font-bold text-purple-600">{revenueMetrics.transactionCount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Basic</span>
                          <span className="font-semibold text-gray-900">₦{(revenueMetrics.revenueByPlan.basic / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-400 h-2 rounded-full"
                            style={{
                              width: `${(revenueMetrics.revenueByPlan.basic / revenueMetrics.totalRevenue) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Premium</span>
                          <span className="font-semibold text-gray-900">₦{(revenueMetrics.revenueByPlan.premium / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-400 h-2 rounded-full"
                            style={{
                              width: `${(revenueMetrics.revenueByPlan.premium / revenueMetrics.totalRevenue) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Transaction Status</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Successful</p>
                        <p className="text-2xl font-bold text-green-600">{revenueMetrics.successfulTransactions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{revenueMetrics.failedTransactions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Pending</p>
                        <p className="text-2xl font-bold text-amber-600">{revenueMetrics.pendingTransactions.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {revenueMetrics.topPromoCodes.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Top Promo Codes</h3>
                    <div className="space-y-3">
                      {revenueMetrics.topPromoCodes.map((promo) => (
                        <div key={promo.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-mono font-bold text-gray-900">{promo.code}</p>
                            <p className="text-xs text-gray-600">{promo.usageCount} uses</p>
                          </div>
                          <p className="font-semibold text-gray-900">-₦{(promo.discountAmount / 1000).toFixed(0)}K</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleGenerateReport('revenue')}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
                >
                  Generate Revenue Report
                </button>
              </div>
            )}

            {/* University Tab */}
            {activeTab === 'university' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <label className="block text-sm font-medium text-gray-900 mb-3">Select University (ID)</label>
                  <input
                    type="text"
                    placeholder="Enter university ID..."
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-4"
                  />
                  <button
                    onClick={() => loadAnalytics()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Load Analytics
                  </button>
                </div>

                {universityAnalytics && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Total Students</p>
                        <p className="text-3xl font-bold text-gray-900">{universityAnalytics.totalStudents.toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Total Faculty</p>
                        <p className="text-3xl font-bold text-blue-600">{universityAnalytics.totalFaculty.toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Departments</p>
                        <p className="text-3xl font-bold text-purple-600">{universityAnalytics.totalDepartments.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                            <p className="text-2xl font-bold text-gray-900">{universityAnalytics.averageExamScore.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
                            <p className="text-2xl font-bold text-green-600">{(universityAnalytics.passRate * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Revenue Generated</p>
                            <p className="text-2xl font-bold text-purple-600">₦{(universityAnalytics.revenueGenerated / 1000000).toFixed(2)}M</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Top Courses</h3>
                        <div className="space-y-3">
                          {universityAnalytics.topPerformingCourses.map((course) => (
                            <div key={course.courseId} className="flex items-center justify-between p-2">
                              <p className="text-sm font-medium text-gray-900">{course.courseName}</p>
                              <p className="text-sm font-semibold text-gray-600">{course.averageScore.toFixed(1)}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
