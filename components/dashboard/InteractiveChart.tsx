import React, { useRef, useEffect, useState } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { dashboardService } from '../../services/dashboardService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface InteractiveChartProps {
  type: 'line' | 'bar' | 'doughnut' | 'radar';
  title?: string;
  height?: number;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  type = 'line',
  title,
  height = 300,
}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const timeframe = {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now,
          label: 'Last 7 Days',
        };

        const data = await dashboardService.getChartData('writing', timeframe);
        
        // Enhance data based on chart type
        if (type === 'bar') {
          data.datasets = data.datasets.map(ds => ({
            ...ds,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
          }));
        } else if (type === 'doughnut') {
          setChartData({
            labels: ['Writing', 'Editing', 'Research', 'Planning'],
            datasets: [{
              data: [45, 25, 20, 10],
              backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(251, 191, 36, 0.8)',
                'rgba(239, 68, 68, 0.8)',
              ],
              borderColor: [
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(251, 191, 36)',
                'rgb(239, 68, 68)',
              ],
              borderWidth: 2,
            }],
          });
          setIsLoading(false);
          return;
        } else if (type === 'radar') {
          setChartData({
            labels: ['Writing Speed', 'Quality', 'Consistency', 'Creativity', 'Focus'],
            datasets: [{
              label: 'Your Performance',
              data: [85, 78, 92, 88, 75],
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 2,
              pointBackgroundColor: 'rgb(59, 130, 246)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(59, 130, 246)',
            }],
          });
          setIsLoading(false);
          return;
        }

        setChartData(data);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [type]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-brand-text-secondary">No data available</p>
      </div>
    );
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          color: '#9ca3af',
        },
      },
      title: {
        display: !!title,
        text: title,
        color: '#e5e7eb',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  };

  const lineBarOptions = {
    ...commonOptions,
    scales: {
      x: {
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const radarOptions = {
    ...commonOptions,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: '#9ca3af',
        },
        ticks: {
          color: '#9ca3af',
          backdropColor: 'transparent',
        },
      },
    },
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      {type === 'line' && (
        <Line data={chartData} options={lineBarOptions} />
      )}
      {type === 'bar' && (
        <Bar data={chartData} options={lineBarOptions} />
      )}
      {type === 'doughnut' && (
        <Doughnut data={chartData} options={commonOptions} />
      )}
      {type === 'radar' && (
        <Radar data={chartData} options={radarOptions} />
      )}
    </div>
  );
};