import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, ChevronDownIcon, CheckIcon } from '../icons/IconDefs';

export interface DateRangeFilterProps {
  value: string;
  onChange: (range: string, customStart?: Date, customEnd?: Date) => void;
  className?: string;
}

interface DateRangeOption {
  id: string;
  label: string;
  description?: string;
}

const dateRangeOptions: DateRangeOption[] = [
  { id: 'today', label: 'Today', description: 'Current day' },
  { id: 'yesterday', label: 'Yesterday', description: 'Previous day' },
  { id: 'last7', label: 'Last 7 Days', description: 'Past week' },
  { id: 'last30', label: 'Last 30 Days', description: 'Past month' },
  { id: 'last90', label: 'Last 90 Days', description: 'Past quarter' },
  { id: 'thisWeek', label: 'This Week', description: 'Monday to today' },
  { id: 'lastWeek', label: 'Last Week', description: 'Previous week' },
  { id: 'thisMonth', label: 'This Month', description: 'Month to date' },
  { id: 'lastMonth', label: 'Last Month', description: 'Previous month' },
  { id: 'thisQuarter', label: 'This Quarter', description: 'Quarter to date' },
  { id: 'lastQuarter', label: 'Last Quarter', description: 'Previous quarter' },
  { id: 'thisYear', label: 'This Year', description: 'Year to date' },
  { id: 'lastYear', label: 'Last Year', description: 'Previous year' },
  { id: 'all', label: 'All Time', description: 'Complete history' },
  { id: 'custom', label: 'Custom Range', description: 'Choose specific dates' },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const selectedOption = dateRangeOptions.find(opt => opt.id === value) || dateRangeOptions[2];

  const handleSelect = (optionId: string) => {
    if (optionId === 'custom') {
      setShowCustomPicker(true);
    } else {
      onChange(optionId);
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange('custom', new Date(customStart), new Date(customEnd));
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const formatDateRange = (rangeId: string): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (rangeId) {
      case 'today':
        return today.toLocaleDateString();
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toLocaleDateString();
      case 'last7':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return `${weekAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`;
      case 'last30':
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return `${monthAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`;
      case 'custom':
        if (customStart && customEnd) {
          return `${new Date(customStart).toLocaleDateString()} - ${new Date(customEnd).toLocaleDateString()}`;
        }
        return 'Select dates';
      default:
        return selectedOption.label;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        <CalendarIcon className="w-4 h-4 text-gray-600" />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">{selectedOption.label}</span>
          <span className="text-xs text-gray-500">{formatDateRange(value)}</span>
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
          >
            {!showCustomPicker ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {dateRangeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelect(option.id)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        value === option.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                          )}
                        </div>
                        {value === option.id && (
                          <CheckIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Custom Date Range</h3>
                  <button
                    onClick={() => setShowCustomPicker(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Back
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      max={customEnd || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      min={customStart}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowCustomPicker(false);
                      setCustomStart('');
                      setCustomEnd('');
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomApply}
                    disabled={!customStart || !customEnd}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};