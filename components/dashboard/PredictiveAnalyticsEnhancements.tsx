import React, { useState } from 'react';
import {
  TrendingUpIcon,
  ActivityIcon,
  AlertTriangleIcon,
  BarChartIcon,
  ZapIcon,
  SettingsIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TargetIcon
} from '../icons/IconDefs';

interface PredictionModel {
  id: string;
  name: string;
  type: 'linear' | 'polynomial' | 'exponential' | 'arima' | 'prophet';
  accuracy: number;
  lastTrained: string;
  status: 'active' | 'training' | 'error';
  predictions: number;
}

interface Forecast {
  date: string;
  value: number;
  confidence: {
    lower: number;
    upper: number;
  };
  trend: 'up' | 'down' | 'stable';
}

interface Anomaly {
  id: string;
  timestamp: string;
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  variables: Record<string, number>;
  outcome: {
    metric: string;
    predicted: number;
    change: number;
  };
}

const PredictiveAnalyticsEnhancements: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'forecasting' | 'anomalies' | 'scenarios' | 'models'>('forecasting');
  const [selectedModel, setSelectedModel] = useState<string>('prophet');
  const [forecastHorizon, setForecastHorizon] = useState<number>(30);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  const [expandedAnomaly, setExpandedAnomaly] = useState<string | null>(null);

  // Mock data
  const models: PredictionModel[] = [
    {
      id: 'prophet',
      name: 'Facebook Prophet',
      type: 'prophet',
      accuracy: 94.2,
      lastTrained: '2 hours ago',
      status: 'active',
      predictions: 15420
    },
    {
      id: 'arima',
      name: 'ARIMA (3,1,2)',
      type: 'arima',
      accuracy: 91.8,
      lastTrained: '6 hours ago',
      status: 'active',
      predictions: 12350
    },
    {
      id: 'exponential',
      name: 'Exponential Smoothing',
      type: 'exponential',
      accuracy: 88.5,
      lastTrained: '1 day ago',
      status: 'training',
      predictions: 9800
    },
    {
      id: 'polynomial',
      name: 'Polynomial Regression',
      type: 'polynomial',
      accuracy: 85.3,
      lastTrained: '3 days ago',
      status: 'active',
      predictions: 7200
    }
  ];

  const forecasts: Forecast[] = [
    { date: 'Jan 15', value: 12450, confidence: { lower: 11800, upper: 13100 }, trend: 'up' },
    { date: 'Jan 22', value: 13200, confidence: { lower: 12400, upper: 14000 }, trend: 'up' },
    { date: 'Jan 29', value: 13800, confidence: { lower: 12800, upper: 14800 }, trend: 'up' },
    { date: 'Feb 5', value: 14500, confidence: { lower: 13300, upper: 15700 }, trend: 'up' },
    { date: 'Feb 12', value: 15100, confidence: { lower: 13700, upper: 16500 }, trend: 'up' },
    { date: 'Feb 19', value: 15600, confidence: { lower: 14000, upper: 17200 }, trend: 'stable' },
    { date: 'Feb 26', value: 15800, confidence: { lower: 14100, upper: 17500 }, trend: 'stable' }
  ];

  const anomalies: Anomaly[] = [
    {
      id: '1',
      timestamp: '2 hours ago',
      metric: 'Daily Active Users',
      value: 8200,
      expected: 12000,
      deviation: -31.7,
      severity: 'high',
      description: 'Significant drop in user activity during peak hours. Possible service disruption or external factor.'
    },
    {
      id: '2',
      timestamp: '5 hours ago',
      metric: 'AI Generation Requests',
      value: 2850,
      expected: 2200,
      deviation: 29.5,
      severity: 'medium',
      description: 'Unusual spike in AI requests. May indicate viral content or marketing campaign success.'
    },
    {
      id: '3',
      timestamp: '1 day ago',
      metric: 'Export Volume',
      value: 450,
      expected: 520,
      deviation: -13.5,
      severity: 'low',
      description: 'Minor decrease in exports. Within normal variation range.'
    },
    {
      id: '4',
      timestamp: '2 days ago',
      metric: 'Collaboration Sessions',
      value: 1820,
      expected: 1450,
      deviation: 25.5,
      severity: 'medium',
      description: 'Higher than expected collaboration activity. Positive trend worth investigating.'
    }
  ];

  const scenarios: Scenario[] = [
    {
      id: '1',
      name: 'Optimistic Growth',
      description: '20% increase in marketing spend, new AI features launched',
      variables: {
        marketingSpend: 1.2,
        featureCount: 5,
        userRetention: 0.85
      },
      outcome: {
        metric: 'Monthly Active Users',
        predicted: 45200,
        change: 32.5
      }
    },
    {
      id: '2',
      name: 'Conservative Baseline',
      description: 'Current trajectory with no major changes',
      variables: {
        marketingSpend: 1.0,
        featureCount: 0,
        userRetention: 0.78
      },
      outcome: {
        metric: 'Monthly Active Users',
        predicted: 35800,
        change: 5.2
      }
    },
    {
      id: '3',
      name: 'Competitive Pressure',
      description: 'Major competitor launches similar product',
      variables: {
        marketingSpend: 1.1,
        featureCount: 2,
        userRetention: 0.65
      },
      outcome: {
        metric: 'Monthly Active Users',
        predicted: 28400,
        change: -16.7
      }
    }
  ];

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'training': return 'bg-yellow-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingUpIcon className="w-4 h-4 text-red-400 transform rotate-180" />;
      case 'stable': return <ActivityIcon className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <ZapIcon className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold">Predictive Analytics</h2>
          <span className="px-2 py-1 bg-purple-600 text-xs rounded-full">
            ML-Powered
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-800 rounded transition-colors" title="Settings">
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded transition-colors" title="Info">
            <InfoIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setSelectedTab('forecasting')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'forecasting'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUpIcon className="w-4 h-4" />
            <span>Forecasting</span>
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('anomalies')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'anomalies'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <AlertTriangleIcon className="w-4 h-4" />
            <span>Anomalies ({anomalies.filter(a => a.severity === 'high').length})</span>
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('scenarios')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'scenarios'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TargetIcon className="w-4 h-4" />
            <span>Scenarios</span>
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('models')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            selectedTab === 'models'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BarChartIcon className="w-4 h-4" />
            <span>Models</span>
          </div>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedTab === 'forecasting' && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Prediction Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded focus:outline-none focus:border-purple-500"
                  >
                    {models.filter(m => m.status === 'active').map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.accuracy}% accuracy)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Forecast Horizon
                  </label>
                  <select
                    value={forecastHorizon}
                    onChange={(e) => setForecastHorizon(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded focus:outline-none focus:border-purple-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mt-7">
                    <input
                      type="checkbox"
                      checked={showConfidenceInterval}
                      onChange={(e) => setShowConfidenceInterval(e.target.checked)}
                      className="rounded bg-gray-900 border-gray-700"
                    />
                    Show confidence intervals
                  </label>
                </div>
              </div>
            </div>

            {/* Forecast Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Next Week</span>
                  <TrendingUpIcon className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold">13,200</div>
                <div className="text-xs text-green-400 mt-1">+8.3% predicted growth</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Next Month</span>
                  <TrendingUpIcon className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold">15,600</div>
                <div className="text-xs text-green-400 mt-1">+28.5% predicted growth</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Confidence</span>
                  <CheckCircleIcon className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold">94.2%</div>
                <div className="text-xs text-gray-400 mt-1">Model accuracy</div>
              </div>
            </div>

            {/* Forecast Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Predicted Value
                      </th>
                      {showConfidenceInterval && (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Lower Bound (95%)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Upper Bound (95%)
                          </th>
                        </>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {forecasts.map((forecast, index) => (
                      <tr key={index} className="hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3 text-sm">{forecast.date}</td>
                        <td className="px-4 py-3 text-sm font-medium">{forecast.value.toLocaleString()}</td>
                        {showConfidenceInterval && (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {forecast.confidence.lower.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {forecast.confidence.upper.toLocaleString()}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getTrendIcon(forecast.trend)}
                            <span className="text-sm capitalize">{forecast.trend}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'anomalies' && (
          <div className="space-y-3">
            {anomalies.map(anomaly => (
              <div
                key={anomaly.id}
                className={`rounded-lg border-l-4 ${
                  anomaly.severity === 'high' ? 'border-red-600 bg-red-900/20' :
                  anomaly.severity === 'medium' ? 'border-yellow-600 bg-yellow-900/20' :
                  'border-blue-600 bg-blue-900/20'
                } p-4`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <AlertTriangleIcon className={`w-5 h-5 flex-shrink-0 ${
                      anomaly.severity === 'high' ? 'text-red-400' :
                      anomaly.severity === 'medium' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`} />
                    <div>
                      <h3 className="font-medium">{anomaly.metric}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{anomaly.timestamp}</span>
                        <span className={`px-2 py-0.5 ${getSeverityColor(anomaly.severity)} rounded uppercase`}>
                          {anomaly.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedAnomaly(expandedAnomaly === anomaly.id ? null : anomaly.id)}
                    className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                  >
                    {expandedAnomaly === anomaly.id ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <div className="text-xs text-gray-400">Actual Value</div>
                    <div className="text-lg font-medium">{anomaly.value.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Expected Value</div>
                    <div className="text-lg font-medium text-gray-400">{anomaly.expected.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Deviation</div>
                    <div className={`text-lg font-medium ${
                      anomaly.deviation > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation}%
                    </div>
                  </div>
                </div>

                {expandedAnomaly === anomaly.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-300 mb-3">{anomaly.description}</p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded transition-colors">
                        Investigate
                      </button>
                      <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded transition-colors">
                        Mark as Expected
                      </button>
                      <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded transition-colors">
                        Create Alert Rule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'scenarios' && (
          <div className="space-y-4">
            {scenarios.map(scenario => (
              <div key={scenario.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-lg">{scenario.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{scenario.description}</p>
                  </div>
                  <div className={`text-2xl font-bold ${
                    scenario.outcome.change > 0 ? 'text-green-400' :
                    scenario.outcome.change < 0 ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {scenario.outcome.change > 0 ? '+' : ''}{scenario.outcome.change}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Input Variables</div>
                    <div className="space-y-2">
                      {Object.entries(scenario.variables).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-medium">{value}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-2">Predicted Outcome</div>
                    <div className="bg-gray-900 rounded p-3">
                      <div className="text-xs text-gray-400">{scenario.outcome.metric}</div>
                      <div className="text-2xl font-bold mt-1">{scenario.outcome.predicted.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors">
                  Run Detailed Simulation
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'models' && (
          <div className="space-y-3">
            {models.map(model => (
              <div key={model.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <BarChartIcon className="w-8 h-8 text-purple-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{model.name}</h3>
                        <span className={`px-2 py-0.5 ${getModelStatusColor(model.status)} text-xs rounded uppercase`}>
                          {model.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Type: {model.type} • Last trained: {model.lastTrained}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                    <SettingsIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Accuracy</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${model.accuracy}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{model.accuracy}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Predictions Made</div>
                    <div className="text-lg font-medium mt-1">{model.predictions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-sm rounded transition-colors">
                        Retrain
                      </button>
                      <button className="flex-1 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-sm rounded transition-colors">
                        Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button className="w-full p-4 border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-lg text-gray-400 hover:text-white transition-colors">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">+</span>
                <span>Train New Model</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveAnalyticsEnhancements;