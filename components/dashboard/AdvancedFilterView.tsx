import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/dashboardService';
import type { WritingMetrics, AIMetrics, CollaborationMetrics } from '../../types/dashboard';

type FilterCategory = 'writing' | 'ai' | 'collaboration' | 'all';
type FilterOperator = 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'between';
type FilterLogic = 'AND' | 'OR';

interface FilterRule {
  id: string;
  category: FilterCategory;
  field: string;
  operator: FilterOperator;
  value: any;
  secondValue?: any; // For 'between' operator
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  rules: FilterRule[];
  logic: FilterLogic;
}

interface SearchResult {
  category: string;
  field: string;
  value: any;
  relevance: number;
}

const PREDEFINED_PRESETS: FilterPreset[] = [
  {
    id: 'high-performers',
    name: 'High Performers',
    description: 'Projects with above-average productivity',
    rules: [
      {
        id: '1',
        category: 'writing',
        field: 'productivityScore',
        operator: 'greaterThan',
        value: 80
      }
    ],
    logic: 'AND'
  },
  {
    id: 'ai-intensive',
    name: 'AI Intensive',
    description: 'High AI usage and acceptance',
    rules: [
      {
        id: '1',
        category: 'ai',
        field: 'acceptanceRate',
        operator: 'greaterThan',
        value: 75
      },
      {
        id: '2',
        category: 'ai',
        field: 'totalSuggestions',
        operator: 'greaterThan',
        value: 100
      }
    ],
    logic: 'AND'
  },
  {
    id: 'collaborative',
    name: 'Highly Collaborative',
    description: 'Active collaboration and communication',
    rules: [
      {
        id: '1',
        category: 'collaboration',
        field: 'activeCollaborators',
        operator: 'greaterThan',
        value: 3
      }
    ],
    logic: 'AND'
  }
];

const AVAILABLE_FIELDS: Record<FilterCategory, Array<{ value: string; label: string; type: 'number' | 'string' }>> = {
  writing: [
    { value: 'totalWords', label: 'Total Words', type: 'number' },
    { value: 'wordsToday', label: 'Words Today', type: 'number' },
    { value: 'averageWordsPerDay', label: 'Average Words/Day', type: 'number' },
    { value: 'productivityScore', label: 'Productivity Score', type: 'number' },
    { value: 'writingStreak', label: 'Writing Streak', type: 'number' }
  ],
  ai: [
    { value: 'totalSuggestions', label: 'Total Suggestions', type: 'number' },
    { value: 'acceptedSuggestions', label: 'Accepted Suggestions', type: 'number' },
    { value: 'acceptanceRate', label: 'Acceptance Rate', type: 'number' },
    { value: 'aiUsageHours', label: 'AI Usage Hours', type: 'number' },
    { value: 'costSavings', label: 'Cost Savings', type: 'number' }
  ],
  collaboration: [
    { value: 'activeCollaborators', label: 'Active Collaborators', type: 'number' },
    { value: 'comments', label: 'Comments', type: 'number' },
    { value: 'resolvedComments', label: 'Resolved Comments', type: 'number' },
    { value: 'collaborationHours', label: 'Collaboration Hours', type: 'number' }
  ],
  all: []
};

export const AdvancedFilterView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [filterLogic, setFilterLogic] = useState<FilterLogic>('AND');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (filterRules.length > 0) {
      applyFilters();
    }
  }, [filterRules, filterLogic]);

  const performSearch = async () => {
    setLoading(true);
    try {
      // Simulate search across all metrics
      const results: SearchResult[] = [];
      const query = searchQuery.toLowerCase();

      // Search in field names
      Object.entries(AVAILABLE_FIELDS).forEach(([category, fields]) => {
        if (category === 'all') return;
        fields.forEach(field => {
          if (field.label.toLowerCase().includes(query) || field.value.toLowerCase().includes(query)) {
            results.push({
              category,
              field: field.label,
              value: field.value,
              relevance: field.label.toLowerCase().startsWith(query) ? 1 : 0.5
            });
          }
        });
      });

      setSearchResults(results.sort((a, b) => b.relevance - a.relevance));
      
      // Add to search history
      if (!searchHistory.includes(searchQuery)) {
        setSearchHistory([searchQuery, ...searchHistory.slice(0, 4)]);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      // This would normally fetch data from the backend with filters applied
      // For now, we'll simulate filtered results
      const results = filterRules.map(rule => ({
        category: rule.category,
        field: rule.field,
        operator: rule.operator,
        value: rule.value,
        matched: true
      }));
      
      setFilteredData(results);
    } finally {
      setLoading(false);
    }
  };

  const addFilterRule = () => {
    const newRule: FilterRule = {
      id: Date.now().toString(),
      category: 'writing',
      field: 'totalWords',
      operator: 'greaterThan',
      value: 0
    };
    setFilterRules([...filterRules, newRule]);
    setActivePreset(null);
  };

  const removeFilterRule = (id: string) => {
    setFilterRules(filterRules.filter(rule => rule.id !== id));
  };

  const updateFilterRule = (id: string, updates: Partial<FilterRule>) => {
    setFilterRules(filterRules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
    setActivePreset(null);
  };

  const loadPreset = (preset: FilterPreset) => {
    setFilterRules(preset.rules);
    setFilterLogic(preset.logic);
    setActivePreset(preset.id);
  };

  const saveAsPreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: newPresetName,
      description: newPresetDescription,
      rules: filterRules,
      logic: filterLogic
    };

    setCustomPresets([...customPresets, newPreset]);
    setNewPresetName('');
    setNewPresetDescription('');
    setShowPresetModal(false);
    setActivePreset(newPreset.id);
  };

  const deletePreset = (id: string) => {
    setCustomPresets(customPresets.filter(p => p.id !== id));
    if (activePreset === id) {
      setActivePreset(null);
    }
  };

  const clearFilters = () => {
    setFilterRules([]);
    setActivePreset(null);
    setSearchQuery('');
    setSearchResults([]);
    setFilteredData([]);
  };

  const exportFilteredData = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filtered-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getOperatorOptions = (fieldType: 'number' | 'string'): FilterOperator[] => {
    if (fieldType === 'number') {
      return ['equals', 'notEquals', 'greaterThan', 'lessThan', 'between'];
    }
    return ['equals', 'notEquals', 'contains'];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Filtering & Search</h2>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear All
          </button>
          <button
            onClick={() => setShowPresetModal(true)}
            disabled={filterRules.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save as Preset
          </button>
          <button
            onClick={exportFilteredData}
            disabled={filteredData.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Results
          </button>
        </div>
      </div>

      {/* Global Search */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Global Search
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search metrics, fields, or values..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500"
        />
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Results</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  onClick={() => {
                    const newRule: FilterRule = {
                      id: Date.now().toString(),
                      category: result.category as FilterCategory,
                      field: result.value,
                      operator: 'greaterThan',
                      value: 0
                    };
                    setFilterRules([...filterRules, newRule]);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 dark:text-white">{result.field}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{result.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && searchQuery === '' && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((query, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(query)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Presets */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Filter Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...PREDEFINED_PRESETS, ...customPresets].map((preset) => (
            <div
              key={preset.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                activePreset === preset.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => loadPreset(preset)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{preset.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{preset.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{preset.rules.length} rule(s)</p>
                </div>
                {!PREDEFINED_PRESETS.find(p => p.id === preset.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePreset(preset.id);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Rules */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Rules</h3>
          {filterRules.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Logic:</span>
              <select
                value={filterLogic}
                onChange={(e) => setFilterLogic(e.target.value as FilterLogic)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {filterRules.map((rule, index) => {
            const fieldOptions = AVAILABLE_FIELDS[rule.category] || [];
            const currentField = fieldOptions.find(f => f.value === rule.field);
            const operatorOptions = getOperatorOptions(currentField?.type || 'number');

            return (
              <div key={rule.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  {index > 0 && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                      {filterLogic}
                    </span>
                  )}
                  
                  <select
                    value={rule.category}
                    onChange={(e) => {
                      const newCategory = e.target.value as FilterCategory;
                      const newFields = AVAILABLE_FIELDS[newCategory];
                      updateFilterRule(rule.id, {
                        category: newCategory,
                        field: newFields[0]?.value || ''
                      });
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="writing">Writing</option>
                    <option value="ai">AI</option>
                    <option value="collaboration">Collaboration</option>
                  </select>

                  <select
                    value={rule.field}
                    onChange={(e) => updateFilterRule(rule.id, { field: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  >
                    {fieldOptions.map(field => (
                      <option key={field.value} value={field.value}>{field.label}</option>
                    ))}
                  </select>

                  <select
                    value={rule.operator}
                    onChange={(e) => updateFilterRule(rule.id, { operator: e.target.value as FilterOperator })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  >
                    {operatorOptions.map(op => (
                      <option key={op} value={op}>
                        {op === 'greaterThan' ? '>' : op === 'lessThan' ? '<' : op === 'notEquals' ? '!=' : op === 'equals' ? '=' : op === 'between' ? 'between' : 'contains'}
                      </option>
                    ))}
                  </select>

                  <input
                    type={currentField?.type === 'number' ? 'number' : 'text'}
                    value={rule.value}
                    onChange={(e) => updateFilterRule(rule.id, { value: currentField?.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm w-24"
                  />

                  {rule.operator === 'between' && (
                    <>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">and</span>
                      <input
                        type={currentField?.type === 'number' ? 'number' : 'text'}
                        value={rule.secondValue || ''}
                        onChange={(e) => updateFilterRule(rule.id, { secondValue: currentField?.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm w-24"
                      />
                    </>
                  )}

                  <button
                    onClick={() => removeFilterRule(rule.id)}
                    className="ml-auto p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={addFilterRule}
          className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          + Add Filter Rule
        </button>
      </div>

      {/* Results Summary */}
      {filteredData.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                {filteredData.length} Result(s) Found
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Showing data matching {filterRules.length} filter rule(s)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Save Filter Preset</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="My Custom Filter"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newPresetDescription}
                  onChange={(e) => setNewPresetDescription(e.target.value)}
                  placeholder="Brief description of this filter preset..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowPresetModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveAsPreset}
                disabled={!newPresetName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};