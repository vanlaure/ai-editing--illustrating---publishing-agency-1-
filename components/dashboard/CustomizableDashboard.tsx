import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DashboardWidget, DashboardLayout } from '../../types/dashboard';
import { MetricsCard } from './MetricsCard';
import { WritingProgressChart } from './WritingProgressChart';
import { ROICalculator } from './ROICalculator';
import { PredictiveInsightsPanel } from './PredictiveInsightsPanel';
import { BusinessIntelligencePanel } from './BusinessIntelligencePanel';
import { InteractiveChart } from './InteractiveChart';
import { WidgetLibrary } from './WidgetLibrary';
import {
  PlusIcon,
  SettingsIcon,
  SaveIcon,
  LayersIcon,
} from '../icons/IconDefs';

const LayoutIcon = LayersIcon;

const ResponsiveGridLayout = WidthProvider(Responsive);

interface CustomizableDashboardProps {
  initialLayout?: DashboardLayout;
  onLayoutChange?: (layout: DashboardLayout) => void;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'metric-1',
    type: 'metric',
    title: 'Total Words',
    position: { x: 0, y: 0, w: 3, h: 2 },
    config: { metricKey: 'totalWords', color: 'primary' },
  },
  {
    id: 'metric-2',
    type: 'metric',
    title: 'AI Efficiency',
    position: { x: 3, y: 0, w: 3, h: 2 },
    config: { metricKey: 'aiEfficiency', color: 'success' },
  },
  {
    id: 'chart-1',
    type: 'chart',
    title: 'Writing Progress',
    position: { x: 0, y: 2, w: 6, h: 4 },
    config: { chartType: 'line' },
  },
  {
    id: 'insights-1',
    type: 'insight',
    title: 'AI Insights',
    position: { x: 6, y: 0, w: 6, h: 6 },
    config: {},
  },
  {
    id: 'roi-1',
    type: 'roi',
    title: 'ROI Calculator',
    position: { x: 0, y: 6, w: 6, h: 4 },
    config: {},
  },
  {
    id: 'bi-1',
    type: 'custom',
    title: 'Business Intelligence',
    position: { x: 6, y: 6, w: 6, h: 4 },
    config: { component: 'business-intelligence' },
  },
];

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  initialLayout,
  onLayoutChange,
}) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(
    initialLayout?.widgets || defaultWidgets
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);

  const layouts = {
    lg: widgets.map(w => ({
      i: w.id,
      x: w.position.x,
      y: w.position.y,
      w: w.position.w,
      h: w.position.h,
      minW: 2,
      minH: 2,
    })),
  };

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[]) => {
      const updatedWidgets = widgets.map(widget => {
        const layoutItem = currentLayout.find(l => l.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            },
          };
        }
        return widget;
      });

      setWidgets(updatedWidgets);
      
      if (onLayoutChange) {
        onLayoutChange({
          id: 'custom-1',
          name: 'My Dashboard',
          isDefault: false,
          widgets: updatedWidgets,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    },
    [widgets, onLayoutChange]
  );

  const addWidget = (type: DashboardWidget['type']) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type}`,
      position: { x: 0, y: 0, w: 4, h: 3 },
      config: {},
    };
    setWidgets([...widgets, newWidget]);
  };

  const addWidgetFromLibrary = (template: {
    type: DashboardWidget['type'];
    title: string;
    defaultSize: { w: number; h: number };
    config?: Record<string, any>;
  }) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: template.type,
      title: template.title,
      position: { x: 0, y: Infinity, w: template.defaultSize.w, h: template.defaultSize.h },
      config: template.config || {},
    };
    setWidgets([...widgets, newWidget]);
    setShowWidgetLibrary(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const renderWidget = (widget: DashboardWidget) => {
    const baseClass = "h-full bg-brand-surface/80 border border-brand-border/80 rounded-xl p-4 overflow-auto";
    
    switch (widget.type) {
      case 'metric':
        return (
          <div className={baseClass}>
            <MetricsCard
              title={widget.title}
              value="Loading..."
              color={widget.config.color}
            />
          </div>
        );
      
      case 'chart':
        return (
          <div className={baseClass}>
            <h3 className="text-lg font-semibold text-brand-text mb-3">
              {widget.title}
            </h3>
            <InteractiveChart type={widget.config.chartType || 'line'} />
          </div>
        );
      
      case 'roi':
        return (
          <div className={baseClass}>
            <ROICalculator />
          </div>
        );
      
      case 'insight':
        return (
          <div className={baseClass}>
            <PredictiveInsightsPanel />
          </div>
        );
      
      case 'custom':
        if (widget.config.component === 'business-intelligence') {
          return (
            <div className={baseClass}>
              <BusinessIntelligencePanel />
            </div>
          );
        }
        return (
          <div className={baseClass}>
            <p className="text-brand-text-secondary">Custom widget</p>
          </div>
        );
      
      default:
        return (
          <div className={baseClass}>
            <p className="text-brand-text-secondary">Unknown widget type</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-brand-border/60">
        <div>
          <h2 className="text-xl font-bold text-brand-text">Custom Dashboard</h2>
          <p className="text-sm text-brand-text-secondary">
            Drag and drop widgets to customize your view
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isEditMode
                ? 'bg-brand-primary text-white'
                : 'bg-brand-surface text-brand-text hover:bg-brand-surface-hover'
            }`}
          >
            <LayoutIcon className="w-4 h-4 inline-block mr-2" />
            {isEditMode ? 'Done' : 'Edit Layout'}
          </button>
          
          {isEditMode && (
            <button
              onClick={() => setShowWidgetLibrary(true)}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Widget
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex-1 overflow-auto">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
        >
          {widgets.map(widget => (
            <div key={widget.id} className="relative group">
              {isEditMode && (
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <button
                    className="drag-handle cursor-move p-1 bg-brand-surface rounded hover:bg-brand-surface-hover"
                    title="Drag to move"
                  >
                    <SettingsIcon className="w-4 h-4 text-brand-text" />
                  </button>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="p-1 bg-red-500/10 rounded hover:bg-red-500/20"
                    title="Remove widget"
                  >
                    <span className="text-red-500 text-xs">✕</span>
                  </button>
                </div>
              )}
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderWidget(widget)}
              </motion.div>
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Widget Library Modal */}
      <WidgetLibrary
        isOpen={showWidgetLibrary}
        onAddWidget={addWidgetFromLibrary}
        onClose={() => setShowWidgetLibrary(false)}
      />
    </div>
  );
};