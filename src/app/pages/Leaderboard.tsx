import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { Trophy, Medal, Award, TrendingUp, Loader } from 'lucide-react';
import { leaderboardService } from '../../lib/services';

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<'global' | 'university'>('global');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard', activeTab],
    queryFn: () => leaderboardService.getLeaderboard({ limit: 50, page: 1 }),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  const entries = leaderboard?.entries || [];
  const userPosition = leaderboard?.userPosition;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-gray-600 font-semibold">{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700';
    return 'bg-white';
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">See how you rank against your peers</p>
        </div>

        {/* Current User Rank Card */}
        {userPosition && (
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">Your Current Rank</p>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold">#{userPosition.rank}</div>
                  <div>
                    <p className="text-2xl font-bold">{userPosition.averageScore.toFixed(1)}%</p>
                    <p className="text-green-100">Average Score</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-6 text-center">
                <TrendingUp className="w-12 h-12 mb-2 mx-auto" />
                <p className="text-sm">{userPosition.examsTaken} exams</p>
                <p className="text-xs text-green-100">completed</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {(['global', 'university'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'global' ? 'Global' : 'University'}
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard List */}
          <div className="p-6">
            <div className="space-y-3">
              {entries.length > 0 ? (
                entries.map((entry) => {
                  const isCurrentUser = userPosition?.userId === entry.userId;
                  return (
                    <div
                      key={entry.rank}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                        isCurrentUser
                          ? 'bg-green-50 border-2 border-green-600'
                          : entry.rank <= 3
                          ? `${getRankBadge(entry.rank)} text-white`
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank */}
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            entry.rank <= 3 ? 'bg-white/20' : isCurrentUser ? 'bg-green-100' : 'bg-white'
                          }`}
                        >
                          {getRankIcon(entry.rank)}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-semibold ${
                                entry.rank <= 3 && !isCurrentUser ? 'text-white' : 'text-gray-900'
                              }`}
                            >
                              {entry.userName}
                            </h3>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm ${
                              entry.rank <= 3 && !isCurrentUser ? 'text-white/80' : 'text-gray-600'
                            }`}
                          >
                            {entry.universityName}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-8">
                          <div className="text-right">
                            <p
                              className={`text-2xl font-bold ${
                                entry.rank <= 3 && !isCurrentUser
                                  ? 'text-white'
                                  : isCurrentUser
                                  ? 'text-green-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {entry.averageScore.toFixed(1)}%
                            </p>
                            <p
                              className={`text-xs ${
                                entry.rank <= 3 && !isCurrentUser ? 'text-white/80' : 'text-gray-500'
                              }`}
                            >
                              Avg Score
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-semibold ${
                                entry.rank <= 3 && !isCurrentUser
                                  ? 'text-white'
                                  : isCurrentUser
                                  ? 'text-green-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {entry.examsTaken}
                            </p>
                            <p
                              className={`text-xs ${
                                entry.rank <= 3 && !isCurrentUser ? 'text-white/80' : 'text-gray-500'
                              }`}
                            >
                              Exams
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No leaderboard data available yet. Start taking exams to appear on the leaderboard!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex gap-3">
            <Award className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">How Rankings Work</h3>
              <p className="text-sm text-blue-800">
                Rankings are calculated based on your average score across all exams, 
                with recent performance weighted more heavily. Complete more exams to improve your rank!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
