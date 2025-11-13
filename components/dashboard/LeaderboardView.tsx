import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  Zap,
  Users,
  BookOpen,
  Target,
  Crown,
  Medal,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar
} from 'lucide-react';
import type {
  WritingMetrics,
  AIMetrics,
  CollaborationMetrics,
  AnalyticsTimeframe
} from '../../types/dashboard';

type LeaderboardCategory = 'overall' | 'writing' | 'ai-usage' | 'collaboration';
type TimePeriod = 'today' | 'week' | 'month' | 'all-time';

interface UserMetrics {
  userId: string;
  totalWords: number;
  totalCharacters: number;
  totalParagraphs: number;
  sessionsCount: number;
  avgSessionDuration: number;
  peakProductivityHour: number;
  dailyWordCounts: Record<string, number>;
}

interface AIUsageMetrics {
  totalRequests: number;
  byProvider: Record<string, number>;
  byFeature: Record<string, number>;
  acceptanceRate: number;
  avgResponseTime: number;
  suggestionCount: number;
  tokenUsage: Record<string, number>;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  earnedDate?: Date;
}

interface UserPerformance {
  userId: string;
  userName: string;
  userAvatar?: string;
  overallScore: number;
  writingScore: number;
  aiUsageScore: number;
  collaborationScore: number;
  metrics: {
    totalWords: number;
    sessionsCount: number;
    avgSessionDuration: number;
    aiRequestsCount: number;
    commentsCount: number;
    collaboratorsCount: number;
  };
  achievements: Achievement[];
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  rank: number;
  previousRank?: number;
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'prolific-writer',
    name: 'Prolific Writer',
    description: 'Wrote over 10,000 words this week',
    icon: <BookOpen size={16} />,
    color: 'text-blue-500'
  },
  {
    id: 'ai-pioneer',
    name: 'AI Pioneer',
    description: 'Made 100+ AI requests',
    icon: <Zap size={16} />,
    color: 'text-purple-500'
  },
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Collaborated with 5+ team members',
    icon: <Users size={16} />,
    color: 'text-green-500'
  },
  {
    id: 'consistency-master',
    name: 'Consistency Master',
    description: 'Worked every day this week',
    icon: <Target size={16} />,
    color: 'text-orange-500'
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Averaged 500+ words per hour',
    icon: <TrendingUp size={16} />,
    color: 'text-red-500'
  }
];

export const LeaderboardView: React.FC = () => {
  const [category, setCategory] = useState<LeaderboardCategory>('overall');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentUserId] = useState('current-user-id'); // Would come from auth context

  const timeframe = useMemo((): AnalyticsTimeframe => {
    const end = new Date();
    const start = new Date();
    let label = '';

    switch (timePeriod) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        label = 'Today';
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        label = 'This Week';
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        label = 'This Month';
        break;
      case 'all-time':
        start.setFullYear(2020);
        label = 'All Time';
        break;
    }

    return { start, end, label };
  }, [timePeriod]);

  const calculatePerformanceScore = (
    userMetrics: UserMetrics,
    aiMetrics: AIUsageMetrics,
    collabMetrics: CollaborationMetrics
  ): { overall: number; writing: number; aiUsage: number; collaboration: number } => {
    const writingScore = Math.min(100, 
      (userMetrics.totalWords / 1000) * 10 +
      (userMetrics.sessionsCount * 2) +
      (userMetrics.avgSessionDuration / 60) * 5
    );

    const aiUsageScore = Math.min(100,
      (aiMetrics.totalRequests / 10) * 5 +
      (aiMetrics.acceptanceRate * 100) * 0.4 +
      (aiMetrics.suggestionCount / 20) * 3
    );

    const collaborationScore = Math.min(100,
      (collabMetrics.totalCollaborators * 10) +
      (collabMetrics.comments * 2) +
      (collabMetrics.resolvedComments * 3) +
      (collabMetrics.collaborationHours * 2)
    );

    const overall = (writingScore * 0.4 + aiUsageScore * 0.3 + collaborationScore * 0.3);

    return {
      overall: Math.round(overall),
      writing: Math.round(writingScore),
      aiUsage: Math.round(aiUsageScore),
      collaboration: Math.round(collaborationScore)
    };
  };

  const generateMockUserPerformance = (): UserPerformance[] => {
    const names = [
      'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson',
      'Emma Brown', 'Frank Miller', 'Grace Lee', 'Henry Taylor',
      'Iris Chen', 'Jack Anderson'
    ];

    return names.map((name, index) => {
      const userMetrics: UserMetrics = {
        userId: `user-${index}`,
        totalWords: Math.floor(Math.random() * 50000) + 10000,
        totalCharacters: 0,
        totalParagraphs: 0,
        sessionsCount: Math.floor(Math.random() * 50) + 10,
        avgSessionDuration: Math.floor(Math.random() * 180) + 30,
        peakProductivityHour: 14,
        dailyWordCounts: {}
      };

      const aiMetrics: AIUsageMetrics = {
        totalRequests: Math.floor(Math.random() * 200) + 50,
        byProvider: {},
        byFeature: {},
        acceptanceRate: Math.random() * 0.5 + 0.5,
        avgResponseTime: Math.random() * 2000 + 500,
        suggestionCount: Math.floor(Math.random() * 100) + 20,
        tokenUsage: {}
      };

      const collabMetrics: CollaborationMetrics = {
        totalCollaborators: Math.floor(Math.random() * 8) + 2,
        activeCollaborators: Math.floor(Math.random() * 6) + 1,
        collaborationHours: Math.floor(Math.random() * 50) + 10,
        comments: Math.floor(Math.random() * 100) + 20,
        resolvedComments: Math.floor(Math.random() * 80) + 10,
        averageResponseTime: Math.floor(Math.random() * 120) + 30
      };

      const scores = calculatePerformanceScore(userMetrics, aiMetrics, collabMetrics);
      const earnedAchievements = MOCK_ACHIEVEMENTS.filter(() => Math.random() > 0.6);

      return {
        userId: `user-${index}`,
        userName: name,
        userAvatar: `https://i.pravatar.cc/150?u=${name}`,
        overallScore: scores.overall,
        writingScore: scores.writing,
        aiUsageScore: scores.aiUsage,
        collaborationScore: scores.collaboration,
        metrics: {
          totalWords: userMetrics.totalWords,
          sessionsCount: userMetrics.sessionsCount,
          avgSessionDuration: userMetrics.avgSessionDuration,
          aiRequestsCount: aiMetrics.totalRequests,
          commentsCount: collabMetrics.comments,
          collaboratorsCount: collabMetrics.totalCollaborators
        },
        achievements: earnedAchievements,
        trend: {
          direction: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable',
          percentage: Math.floor(Math.random() * 30) + 1
        },
        rank: 0,
        previousRank: index > 0 ? Math.floor(Math.random() * 10) + 1 : undefined
      };
    });
  };

  const [leaderboardData, setLeaderboardData] = useState<UserPerformance[]>([]);

  useEffect(() => {
    const data = generateMockUserPerformance();
    setLeaderboardData(data);
  }, [timePeriod]);

  const sortedLeaderboard = useMemo(() => {
    const scoreField = {
      'overall': 'overallScore',
      'writing': 'writingScore',
      'ai-usage': 'aiUsageScore',
      'collaboration': 'collaborationScore'
    }[category] as keyof UserPerformance;

    const sorted = [...leaderboardData].sort((a, b) => {
      const aScore = a[scoreField] as number;
      const bScore = b[scoreField] as number;
      return bScore - aScore;
    });

    return sorted.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  }, [leaderboardData, category]);

  const currentUser = sortedLeaderboard.find(u => u.userId === currentUserId);
  const topThree = sortedLeaderboard.slice(0, 3);
  const restOfLeaderboard = sortedLeaderboard.slice(3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Medal className="text-amber-600" size={24} />;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">{rank}</div>;
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="text-green-500" size={16} />;
      case 'down':
        return <TrendingDown className="text-red-500" size={16} />;
      default:
        return <div className="w-4 h-0.5 bg-gray-400" />;
    }
  };

  const getCategoryIcon = (cat: LeaderboardCategory) => {
    switch (cat) {
      case 'overall':
        return <Trophy size={20} />;
      case 'writing':
        return <BookOpen size={20} />;
      case 'ai-usage':
        return <Zap size={20} />;
      case 'collaboration':
        return <Users size={20} />;
    }
  };

  const UserCard: React.FC<{ user: UserPerformance; isExpanded: boolean }> = ({ user, isExpanded }) => {
    const isCurrentUser = user.userId === currentUserId;
    const score = {
      'overall': user.overallScore,
      'writing': user.writingScore,
      'ai-usage': user.aiUsageScore,
      'collaboration': user.collaborationScore
    }[category];

    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-all ${
          isCurrentUser ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => setExpandedUser(isExpanded ? null : user.userId)}
        >
          {/* Rank */}
          <div className="flex-shrink-0">
            {getRankIcon(user.rank)}
          </div>

          {/* Avatar */}
          <img
            src={user.userAvatar}
            alt={user.userName}
            className="w-12 h-12 rounded-full"
          />

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {user.userName}
              </h3>
              {isCurrentUser && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {getTrendIcon(user.trend.direction)}
                <span className={`text-sm ${
                  user.trend.direction === 'up' ? 'text-green-600 dark:text-green-400' :
                  user.trend.direction === 'down' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {user.trend.percentage}%
                </span>
              </div>
              {user.achievements.length > 0 && (
                <div className="flex items-center gap-1">
                  <Award size={14} className="text-amber-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {user.achievements.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {score}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
          </div>

          {/* Expand Icon */}
          <div className="flex-shrink-0">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Detailed Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Words</div>
                <div className="text-lg font-semibold">{user.metrics.totalWords.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Sessions</div>
                <div className="text-lg font-semibold">{user.metrics.sessionsCount}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Duration</div>
                <div className="text-lg font-semibold">{Math.round(user.metrics.avgSessionDuration)}m</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">AI Requests</div>
                <div className="text-lg font-semibold">{user.metrics.aiRequestsCount}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Comments</div>
                <div className="text-lg font-semibold">{user.metrics.commentsCount}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Collaborators</div>
                <div className="text-lg font-semibold">{user.metrics.collaboratorsCount}</div>
              </div>
            </div>

            {/* Category Scores */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance Breakdown</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Writing</span>
                  <span className="text-sm font-semibold">{user.writingScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${user.writingScore}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Usage</span>
                  <span className="text-sm font-semibold">{user.aiUsageScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${user.aiUsageScore}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Collaboration</span>
                  <span className="text-sm font-semibold">{user.collaborationScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${user.collaborationScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Achievements */}
            {user.achievements.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Achievements</div>
                <div className="flex flex-wrap gap-2">
                  {user.achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                      title={achievement.description}
                    >
                      <span className={achievement.color}>{achievement.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {achievement.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const PodiumCard: React.FC<{ user: UserPerformance; position: 1 | 2 | 3 }> = ({ user, position }) => {
    const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
    const orders = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };
    const score = {
      'overall': user.overallScore,
      'writing': user.writingScore,
      'ai-usage': user.aiUsageScore,
      'collaboration': user.collaborationScore
    }[category];

    return (
      <div className={`flex flex-col items-center ${orders[position]}`}>
        <img
          src={user.userAvatar}
          alt={user.userName}
          className={`w-16 h-16 rounded-full border-4 ${
            position === 1 ? 'border-yellow-400' :
            position === 2 ? 'border-gray-400' :
            'border-amber-600'
          } mb-2`}
        />
        <div className="text-center mb-2">
          <div className="font-semibold text-gray-900 dark:text-white">{user.userName}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{score} points</div>
        </div>
        <div className={`${heights[position]} w-24 rounded-t-lg ${
          position === 1 ? 'bg-gradient-to-t from-yellow-400 to-yellow-500' :
          position === 2 ? 'bg-gradient-to-t from-gray-300 to-gray-400' :
          'bg-gradient-to-t from-amber-500 to-amber-600'
        } flex items-start justify-center pt-3`}>
          {getRankIcon(position)}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Leaderboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track performance and celebrate achievements
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Tabs */}
          <div className="flex gap-2">
            {(['overall', 'writing', 'ai-usage', 'collaboration'] as LeaderboardCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  category === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getCategoryIcon(cat)}
                <span className="capitalize">{cat.replace('-', ' ')}</span>
              </button>
            ))}
          </div>

          {/* Time Period */}
          <div className="flex gap-2 ml-auto">
            <Calendar size={20} className="text-gray-400" />
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all-time">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Star className="text-yellow-500" />
            Top Performers
          </h2>
          <div className="flex items-end justify-center gap-4">
            <PodiumCard user={topThree[1]} position={2} />
            <PodiumCard user={topThree[0]} position={1} />
            <PodiumCard user={topThree[2]} position={3} />
          </div>
        </div>
      )}

      {/* Current User Highlight */}
      {currentUser && currentUser.rank > 3 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <Target className="text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-900 dark:text-blue-100">Your Performance</span>
          </div>
          <UserCard user={currentUser} isExpanded={false} />
        </div>
      )}

      {/* Rest of Leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Rankings
        </h2>
        <div className="space-y-3">
          {restOfLeaderboard.map(user => (
            <UserCard
              key={user.userId}
              user={user}
              isExpanded={expandedUser === user.userId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};