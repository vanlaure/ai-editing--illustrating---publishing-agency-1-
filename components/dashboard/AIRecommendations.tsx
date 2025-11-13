import React, { useState, useEffect } from 'react';
import {
  TrendingUpIcon,
  BrainIcon,
  CalendarIcon,
  TargetIcon,
  ActivityIcon,
  LightbulbIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from '../icons/IconDefs';

interface Recommendation {
  id: string;
  type: 'pace' | 'schedule' | 'goal' | 'content' | 'productivity' | 'insight';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  prediction?: string;
  confidence: number;
  actionable: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface WritingPattern {
  bestHours: number[];
  avgWordsPerSession: number;
  consistencyScore: number;
  peakProductivityDay: string;
  currentStreak: number;
}

interface ProjectPrediction {
  projectName: string;
  currentProgress: number;
  estimatedCompletion: Date;
  daysRemaining: number;
  recommendedDailyTarget: number;
  likelihood: number;
}

const AIRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [writingPattern, setWritingPattern] = useState<WritingPattern | null>(null);
  const [predictions, setPredictions] = useState<ProjectPrediction[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'predictions' | 'insights'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    analyzeWritingPatterns();
    generateRecommendations();
    generatePredictions();
  }, []);

  const analyzeWritingPatterns = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setWritingPattern({
        bestHours: [9, 10, 11, 14, 15],
        avgWordsPerSession: 847,
        consistencyScore: 78,
        peakProductivityDay: 'Tuesday',
        currentStreak: 7,
      });
      setIsAnalyzing(false);
    }, 1000);
  };

  const generateRecommendations = () => {
    const recs: Recommendation[] = [
      {
        id: '1',
        type: 'pace',
        priority: 'high',
        title: 'Writing Pace Alert',
        description: 'Your writing pace has increased 15% this week. Maintain this momentum to finish Chapter 5 ahead of schedule.',
        prediction: 'Estimated completion: 3 days early',
        confidence: 87,
        actionable: true,
        actionLabel: 'View Progress',
        action: () => console.log('View progress'),
      },
      {
        id: '2',
        type: 'schedule',
        priority: 'high',
        title: 'Optimal Writing Time',
        description: 'Based on your patterns, you write 42% more words between 9-11 AM. Consider scheduling important writing sessions during this window.',
        confidence: 92,
        actionable: true,
        actionLabel: 'Set Reminder',
        action: () => console.log('Set reminder'),
      },
      {
        id: '3',
        type: 'goal',
        priority: 'medium',
        title: 'Goal Achievement Prediction',
        description: 'At your current pace of 2,847 words/day, you\'ll reach your weekly goal of 20,000 words with 2 days to spare.',
        prediction: 'Confidence: High (89%)',
        confidence: 89,
        actionable: false,
      },
      {
        id: '4',
        type: 'content',
        priority: 'medium',
        title: 'Content Suggestion',
        description: 'Your recent chapters show strong dialogue. Consider expanding character interactions in upcoming scenes for consistency.',
        confidence: 76,
        actionable: true,
        actionLabel: 'Learn More',
        action: () => console.log('Learn more'),
      },
      {
        id: '5',
        type: 'productivity',
        priority: 'low',
        title: 'Break Recommendation',
        description: 'You\'ve been writing for 2.5 hours. Studies show a 10-minute break now can boost productivity by 18%.',
        confidence: 94,
        actionable: true,
        actionLabel: 'Start Break Timer',
        action: () => console.log('Start break'),
      },
      {
        id: '6',
        type: 'insight',
        priority: 'low',
        title: 'Pattern Insight',
        description: 'Your Tuesday sessions average 1,200 words compared to 800 on other days. Your peak day is Tuesday.',
        confidence: 95,
        actionable: false,
      },
    ];
    setRecommendations(recs);
  };

  const generatePredictions = () => {
    const preds: ProjectPrediction[] = [
      {
        projectName: 'Novel - First Draft',
        currentProgress: 68,
        estimatedCompletion: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        daysRemaining: 21,
        recommendedDailyTarget: 2400,
        likelihood: 87,
      },
      {
        projectName: 'Short Story Collection',
        currentProgress: 42,
        estimatedCompletion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        daysRemaining: 45,
        recommendedDailyTarget: 1200,
        likelihood: 72,
      },
      {
        projectName: 'Blog Post Series',
        currentProgress: 85,
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        daysRemaining: 7,
        recommendedDailyTarget: 800,
        likelihood: 94,
      },
    ];
    setPredictions(preds);
  };

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'pace':
        return TrendingUpIcon;
      case 'schedule':
        return CalendarIcon;
      case 'goal':
        return TargetIcon;
      case 'content':
        return LightbulbIcon;
      case 'productivity':
        return ActivityIcon;
      case 'insight':
        return BrainIcon;
      default:
        return AlertCircleIcon;
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (selectedTab === 'predictions') return rec.prediction !== undefined;
    if (selectedTab === 'insights') return rec.type === 'insight' || rec.type === 'content';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <BrainIcon className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI-Powered Recommendations</h2>
            <p className="text-sm text-gray-400">Personalized insights based on your writing patterns</p>
          </div>
        </div>
        <button
          onClick={analyzeWritingPatterns}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <ActivityIcon className="h-4 w-4" />
              <span>Refresh Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* Writing Pattern Summary */}
      {writingPattern && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Your Writing Pattern</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{writingPattern.avgWordsPerSession}</div>
              <div className="text-xs text-gray-400 mt-1">Avg Words/Session</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{writingPattern.consistencyScore}%</div>
              <div className="text-xs text-gray-400 mt-1">Consistency Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{writingPattern.currentStreak}</div>
              <div className="text-xs text-gray-400 mt-1">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">{writingPattern.peakProductivityDay}</div>
              <div className="text-xs text-gray-400 mt-1">Peak Day</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">
                {writingPattern.bestHours[0]}-{writingPattern.bestHours[writingPattern.bestHours.length - 1]}
              </div>
              <div className="text-xs text-gray-400 mt-1">Best Hours</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-700">
        {[
          { id: 'all' as const, label: 'All Recommendations' },
          { id: 'predictions' as const, label: 'Predictions' },
          { id: 'insights' as const, label: 'Insights' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              selectedTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Project Predictions */}
      {selectedTab === 'predictions' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Project Completion Predictions</h3>
          {predictions.map(pred => (
            <div key={pred.projectName} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{pred.projectName}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Estimated completion: {pred.estimatedCompletion.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getConfidenceColor(pred.likelihood)}`}>
                    {pred.likelihood}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Likelihood</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-medium">{pred.currentProgress}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                    style={{ width: `${pred.currentProgress}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Days Remaining</div>
                  <div className="text-xl font-bold text-white">{pred.daysRemaining}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Recommended Daily Target</div>
                  <div className="text-xl font-bold text-white">{pred.recommendedDailyTarget}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations List */}
      {selectedTab !== 'predictions' && (
        <div className="space-y-3">
          {filteredRecommendations.map(rec => {
            const Icon = getTypeIcon(rec.type);
            return (
              <div
                key={rec.id}
                className={`bg-gray-800 rounded-xl p-5 border ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-gray-700 rounded-lg flex-shrink-0">
                    <Icon className="h-5 w-5 text-purple-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-base font-semibold text-white">{rec.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {rec.priority.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">
                            {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-sm font-semibold ${getConfidenceColor(rec.confidence)}`}>
                          {rec.confidence}%
                        </div>
                        <div className="text-xs text-gray-400">confidence</div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-300 leading-relaxed">{rec.description}</p>

                    {rec.prediction && (
                      <div className="mt-3 flex items-center space-x-2 text-sm">
                        <CheckCircleIcon className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 font-medium">{rec.prediction}</span>
                      </div>
                    )}

                    {rec.actionable && rec.action && (
                      <button
                        onClick={rec.action}
                        className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {rec.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredRecommendations.length === 0 && selectedTab !== 'predictions' && (
        <div className="text-center py-12">
          <BrainIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No recommendations available yet.</p>
          <p className="text-sm text-gray-500 mt-1">Keep writing to generate personalized insights!</p>
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;