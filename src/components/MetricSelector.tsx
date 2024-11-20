import { useState } from 'react';

interface MetricSelectorProps {
  onMetricChange: (metric: string) => void;
  selectedMetric: string;
}

export default function MetricSelector({ onMetricChange, selectedMetric }: MetricSelectorProps) {
  const metrics = [
    { value: 'views', label: 'Views' },
    { value: 'likes', label: 'Likes' },
    { value: 'comments', label: 'Comments' },
    { value: 'shares', label: 'Shares' },
    { value: 'engagement', label: 'Total Engagement' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="metric" className="text-sm font-medium text-gray-700">
        Metric:
      </label>
      <select
        id="metric"
        value={selectedMetric}
        onChange={(e) => onMetricChange(e.target.value)}
        className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        {metrics.map((metric) => (
          <option key={metric.value} value={metric.value}>
            {metric.label}
          </option>
        ))}
      </select>
    </div>
  );
}