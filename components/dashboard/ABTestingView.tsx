import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Variant {
  id: string;
  name: string;
  description: string;
  traffic: number;
  conversions: number;
  revenue: number;
  avgSessionDuration: number;
  bounceRate: number;
  color: string;
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  variants: Variant[];
  goal: string;
  confidence: number;
  winner?: string;
}

interface FunnelStep {
  name: string;
  variantA: number;
  variantB: number;
}

const ABTestingView: React.FC = () => {
  const [selectedExperiment, setSelectedExperiment] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'funnel'>('overview');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);

  // Mock experiments data
  const experiments: Experiment[] = useMemo(() => [
    {
      id: 'exp-001',
      name: 'New CTA Button Design',
      description: 'Testing blue vs green CTA button',
      status: 'running',
      startDate: '2025-11-01',
      variants: [
        {
          id: 'var-001-a',
          name: 'Control (Blue)',
          description: 'Original blue button',
          traffic: 5234,
          conversions: 387,
          revenue: 15480,
          avgSessionDuration: 245,
          bounceRate: 42.3,
          color: '#3b82f6'
        },
        {
          id: 'var-001-b',
          name: 'Variant (Green)',
          description: 'New green button',
          traffic: 5198,
          conversions: 425,
          revenue: 17000,
          avgSessionDuration: 268,
          bounceRate: 38.7,
          color: '#10b981'
        }
      ],
      goal: 'Increase conversion rate',
      confidence: 92.3,
      winner: 'var-001-b'
    },
    {
      id: 'exp-002',
      name: 'Pricing Page Layout',
      description: 'Testing vertical vs horizontal pricing tables',
      status: 'running',
      startDate: '2025-11-05',
      variants: [
        {
          id: 'var-002-a',
          name: 'Control (Vertical)',
          description: 'Original vertical layout',
          traffic: 3421,
          conversions: 198,
          revenue: 9900,
          avgSessionDuration: 312,
          bounceRate: 45.2,
          color: '#3b82f6'
        },
        {
          id: 'var-002-b',
          name: 'Variant (Horizontal)',
          description: 'New horizontal layout',
          traffic: 3398,
          conversions: 187,
          revenue: 9350,
          avgSessionDuration: 298,
          bounceRate: 47.8,
          color: '#10b981'
        }
      ],
      goal: 'Increase subscription rate',
      confidence: 67.8
    },
    {
      id: 'exp-003',
      name: 'Email Subject Lines',
      description: 'Testing personalized vs generic subject lines',
      status: 'completed',
      startDate: '2025-10-15',
      endDate: '2025-10-30',
      variants: [
        {
          id: 'var-003-a',
          name: 'Control (Generic)',
          description: 'Standard subject line',
          traffic: 12450,
          conversions: 1876,
          revenue: 37520,
          avgSessionDuration: 0,
          bounceRate: 0,
          color: '#3b82f6'
        },
        {
          id: 'var-003-b',
          name: 'Variant (Personalized)',
          description: 'Personalized with name',
          traffic: 12389,
          conversions: 2234,
          revenue: 44680,
          avgSessionDuration: 0,
          bounceRate: 0,
          color: '#10b981'
        }
      ],
      goal: 'Increase email open rate',
      confidence: 98.7,
      winner: 'var-003-b'
    }
  ], []);

  const currentExperiment = experiments.find(exp => exp.id === selectedExperiment) || experiments[0];

  // Error function approximation for p-value calculation
  const erf = (x: number): number => {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  };

  // Calculate statistical significance
  const calculateSignificance = (variantA: Variant, variantB: Variant): {
    pValue: number;
    significant: boolean;
    improvement: number;
  } => {
    const rateA = variantA.conversions / variantA.traffic;
    const rateB = variantB.conversions / variantB.traffic;
    
    const improvement = ((rateB - rateA) / rateA) * 100;
    
    // Simplified z-test calculation
    const pooledRate = (variantA.conversions + variantB.conversions) / (variantA.traffic + variantB.traffic);
    const seA = Math.sqrt(pooledRate * (1 - pooledRate) / variantA.traffic);
    const seB = Math.sqrt(pooledRate * (1 - pooledRate) / variantB.traffic);
    const seDiff = Math.sqrt(seA * seA + seB * seB);
    const zScore = Math.abs((rateA - rateB) / seDiff);
    
    // Approximate p-value using error function
    const pValue = 2 * (1 - 0.5 * (1 + erf(zScore / Math.sqrt(2))));
    const significant = pValue < (1 - confidenceLevel / 100);
    
    return { pValue, significant, improvement };
  };

  // Funnel data
  const funnelData: FunnelStep[] = [
    { name: 'Landing Page', variantA: 100, variantB: 100 },
    { name: 'Product Page', variantA: 72, variantB: 78 },
    { name: 'Cart', variantA: 45, variantB: 52 },
    { name: 'Checkout', variantA: 28, variantB: 35 },
    { name: 'Purchase', variantA: 18, variantB: 24 }
  ];

  // Time series data
  const timeSeriesData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 14; i++) {
      data.push({
        day: `Day ${i + 1}`,
        controlConversions: Math.floor(Math.random() * 50) + 20,
        variantConversions: Math.floor(Math.random() * 60) + 25,
        controlRevenue: Math.floor(Math.random() * 2000) + 1000,
        variantRevenue: Math.floor(Math.random() * 2500) + 1200
      });
    }
    return data;
  }, [selectedExperiment]);

  const significance = currentExperiment ? calculateSignificance(
    currentExperiment.variants[0],
    currentExperiment.variants[1]
  ) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600 dark:text-green-400';
    if (confidence >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            A/B Testing Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track experiments, analyze variants, and optimize conversions
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create New Experiment
        </button>
      </div>

      {/* Experiment Selector & Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Experiment
            </label>
            <select
              value={selectedExperiment}
              onChange={(e) => setSelectedExperiment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {experiments.map(exp => (
                <option key={exp.id} value={exp.id}>
                  {exp.name} ({exp.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Detailed
            </button>
            <button
              onClick={() => setViewMode('funnel')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'funnel'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Funnel
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confidence:
            </label>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={90}>90%</option>
              <option value={95}>95%</option>
              <option value={99}>99%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Experiment Details */}
      {currentExperiment && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentExperiment.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {currentExperiment.description}
              </p>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentExperiment.status)}`}>
                  {currentExperiment.status.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Started: {new Date(currentExperiment.startDate).toLocaleDateString()}
                </span>
                {currentExperiment.endDate && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Ended: {new Date(currentExperiment.endDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {currentExperiment.winner && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Winner
                </div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {currentExperiment.variants.find(v => v.id === currentExperiment.winner)?.name}
                </div>
              </div>
            )}
          </div>

          {/* Statistical Significance */}
          {significance && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Statistical Significance
                  </h3>
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Confidence: </span>
                      <span className={`text-xl font-bold ${getConfidenceColor(currentExperiment.confidence)}`}>
                        {currentExperiment.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Improvement: </span>
                      <span className={`text-xl font-bold ${significance.improvement > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {significance.improvement > 0 ? '+' : ''}{significance.improvement.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">P-Value: </span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {significance.pValue.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg ${significance.significant ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                  <div className="text-sm font-medium">
                    {significance.significant ? '✓ Statistically Significant' : '⚠ Not Yet Significant'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Mode */}
          {viewMode === 'overview' && (
            <div className="space-y-6">
              {/* Variants Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentExperiment.variants.map((variant, idx) => {
                  const conversionRate = (variant.conversions / variant.traffic * 100).toFixed(2);
                  const revenuePerVisit = (variant.revenue / variant.traffic).toFixed(2);
                  
                  return (
                    <div
                      key={variant.id}
                      className="border-2 rounded-lg p-6"
                      style={{ borderColor: variant.color }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {variant.name}
                        </h3>
                        {currentExperiment.winner === variant.id && (
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium">
                            Winner
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {variant.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Traffic</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {variant.traffic.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Conversions</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {variant.conversions.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Conversion Rate</span>
                          <span className="text-2xl font-bold" style={{ color: variant.color }}>
                            {conversionRate}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            ${variant.revenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Revenue/Visit</span>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            ${revenuePerVisit}
                          </span>
                        </div>
                        {variant.avgSessionDuration > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 dark:text-gray-400">Avg. Session</span>
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {Math.floor(variant.avgSessionDuration / 60)}m {variant.avgSessionDuration % 60}s
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 dark:text-gray-400">Bounce Rate</span>
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {variant.bounceRate.toFixed(1)}%
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison Chart */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Conversion Rate Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={currentExperiment.variants.map(v => ({
                    name: v.name,
                    conversionRate: (v.conversions / v.traffic * 100),
                    revenue: v.revenue / 1000
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="conversionRate" fill="#3b82f6" name="Conversion Rate (%)" />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue ($k)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Detailed Mode */}
          {viewMode === 'detailed' && (
            <div className="space-y-6">
              {/* Time Series Charts */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Conversions Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="controlConversions"
                      stroke={currentExperiment.variants[0].color}
                      strokeWidth={2}
                      name={currentExperiment.variants[0].name}
                    />
                    <Line
                      type="monotone"
                      dataKey="variantConversions"
                      stroke={currentExperiment.variants[1].color}
                      strokeWidth={2}
                      name={currentExperiment.variants[1].name}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Revenue Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="controlRevenue"
                      stroke={currentExperiment.variants[0].color}
                      strokeWidth={2}
                      name={`${currentExperiment.variants[0].name} Revenue`}
                    />
                    <Line
                      type="monotone"
                      dataKey="variantRevenue"
                      stroke={currentExperiment.variants[1].color}
                      strokeWidth={2}
                      name={`${currentExperiment.variants[1].name} Revenue`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Funnel Mode */}
          {viewMode === 'funnel' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Conversion Funnel Analysis
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={funnelData}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis type="category" dataKey="name" stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="variantA"
                      fill={currentExperiment.variants[0].color}
                      name={currentExperiment.variants[0].name}
                    />
                    <Bar
                      dataKey="variantB"
                      fill={currentExperiment.variants[1].color}
                      name={currentExperiment.variants[1].name}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Funnel Drop-off Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {funnelData.map((step, idx) => {
                  const dropoffA = idx > 0 ? ((funnelData[idx - 1].variantA - step.variantA) / funnelData[idx - 1].variantA * 100) : 0;
                  const dropoffB = idx > 0 ? ((funnelData[idx - 1].variantB - step.variantB) / funnelData[idx - 1].variantB * 100) : 0;
                  
                  return (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-center">
                        {step.name}
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Control</span>
                            <span className="text-lg font-bold" style={{ color: currentExperiment.variants[0].color }}>
                              {step.variantA}%
                            </span>
                          </div>
                          {idx > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              -{dropoffA.toFixed(1)}% drop
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Variant</span>
                            <span className="text-lg font-bold" style={{ color: currentExperiment.variants[1].color }}>
                              {step.variantB}%
                            </span>
                          </div>
                          {idx > 0 && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              -{dropoffB.toFixed(1)}% drop
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {currentExperiment.confidence >= 95 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Recommendations
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                {currentExperiment.winner && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                      <span>
                        <strong>Winner Identified:</strong> {currentExperiment.variants.find(v => v.id === currentExperiment.winner)?.name} shows statistically significant improvement
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                      <span>
                        <strong>Action:</strong> Roll out winning variant to 100% of traffic
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ</span>
                      <span>
                        Expected revenue lift: ${(significance && significance.improvement > 0 ? (currentExperiment.variants[0].revenue * significance.improvement / 100) : 0).toFixed(2)} per period
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}

          {currentExperiment.confidence < 80 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Recommendations
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">⚠</span>
                  <span>
                    <strong>Continue Testing:</strong> Sample size not yet sufficient for confident decision
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">⚠</span>
                  <span>
                    <strong>Estimated Time:</strong> Run experiment for {Math.ceil((95 - currentExperiment.confidence) / 5)} more days to reach 95% confidence
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* All Experiments List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          All Experiments
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Confidence</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Variants</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Winner</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map(exp => (
                <tr
                  key={exp.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => setSelectedExperiment(exp.id)}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 dark:text-white">{exp.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{exp.goal}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exp.status)}`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-lg font-bold ${getConfidenceColor(exp.confidence)}`}>
                      {exp.confidence.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {exp.variants.length} variants
                  </td>
                  <td className="py-3 px-4">
                    {exp.winner ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {exp.variants.find(v => v.id === exp.winner)?.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ABTestingView;