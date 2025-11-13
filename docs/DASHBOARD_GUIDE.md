# Analytics Dashboard Guide

## Overview

The Analytics Dashboard is a comprehensive business intelligence platform that provides real-time insights into writing progress, AI usage, collaboration activity, and business performance.

## Features

### 1. Real-time Metrics Engine
- **Live Data Updates**: WebSocket connections with polling fallback
- **Auto-refresh**: Configurable refresh intervals (default: 30 seconds)
- **Event-driven Architecture**: Subscribe to specific metric updates
- **Data Caching**: 5-minute cache validity for performance

### 2. Dashboard Views

#### Overview Tab
- Key performance metrics at a glance
- Writing progress tracking
- AI usage statistics
- Collaboration activity
- Quick action shortcuts

#### Analytics Tab
- Detailed writing metrics (words per session, session duration, consistency)
- AI performance metrics (generation time, cost efficiency, quality ratings)
- Collaboration metrics (active users, real-time edits, comments)
- Interactive charts with multiple visualization types

#### AI Insights Tab
- **Predictive Completion**: ML-powered project completion estimates
- **Efficiency Insights**: AI performance recommendations
- **Productivity Trends**: Pattern recognition and suggestions
- **Writing Streaks**: Consistency tracking and motivation

#### Business Intelligence Tab
- **Market Overview**: Genre-specific insights and trends
- **Trending Topics**: Current market opportunities
- **Competitor Analysis**: Comparative performance metrics
- **Key Metrics**: Conversion rates, ROI, CAC, LTV
- **Strategic Recommendations**: AI-powered business advice

#### ROI Calculator Tab
- **Cost Savings**: Manual vs AI-assisted cost comparison
- **Time Saved**: Productivity gain calculations
- **Productivity Gains**: Efficiency improvements
- **Quality Improvements**: Output quality metrics
- **Detailed Breakdown**: Granular cost analysis

### 3. Interactive Charts

Powered by Chart.js with support for:
- **Line Charts**: Trend analysis over time
- **Bar Charts**: Comparative metrics
- **Doughnut Charts**: Distribution and composition
- **Radar Charts**: Multi-dimensional performance

## Technical Architecture

### Components

```
components/dashboard/
├── AnalyticsDashboardView.tsx    # Main dashboard container
├── ROICalculator.tsx              # ROI analysis component
├── PredictiveInsightsPanel.tsx   # ML-powered insights
├── BusinessIntelligencePanel.tsx # Market intelligence
├── InteractiveChart.tsx          # Reusable chart component
├── DashboardGrid.tsx             # Overview grid layout
├── MetricsCard.tsx               # Individual metric cards
└── WritingProgressChart.tsx      # Progress visualization
```

### Services

```
services/
└── dashboardService.ts           # Core dashboard service
    ├── fetchWritingMetrics()
    ├── fetchAIMetrics()
    ├── fetchCollaborationMetrics()
    ├── fetchBusinessMetrics()
    ├── fetchMarketIntelligence()
    ├── generatePredictiveInsights()
    ├── calculateROI()
    ├── connectRealtime()
    └── subscribe(event, callback)
```

### Data Models

```typescript
types/dashboard.ts
├── DashboardMetric          # Base metric interface
├── WritingMetrics          # Writing-related data
├── AIMetrics              # AI usage statistics
├── CollaborationMetrics   # Team activity data
├── BusinessMetrics        # Business performance
├── PredictiveInsight      # ML predictions
├── ROICalculation         # Financial analysis
├── MarketIntelligence     # Market data
└── PerformanceMetrics     # System performance
```

## Usage

### Accessing the Dashboard

Navigate to the Statistics view in the main application to access the full analytics dashboard.

### Real-time Updates

The dashboard automatically connects to the real-time metrics service on load:

```typescript
// Automatic in AnalyticsDashboardView component
useEffect(() => {
  dashboardService.connectRealtime();
  return () => dashboardService.disconnect();
}, []);
```

### Subscribing to Events

```typescript
import { dashboardService } from '../services/dashboardService';

// Subscribe to specific metrics
dashboardService.subscribe('writing_metrics', (metrics) => {
  console.log('Updated writing metrics:', metrics);
});

dashboardService.subscribe('ai_usage', (usage) => {
  console.log('AI usage update:', usage);
});
```

### Custom Chart Integration

```typescript
import { InteractiveChart } from './dashboard/InteractiveChart';

<InteractiveChart
  title="Custom Metrics"
  type="line"
  dataKey="custom_metric"
  height={300}
/>
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# WebSocket endpoint for real-time updates
VITE_WS_ENDPOINT=ws://localhost:8080

# Analytics API endpoint
VITE_ANALYTICS_ENDPOINT=http://localhost:3000/api/analytics

# Studio identifier
VITE_STUDIO_ID=your-studio-id
```

### Customization

#### Refresh Intervals

Modify refresh intervals in `dashboardService.ts`:

```typescript
private readonly REFRESH_INTERVAL = 30000; // 30 seconds
private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

#### Chart Colors

Customize chart colors in `InteractiveChart.tsx`:

```typescript
const backgroundColors = [
  'rgba(59, 130, 246, 0.5)',  // Blue
  'rgba(16, 185, 129, 0.5)',  // Green
  'rgba(251, 146, 60, 0.5)',  // Orange
  // Add more colors
];
```

## API Integration

### Backend Requirements

The dashboard expects the following API endpoints:

```typescript
// Writing Metrics
GET /api/analytics/writing
Response: WritingMetrics

// AI Metrics  
GET /api/analytics/ai
Response: AIMetrics

// Collaboration Metrics
GET /api/analytics/collaboration
Response: CollaborationMetrics

// Business Metrics
GET /api/analytics/business
Response: BusinessMetrics

// Market Intelligence
GET /api/analytics/market
Response: MarketIntelligence

// Predictive Insights
GET /api/analytics/insights
Response: PredictiveInsight[]

// ROI Calculation
GET /api/analytics/roi
Response: ROICalculation
```

### WebSocket Events

```typescript
// Client -> Server
socket.emit('subscribe', { metrics: ['writing', 'ai', 'collaboration'] });

// Server -> Client
socket.on('metric_update', (data: DashboardEvent) => {
  // Handle real-time update
});
```

## Performance Optimization

### Data Caching
- Metrics cached for 5 minutes
- Automatic cache invalidation on updates
- Reduced API calls for better performance

### Lazy Loading
- Components loaded on demand
- Charts rendered only when visible
- Optimized bundle splitting

### Real-time Connection
- WebSocket preferred for low latency
- Automatic fallback to polling
- Reconnection with exponential backoff

## Troubleshooting

### Dashboard Not Loading

1. Check environment variables are set correctly
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Ensure backend services are running

### Real-time Updates Not Working

1. Verify WebSocket endpoint is correct
2. Check firewall/proxy settings
3. Fallback to polling mode automatically
4. Review network tab for connection issues

### Charts Not Rendering

1. Ensure Chart.js is installed: `npm install chart.js react-chartjs-2`
2. Check data format matches expected schema
3. Verify chart type is supported
4. Review browser console for Canvas errors

## Best Practices

1. **Monitor Performance**: Track dashboard load times and optimize as needed
2. **Cache Wisely**: Balance freshness with performance
3. **Handle Errors Gracefully**: Implement proper error boundaries
4. **Test Real-time**: Verify WebSocket connections in production
5. **Optimize Queries**: Use appropriate time ranges for metrics
6. **Document Changes**: Keep this guide updated with modifications

## Future Enhancements

- [ ] Exportable reports (PDF, CSV)
- [ ] Custom dashboard layouts with drag-and-drop
- [ ] Advanced filtering and search
- [ ] Comparative analysis across time periods
- [ ] Integration with external analytics platforms
- [ ] Mobile-optimized responsive design
- [ ] A/B testing insights
- [ ] Automated alert system

## Support

For issues or questions:
- Check the troubleshooting section above
- Review component source code
- Contact development team

---

Last Updated: 2025-11-12
Version: 1.0.0