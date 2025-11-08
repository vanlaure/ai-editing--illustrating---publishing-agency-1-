import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, color = '#a855f7', height = 32 }) => {
  if (!data || data.length < 2) {
    return <div className="text-[10px] text-brand-text-muted">Add activity to see trend</div>;
  }

  const width = Math.max((data.length - 1) * 16, 64);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const gradientId = `spark-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg width="100%" height={height + 8} viewBox={`0 0 ${width} ${height + 8}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        points={points.join(' ')}
      />
      <polygon
        points={`${points.join(' ')} ${width},${height + 8} 0,${height + 8}`}
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
};
