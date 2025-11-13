// Dashboard Types and Data Models

export interface DashboardMetric {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  change?: {
    value: number;
    period: string;
    isPositive: boolean;
  };
  trend?: number[];
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  tension?: number;
  fill?: boolean;
  type?: 'line' | 'bar' | 'area' | 'scatter';
}

export interface ChartConfig {
  labels: string[];
  datasets: ChartDataset[];
  options?: any;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'insight' | 'roi' | 'custom';
  title: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  config: Record<string, any>;
  refreshInterval?: number;
  data?: any;
}

export interface DashboardLayout {
  id: string;
  name: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsTimeframe {
  start: Date;
  end: Date;
  label: string;
}

export interface WritingMetrics {
  totalWords: number;
  wordsToday: number;
  averageWordsPerDay: number;
  writingStreak: number;
  completedProjects: number;
  activeProjects: number;
  goalProgress: number;
  productivityScore: number;
}

export interface AIMetrics {
  totalSuggestions: number;
  acceptedSuggestions: number;
  acceptanceRate: number;
  aiUsageHours: number;
  costSavings: number;
  efficiencyGain: number;
  topModels: Array<{
    name: string;
    usage: number;
  }>;
}

export interface CollaborationMetrics {
  totalCollaborators: number;
  activeCollaborators: number;
  collaborationHours: number;
  comments: number;
  resolvedComments: number;
  averageResponseTime: number;
}

export interface BusinessMetrics {
  revenue: number;
  marketingROI: number;
  conversionRate: number;
  customerAcquisitionCost: number;
  lifetimeValue: number;
  churnRate: number;
}

export interface PredictiveInsight {
  id: string;
  type: 'completion' | 'trend' | 'recommendation' | 'alert';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions?: string[];
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface ROICalculation {
  timeSaved: number; // hours
  costSaved: number; // dollars
  productivityGain: number; // percentage
  qualityImprovement: number; // percentage
  breakdown: {
    aiAssistance: number;
    automation: number;
    collaboration: number;
    otherTools: number;
  };
  period: string;
}

export interface MarketIntelligence {
  genre: string;
  trendingTopics: string[];
  competitorAnalysis: {
    averagePrice: number;
    averageLength: number;
    topPerformers: string[];
  };
  recommendations: string[];
  marketSize: number;
  growthRate: number;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  errorRate: number;
  uptime: number;
  activeUsers: number;
  peakUsageTime: string;
}

export interface DashboardState {
  currentLayout: DashboardLayout;
  availableLayouts: DashboardLayout[];
  timeframe: AnalyticsTimeframe;
  isLoading: boolean;
  lastUpdated: Date;
  realtimeEnabled: boolean;
}

export interface AnalyticsFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  projects?: string[];
  collaborators?: string[];
  metrics?: string[];
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

export interface DashboardExport {
  format: 'pdf' | 'csv' | 'json' | 'excel';
  includeCharts: boolean;
  includeInsights: boolean;
  dateRange: AnalyticsTimeframe;
}

// Event types for real-time updates
export type DashboardEvent =
  | { type: 'METRIC_UPDATE'; payload: { metricId: string; value: any } }
  | { type: 'INSIGHT_GENERATED'; payload: PredictiveInsight }
  | { type: 'ALERT_TRIGGERED'; payload: { message: string; severity: 'info' | 'warning' | 'error' } }
  | { type: 'DATA_REFRESH'; payload: { timestamp: Date } };