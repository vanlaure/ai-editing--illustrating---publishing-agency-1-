import React, { Suspense, lazy, memo, useCallback, useMemo } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';

// Lazy-loaded dashboard components for code splitting
const AnalyticsDashboardView = lazy(() =>
  import('./AnalyticsDashboardView').then(m => ({ default: m.AnalyticsDashboardView }))
);
const BusinessIntelligencePanel = lazy(() =>
  import('./BusinessIntelligencePanel').then(m => ({ default: m.BusinessIntelligencePanel }))
);
const PredictiveInsightsPanel = lazy(() =>
  import('./PredictiveInsightsPanel').then(m => ({ default: m.PredictiveInsightsPanel }))
);
const ROICalculator = lazy(() =>
  import('./ROICalculator').then(m => ({ default: m.ROICalculator }))
);
const VoiceCommandDashboard = lazy(() =>
  import('./VoiceCommandDashboard').then(m => ({ default: m.default }))
);

// Memoized wrapper components to prevent unnecessary re-renders
const MemoizedAnalyticsDashboard = memo(AnalyticsDashboardView);
const MemoizedBusinessIntelligence = memo(BusinessIntelligencePanel);
const MemoizedPredictiveInsights = memo(PredictiveInsightsPanel);
const MemoizedROICalculator = memo(ROICalculator);
const MemoizedVoiceCommands = memo(VoiceCommandDashboard);

interface DashboardSection {
  id: string;
  component: React.ComponentType<any>;
  priority: 'high' | 'medium' | 'low';
  preload?: boolean;
}

interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableMemoization: boolean;
  enableCodeSplitting: boolean;
  enableCaching: boolean;
  enableVirtualization: boolean;
  enableWebWorkers: boolean;
  cacheTimeout: number; // milliseconds
  preloadComponents: boolean;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableLazyLoading: true,
  enableMemoization: true,
  enableCodeSplitting: true,
  enableCaching: true,
  enableVirtualization: true,
  enableWebWorkers: true,
  cacheTimeout: 300000, // 5 minutes
  preloadComponents: true
};

// Performance metrics tracking
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getMetrics() {
    const result: Record<string, { avg: number; count: number }> = {};
    this.metrics.forEach((values, name) => {
      result[name] = {
        avg: this.getAverageMetric(name),
        count: values.length
      };
    });
    return result;
  }

  clear() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Cache manager for component data
class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private timeout: number;

  constructor(timeout: number = 300000) {
    this.timeout = timeout;
  }

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.timeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cacheManager = new CacheManager();

// Web Worker for heavy computations
class ComputationWorker {
  private worker: Worker | null = null;
  private taskQueue: Array<{
    id: string;
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  initialize() {
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers not supported');
      return;
    }

    // Create inline worker
    const workerCode = `
      self.addEventListener('message', function(e) {
        const { id, type, data } = e.data;
        
        try {
          let result;
          
          switch(type) {
            case 'calculateMetrics':
              result = calculateMetrics(data);
              break;
            case 'processLargeDataset':
              result = processLargeDataset(data);
              break;
            case 'generateReport':
              result = generateReport(data);
              break;
            default:
              throw new Error('Unknown task type');
          }
          
          self.postMessage({ id, result, success: true });
        } catch (error) {
          self.postMessage({ id, error: error.message, success: false });
        }
      });
      
      function calculateMetrics(data) {
        // Heavy metric calculations
        const metrics = {};
        data.forEach(item => {
          Object.keys(item).forEach(key => {
            if (typeof item[key] === 'number') {
              if (!metrics[key]) {
                metrics[key] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
              }
              metrics[key].sum += item[key];
              metrics[key].count++;
              metrics[key].min = Math.min(metrics[key].min, item[key]);
              metrics[key].max = Math.max(metrics[key].max, item[key]);
            }
          });
        });
        
        Object.keys(metrics).forEach(key => {
          metrics[key].avg = metrics[key].sum / metrics[key].count;
        });
        
        return metrics;
      }
      
      function processLargeDataset(data) {
        // Process large datasets
        return data.map(item => ({
          ...item,
          processed: true,
          timestamp: Date.now()
        }));
      }
      
      function generateReport(data) {
        // Generate comprehensive report
        return {
          summary: {
            total: data.length,
            processed: Date.now()
          },
          data: data.slice(0, 100) // Limit for performance
        };
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(workerUrl);

    this.worker.addEventListener('message', (e) => {
      const { id, result, error, success } = e.data;
      const task = this.taskQueue.find(t => t.id === id);
      
      if (task) {
        if (success) {
          task.resolve(result);
        } else {
          task.reject(new Error(error));
        }
        this.taskQueue = this.taskQueue.filter(t => t.id !== id);
      }
    });
  }

  async execute(type: string, data: any): Promise<any> {
    if (!this.worker) {
      this.initialize();
    }

    if (!this.worker) {
      throw new Error('Web Workers not available');
    }

    const id = `task-${Date.now()}-${Math.random()}`;
    
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ id, data, resolve, reject });
      this.worker!.postMessage({ id, type, data });
    });
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const computationWorker = new ComputationWorker();

// Virtualized list component for large datasets
interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  windowHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}

export const VirtualizedList = memo<VirtualizedListProps>(({
  items,
  itemHeight,
  windowHeight,
  renderItem,
  overscan = 3
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + windowHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1).map((item, i) => ({
      item,
      index: startIndex + i
    }));

    return {
      visibleItems,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, scrollTop, windowHeight, overscan]);

  return (
    <div
      style={{ height: windowHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Performance-optimized dashboard wrapper
interface PerformanceOptimizerProps {
  config?: Partial<PerformanceConfig>;
  children?: React.ReactNode;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  config = {},
  children
}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  React.useEffect(() => {
    // Initialize performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          performanceMonitor.recordMetric(entry.name, entry.duration);
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

      return () => observer.disconnect();
    }
  }, []);

  React.useEffect(() => {
    // Preload critical components
    if (fullConfig.preloadComponents) {
      const preloadTimer = setTimeout(() => {
        Promise.all([
          import('./AnalyticsDashboardView'),
          import('./BusinessIntelligencePanel'),
          import('./PredictiveInsightsPanel')
        ]).catch(err => console.warn('Component preload failed:', err));
      }, 1000);

      return () => clearTimeout(preloadTimer);
    }
  }, [fullConfig.preloadComponents]);

  React.useEffect(() => {
    // Initialize Web Worker
    if (fullConfig.enableWebWorkers) {
      computationWorker.initialize();

      return () => computationWorker.terminate();
    }
  }, [fullConfig.enableWebWorkers]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
};

// Hook for performance optimization utilities
export const usePerformanceOptimization = (config: Partial<PerformanceConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const memoizedCallback = useCallback(
    (fn: any) => {
      if (!fullConfig.enableMemoization) return fn;
      return useCallback(fn, []);
    },
    [fullConfig.enableMemoization]
  );

  const memoizedValue = useCallback(
    (fn: () => any, deps: React.DependencyList) => {
      if (!fullConfig.enableMemoization) return fn();
      return useMemo(fn, deps);
    },
    [fullConfig.enableMemoization]
  );

  const cachedData = useCallback(
    async (key: string, fetcher: () => Promise<any>) => {
      if (!fullConfig.enableCaching) return fetcher();

      const cached = cacheManager.get(key);
      if (cached) {
        performanceMonitor.recordMetric('cache-hit', 1);
        return cached;
      }

      const data = await fetcher();
      cacheManager.set(key, data);
      performanceMonitor.recordMetric('cache-miss', 1);
      return data;
    },
    [fullConfig.enableCaching]
  );

  const computeInWorker = useCallback(
    async (type: string, data: any) => {
      if (!fullConfig.enableWebWorkers) {
        throw new Error('Web Workers disabled');
      }

      const startTime = performance.now();
      const result = await computationWorker.execute(type, data);
      const duration = performance.now() - startTime;
      
      performanceMonitor.recordMetric(`worker-${type}`, duration);
      return result;
    },
    [fullConfig.enableWebWorkers]
  );

  const getPerformanceMetrics = useCallback(() => {
    return {
      performance: performanceMonitor.getMetrics(),
      cache: cacheManager.getStats()
    };
  }, []);

  return {
    config: fullConfig,
    memoizedCallback,
    memoizedValue,
    cachedData,
    computeInWorker,
    getPerformanceMetrics,
    cacheManager,
    performanceMonitor
  };
};

// Optimized components exports
export {
  MemoizedAnalyticsDashboard,
  MemoizedBusinessIntelligence,
  MemoizedPredictiveInsights,
  MemoizedROICalculator,
  MemoizedVoiceCommands
};