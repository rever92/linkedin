// AdvancedAnalysis.tsx
import React from 'react';
import { LinkedInPost } from '../types';
import AdvancedMetrics from './AdvancedMetrics';

interface AdvancedAnalysisProps {
  data: LinkedInPost[];
}

const AdvancedAnalysis = ({ data }: AdvancedAnalysisProps) => {
  return (
    <div className="space-y-8 p-8">
      <AdvancedMetrics data={data} />
    </div>
  );
};

export default AdvancedAnalysis;
