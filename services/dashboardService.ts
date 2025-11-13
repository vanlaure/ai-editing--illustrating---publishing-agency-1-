import { DrillDownData } from '../components/dashboard/DrillDownModal';
import {
  WritingMetrics,
  AIMetrics,
  CollaborationMetrics,
  BusinessMetrics,
  MarketIntelligence,
  ChartConfig,
  AnalyticsTimeframe,
  DashboardEvent,
} from '../types/dashboard';

// Event subscribers for real-time updates
type EventCallback = (event: DashboardEvent) => void;
const subscribers: EventCallback[] = [];

// Generate sample drill-down data based on metric type
export const generateDrillDownData = (metricType: string, metricValue: string | number): DrillDownData => {
  const now = new Date();
  const getLast30Days = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
  };

  const generateTimeSeries = (baseValue: number, variance: number) => {
    const dates = getLast30Days();
    return dates.map((date, i) => ({
      date,
      value: Math.round(baseValue + (Math.random() - 0.5) * variance + (i * baseValue * 0.01)),
      label: `Day ${i + 1}`
    }));
  };

  switch (metricType) {
    case 'words-written':
      return {
        title: 'Words Written Analysis',
        type: 'words',
        currentValue: metricValue,
        change: 12.5,
        period: 'Last 30 days',
        metrics: [
          { label: 'Daily Average', value: '4,850 words', change: 8.2 },
          { label: 'Peak Day', value: '12,450 words', change: 15.3 },
          { label: 'Writing Sessions', value: 127, change: 5.1 },
          { label: 'Avg Session Length', value: '45 min', change: -2.1 },
          { label: 'Most Productive Hour', value: '9-10 AM', trend: 'up' },
          { label: 'Completion Rate', value: '94%', change: 3.2 }
        ],
        timeSeries: generateTimeSeries(4850, 2000),
        segments: [
          { name: 'Fiction Writing', value: 85000, percentage: 58, change: 15.2 },
          { name: 'Blog Posts', value: 32000, percentage: 22, change: 8.5 },
          { name: 'Script Writing', value: 20000, percentage: 14, change: -3.2 },
          { name: 'Documentation', value: 9000, percentage: 6, change: 22.1 }
        ],
        insights: [
          'Your writing velocity increased by 12.5% this month, with particularly strong performance in the mornings.',
          'Fiction writing accounts for 58% of your output, showing consistent daily progress toward your novel goal.',
          'Consider scheduling more sessions during your peak productivity hours (9-10 AM) to maximize output.',
          'Blog post writing has grown 8.5% - your consistent publishing schedule is paying off.'
        ]
      };

    case 'time-spent':
      return {
        title: 'Time Spent Analysis',
        type: 'time',
        currentValue: metricValue,
        change: 8.3,
        period: 'Last 30 days',
        metrics: [
          { label: 'Active Days', value: 28, change: 12.0 },
          { label: 'Avg Session', value: '2h 15m', change: 5.5 },
          { label: 'Longest Session', value: '6h 30m' },
          { label: 'Focus Score', value: '87%', change: 4.2 },
          { label: 'Break Frequency', value: 'Every 52min', trend: 'up' },
          { label: 'Deep Work Hours', value: 89, change: 15.7 }
        ],
        timeSeries: generateTimeSeries(8.5, 3),
        segments: [
          { name: 'Writing', value: 156, percentage: 62, change: 10.5 },
          { name: 'Editing', value: 48, percentage: 19, change: 5.2 },
          { name: 'Research', value: 30, percentage: 12, change: -8.1 },
          { name: 'Planning', value: 18, percentage: 7, change: 15.0 }
        ],
        insights: [
          'Your focus score of 87% is excellent - you maintain concentration well during writing sessions.',
          'Deep work hours increased by 15.7% this month, indicating improved productivity habits.',
          'Consider increasing research time allocation - it dropped 8.1% but is crucial for quality content.',
          'Your session length sweet spot appears to be around 2 hours - longer sessions show diminishing returns.'
        ]
      };

    case 'ai-usage':
      return {
        title: 'AI Usage Analytics',
        type: 'ai-usage',
        currentValue: metricValue,
        change: 28.4,
        period: 'Last 30 days',
        metrics: [
          { label: 'Total Requests', value: '2,847', change: 32.1 },
          { label: 'Avg Per Day', value: 95, change: 28.4 },
          { label: 'Success Rate', value: '98.2%', change: 1.5 },
          { label: 'Tokens Used', value: '1.2M', change: 35.7 },
          { label: 'Cost Savings', value: '$247', change: 18.9 },
          { label: 'Time Saved', value: '42 hours', change: 22.3 }
        ],
        timeSeries: generateTimeSeries(95, 40),
        segments: [
          { name: 'Content Generation', value: 1280, percentage: 45, change: 35.2 },
          { name: 'Editing Assistance', value: 740, percentage: 26, change: 22.1 },
          { name: 'Research & Summaries', value: 512, percentage: 18, change: 28.7 },
          { name: 'Grammar & Style', value: 315, percentage: 11, change: 15.4 }
        ],
        insights: [
          'AI usage grew 28.4% this month - you\'re effectively leveraging AI tools to boost productivity.',
          'Content generation is your primary use case (45%), helping you overcome writer\'s block.',
          'ROI is excellent: $247 in time savings versus modest API costs.',
          'Consider exploring AI for more research tasks - it could further accelerate your workflow.'
        ]
      };

    case 'collaboration':
      return {
        title: 'Collaboration Analytics',
        type: 'collaboration',
        currentValue: metricValue,
        change: 15.2,
        period: 'Last 30 days',
        metrics: [
          { label: 'Active Collaborators', value: 8, change: 33.3 },
          { label: 'Comments', value: 156, change: 18.2 },
          { label: 'Reviews Completed', value: 23, change: 12.0 },
          { label: 'Avg Response Time', value: '4.2 hours', change: -15.5 },
          { label: 'Merge Rate', value: '92%', change: 5.1 },
          { label: 'Feedback Quality', value: '4.6/5', trend: 'up' }
        ],
        timeSeries: generateTimeSeries(12, 6),
        segments: [
          { name: 'Editor Reviews', value: 89, percentage: 42, change: 22.1 },
          { name: 'Peer Feedback', value: 67, percentage: 32, change: 8.5 },
          { name: 'Client Comments', value: 38, percentage: 18, change: 35.7 },
          { name: 'Internal Notes', value: 18, percentage: 8, change: -5.3 }
        ],
        insights: [
          'Collaboration activity up 15.2% - your team is engaged and providing valuable feedback.',
          'Response time improved by 15.5% - faster turnaround is accelerating project completion.',
          'Client engagement increased 35.7% - strong sign of project alignment and satisfaction.',
          'Consider setting up weekly sync sessions to maintain momentum and address bottlenecks early.'
        ]
      };

    case 'productivity':
      return {
        title: 'Productivity Score Analysis',
        type: 'productivity',
        currentValue: metricValue,
        change: 6.8,
        period: 'Last 30 days',
        metrics: [
          { label: 'Efficiency Index', value: '94%', change: 5.6 },
          { label: 'Goals Completed', value: 18, change: 12.5 },
          { label: 'Task Completion', value: '89%', change: 7.2 },
          { label: 'Quality Score', value: '4.7/5', change: 4.3 },
          { label: 'Consistency', value: '92%', trend: 'up' },
          { label: 'Output per Hour', value: '1,150 words', change: 8.9 }
        ],
        timeSeries: generateTimeSeries(87, 10),
        segments: [
          { name: 'Writing Tasks', value: 145, percentage: 48, change: 8.5 },
          { name: 'Editing Tasks', value: 87, percentage: 29, change: 5.2 },
          { name: 'Research Tasks', value: 45, percentage: 15, change: -3.1 },
          { name: 'Admin Tasks', value: 24, percentage: 8, change: 15.0 }
        ],
        insights: [
          'Productivity score increased 6.8% through improved focus and workflow optimization.',
          'You completed 18 goals this month - 12.5% more than last month, showing strong momentum.',
          'Quality score of 4.7/5 indicates your output maintains high standards despite increased velocity.',
          'Research task completion dipped slightly - consider allocating dedicated research blocks.'
        ]
      };

    case 'revenue':
      return {
        title: 'Revenue Analytics',
        type: 'revenue',
        currentValue: metricValue,
        change: 22.3,
        period: 'Last 30 days',
        metrics: [
          { label: 'Total Projects', value: 12, change: 20.0 },
          { label: 'Avg Project Value', value: '$3,250', change: 8.3 },
          { label: 'Recurring Revenue', value: '$8,500', change: 15.7 },
          { label: 'New Clients', value: 4, change: 33.3 },
          { label: 'Client Retention', value: '94%', trend: 'up' },
          { label: 'Profit Margin', value: '68%', change: 5.2 }
        ],
        timeSeries: generateTimeSeries(1300, 500),
        segments: [
          { name: 'Book Sales', value: 18500, percentage: 47, change: 28.5 },
          { name: 'Freelance Writing', value: 12000, percentage: 31, change: 15.2 },
          { name: 'Consulting', value: 5500, percentage: 14, change: 35.7 },
          { name: 'Courses', value: 3000, percentage: 8, change: 10.0 }
        ],
        insights: [
          'Revenue grew 22.3% this month, driven by strong book sales and new consulting contracts.',
          'Book sales increased 28.5% - your marketing efforts and content quality are paying off.',
          'Consulting revenue jumped 35.7% - consider expanding this high-margin service line.',
          'Client retention at 94% is excellent - your quality and professionalism are building long-term relationships.'
        ]
      };

    default:
      return {
        title: `${metricType} Details`,
        type: 'generic',
        currentValue: metricValue,
        change: 10.5,
        period: 'Last 30 days',
        metrics: [
          { label: 'Average', value: typeof metricValue === 'number' ? Math.round(metricValue * 0.8) : 'N/A' },
          { label: 'Peak', value: typeof metricValue === 'number' ? Math.round(metricValue * 1.5) : 'N/A' },
          { label: 'Trend', value: 'Increasing', trend: 'up' }
        ],
        timeSeries: generateTimeSeries(typeof metricValue === 'number' ? metricValue : 100, 30),
        insights: [
          `Your ${metricType} has shown consistent growth over the past 30 days.`,
          'Continue your current trajectory to maintain this positive trend.'
        ]
      };
  }
};

// Dashboard Service Object
export const dashboardService = {
  // Get writing metrics for a given timeframe
  async getWritingMetrics(timeframe: AnalyticsTimeframe): Promise<WritingMetrics> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      totalWords: 145500,
      wordsToday: 2850,
      averageWordsPerDay: 4850,
      writingStreak: 12,
      completedProjects: 3,
      activeProjects: 5,
      goalProgress: 68,
      productivityScore: 87,
    };
  },

  // Get AI metrics for a given timeframe
  async getAIMetrics(timeframe: AnalyticsTimeframe): Promise<AIMetrics> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      totalSuggestions: 3425,
      acceptedSuggestions: 2847,
      acceptanceRate: 83,
      aiUsageHours: 42,
      costSavings: 247,
      efficiencyGain: 28.4,
      topModels: [
        { name: 'GPT-4', usage: 45 },
        { name: 'Claude', usage: 32 },
        { name: 'Gemini', usage: 23 },
      ],
    };
  },

  // Get collaboration metrics for a given timeframe
  async getCollaborationMetrics(timeframe: AnalyticsTimeframe): Promise<CollaborationMetrics> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      totalCollaborators: 12,
      activeCollaborators: 8,
      collaborationHours: 156,
      comments: 213,
      resolvedComments: 189,
      averageResponseTime: 4.2,
    };
  },

  // Get chart data for visualizations
  async getChartData(category: string, timeframe: AnalyticsTimeframe): Promise<ChartConfig> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    if (category === 'writing') {
      return {
        labels,
        datasets: [
          {
            label: 'Words Written',
            data: [4200, 5100, 4800, 6200, 5500, 3800, 4500],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          label: 'Activity',
          data: [12, 19, 15, 25, 22, 18, 20],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  },

  // Get market intelligence data
  async getMarketIntelligence(genre: string): Promise<MarketIntelligence> {
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      genre,
      trendingTopics: [
        'AI-Assisted Writing',
        'Interactive Fiction',
        'Climate Fiction',
        'Mental Health Narratives',
        'Diverse Voices',
      ],
      competitorAnalysis: {
        averagePrice: 14.99,
        averageLength: 85000,
        topPerformers: ['Author A', 'Author B', 'Author C'],
      },
      recommendations: [
        'Focus on character-driven narratives - trending 25% in your genre',
        'Consider serialized content - 40% higher engagement',
        'Optimize for audiobook format - growing market segment',
      ],
      marketSize: 1200000,
      growthRate: 12.5,
    };
  },

  // Get business metrics
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    await new Promise(resolve => setTimeout(resolve, 350));

    return {
      revenue: 39000,
      marketingROI: 3.8,
      conversionRate: 4.2,
      customerAcquisitionCost: 45,
      lifetimeValue: 320,
      churnRate: 2.1,
    };
  },

  // Subscribe to real-time dashboard events
  subscribe(callback: EventCallback): () => void {
    subscribers.push(callback);

    // Simulate periodic data refresh events
    const interval = setInterval(() => {
      const event: DashboardEvent = {
        type: 'DATA_REFRESH',
        payload: { timestamp: new Date() },
      };
      subscribers.forEach(cb => cb(event));
    }, 60000); // Every 60 seconds

    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
      clearInterval(interval);
    };
  },

  // Emit event to all subscribers
  emit(event: DashboardEvent): void {
    subscribers.forEach(callback => callback(event));
  },
};

// Export types for use in components
export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  drillDownType?: string;
}

export const sampleMetrics: DashboardMetric[] = [
  {
    id: 'words-written',
    title: 'Words Written',
    value: '145,500',
    change: { value: 12.5, period: 'last month', isPositive: true },
    trend: 'up',
    color: 'primary',
    drillDownType: 'words-written'
  },
  {
    id: 'time-spent',
    title: 'Time Spent Writing',
    value: '254h',
    change: { value: 8.3, period: 'last month', isPositive: true },
    trend: 'up',
    color: 'success',
    drillDownType: 'time-spent'
  },
  {
    id: 'ai-usage',
    title: 'AI Requests',
    value: '2,847',
    change: { value: 28.4, period: 'last month', isPositive: true },
    trend: 'up',
    color: 'primary',
    drillDownType: 'ai-usage'
  },
  {
    id: 'collaboration',
    title: 'Collaboration Activity',
    value: 213,
    change: { value: 15.2, period: 'last month', isPositive: true },
    trend: 'up',
    color: 'primary',
    drillDownType: 'collaboration'
  },
  {
    id: 'productivity',
    title: 'Productivity Score',
    value: '87%',
    change: { value: 6.8, period: 'last month', isPositive: true },
    trend: 'up',
    color: 'success',
    drillDownType: 'productivity'
  },
  {
    id: 'revenue',
    title: 'Revenue',
    value: '$39,000',
    change: { value: 22.3, period: 'last month', isPositive: true },
    trend: 'up',
    color: 'success',
    drillDownType: 'revenue'
  }
];