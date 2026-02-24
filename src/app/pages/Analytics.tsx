import { Layout } from '../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { Award, Calendar, Loader } from 'lucide-react';
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
  const hasTrend = performanceTrend.length > 0;
  const hasRank = Number(leaderboardPosition?.rank || 0) > 0;
  const hasOverviewStats = hasTrend || hasRank;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
          <p className="text-gray-600">Track your progress and identify areas for improvement</p>
        </div>

        {/* Overall Stats */}
        {hasOverviewStats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hasRank && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{leaderboardPosition?.rank}</h3>
            <p className="text-sm text-gray-600">Your Rank</p>
          </div>
          )}

          {hasTrend && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{performanceTrend.length}</h3>
            <p className="text-sm text-gray-600">Exams Tracked</p>
          </div>
          )}
        </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600 font-medium">
            Analytics overview coming soon
          </div>
        )}

        {/* Performance Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Trend</h2>
          <div className="h-[220px] flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-600 font-medium">
            Coming soon
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600 font-medium">
          Topic-level analytics coming soon
        </div>
      </div>
    </Layout>
  );
}
