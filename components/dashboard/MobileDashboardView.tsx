import React, { useState, useEffect } from 'react';
import {
  BarChartIcon,
  CalendarIcon,
  UsersIcon,
  FlagIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  XIcon,
  ChevronDownIcon,
} from '../icons/IconDefs';

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<any>;
  color: string;
}

interface ActivityItem {
  id: string;
  type: 'write' | 'edit' | 'collaborate' | 'publish';
  title: string;
  time: string;
  progress?: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

const MobileDashboardView: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [activeTab, setActiveTab] = useState<'metrics' | 'activity' | 'goals'>('metrics');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Sample metrics data
  const metrics: MetricCard[] = [
    {
      id: '1',
      title: 'Words Today',
      value: '2,847',
      change: 12.5,
      icon: BarChartIcon,
      color: 'bg-blue-500',
    },
    {
      id: '2',
      title: 'Active Projects',
      value: 5,
      change: 0,
      icon: CalendarIcon,
      color: 'bg-green-500',
    },
    {
      id: '3',
      title: 'Team Members',
      value: 12,
      change: 8.3,
      icon: UsersIcon,
      color: 'bg-purple-500',
    },
    {
      id: '4',
      title: 'Achievements',
      value: 23,
      change: 15.2,
      icon: FlagIcon,
      color: 'bg-yellow-500',
    },
  ];

  // Sample activity data
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'write',
      title: 'Chapter 5 - Draft completed',
      time: '2 hours ago',
      progress: 100,
    },
    {
      id: '2',
      type: 'edit',
      title: 'Revision of Chapter 3',
      time: '5 hours ago',
      progress: 65,
    },
    {
      id: '3',
      type: 'collaborate',
      title: 'Review session with Editor',
      time: '1 day ago',
    },
    {
      id: '4',
      type: 'publish',
      title: 'Blog post published',
      time: '2 days ago',
    },
  ];

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'New Project',
      icon: BarChartIcon,
      color: 'bg-blue-500',
      action: () => console.log('New project'),
    },
    {
      id: '2',
      title: 'Continue Writing',
      icon: CalendarIcon,
      color: 'bg-green-500',
      action: () => console.log('Continue writing'),
    },
    {
      id: '3',
      title: 'Team Chat',
      icon: UsersIcon,
      color: 'bg-purple-500',
      action: () => console.log('Team chat'),
    },
    {
      id: '4',
      title: 'Analytics',
      icon: FlagIcon,
      color: 'bg-yellow-500',
      action: () => console.log('Analytics'),
    },
  ];

  // Swipe detection for tab navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - next tab
      if (activeTab === 'metrics') setActiveTab('activity');
      else if (activeTab === 'activity') setActiveTab('goals');
    }

    if (isRightSwipe) {
      // Swipe right - previous tab
      if (activeTab === 'goals') setActiveTab('activity');
      else if (activeTab === 'activity') setActiveTab('metrics');
    }
  };

  // Pull-to-refresh simulation
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const handlePullStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStart(e.targetTouches[0].clientY);
    }
  };

  const handlePullMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientY;
    const distance = Math.max(0, Math.min(currentTouch - touchStart, 100));
    setPullDistance(distance);
  };

  const handlePullEnd = () => {
    if (pullDistance > 60) {
      setIsPullRefreshing(true);
      // Simulate refresh
      setTimeout(() => {
        setIsPullRefreshing(false);
        setPullDistance(0);
      }, 1500);
    } else {
      setPullDistance(0);
    }
    setTouchStart(null);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'write':
        return '✍️';
      case 'edit':
        return '✏️';
      case 'collaborate':
        return '👥';
      case 'publish':
        return '📤';
      default:
        return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-gray-800 border-b border-gray-700">
        {/* Pull-to-refresh indicator */}
        {pullDistance > 0 && (
          <div 
            className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-500 text-white transition-all"
            style={{ height: `${pullDistance}px` }}
          >
            {isPullRefreshing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            ) : (
              <span className="text-sm">Pull to refresh</span>
            )}
          </div>
        )}

        <div 
          className="px-4 py-3"
          onTouchStart={handlePullStart}
          onTouchMove={handlePullMove}
          onTouchEnd={handlePullEnd}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isMenuOpen ? (
                <XIcon className="h-6 w-6 text-white" />
              ) : (
                <div className="h-6 w-6 flex flex-col justify-center space-y-1">
                  <div className="h-0.5 w-full bg-white" />
                  <div className="h-0.5 w-full bg-white" />
                  <div className="h-0.5 w-full bg-white" />
                </div>
              )}
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex space-x-2 mt-3">
            {(['today', 'week', 'month'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-64 bg-gray-800 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Menu</h2>
              <nav className="space-y-2">
                {['Dashboard', 'Projects', 'Analytics', 'Team', 'Settings'].map(item => (
                  <button
                    key={item}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    <span>{item}</span>
                    <ChevronDownIcon className="h-4 w-4 transform -rotate-90" />
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div 
        className="flex border-b border-gray-700 bg-gray-800"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {[
          { id: 'metrics' as const, label: 'Metrics' },
          { id: 'activity' as const, label: 'Activity' },
          { id: 'goals' as const, label: 'Goals' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              {metrics.map(metric => (
                <div
                  key={metric.id}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                >
                  <div className={`${metric.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                    <metric.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                  <p className="text-xs text-gray-400 mb-2">{metric.title}</p>
                  <div className="flex items-center">
                    {metric.change !== 0 && (
                      <>
                        <span className={`text-xs mr-1 ${metric.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metric.change > 0 ? '↑' : '↓'}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            metric.change > 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {Math.abs(metric.change)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-2 mx-auto`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm text-gray-300 text-center">{action.title}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Mini Chart */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-white mb-3">Writing Progress</h3>
              <div className="h-32 flex items-end space-x-2">
                {[65, 78, 45, 89, 72, 95, 88].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">Mon</span>
                <span className="text-xs text-gray-400">Sun</span>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            {activities.map(activity => (
              <div
                key={activity.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700"
              >
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    {activity.progress !== undefined && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${activity.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{activity.progress}% complete</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            {/* Daily Goal */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Daily Writing Goal</h3>
                <span className="text-xs text-gray-400">2,847 / 3,000</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: '94.9%' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">153 words to go!</p>
            </div>

            {/* Weekly Goal */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Weekly Goal</h3>
                <span className="text-xs text-gray-400">15,234 / 20,000</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: '76.2%' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">4,766 words remaining</p>
            </div>

            {/* Achievements */}
            <div>
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Recent Achievements</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: '🏆', name: '7-Day Streak' },
                  { emoji: '📚', name: '10K Words' },
                  { emoji: '⭐', name: 'Perfect Week' },
                ].map((achievement, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center"
                  >
                    <div className="text-3xl mb-1">{achievement.emoji}</div>
                    <p className="text-xs text-gray-300">{achievement.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          {[
            { icon: BarChartIcon, label: 'Dashboard' },
            { icon: CalendarIcon, label: 'Projects' },
            { icon: UsersIcon, label: 'Team' },
            { icon: FlagIcon, label: 'Profile' },
          ].map((item, i) => (
            <button
              key={i}
              className="flex flex-col items-center py-2 px-4 text-gray-400 hover:text-white transition-colors"
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileDashboardView;