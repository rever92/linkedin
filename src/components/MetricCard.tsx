import React from 'react';
import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  subtitle: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  subtitle
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className={cn(
            "flex items-center text-sm",
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span>{change}</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard; 