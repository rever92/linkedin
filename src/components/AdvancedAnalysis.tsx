// AdvancedAnalysis.tsx
import React from 'react';
import { LinkedInPost } from '../types';
import AdvancedMetrics from './AdvancedMetrics';

interface AdvancedAnalysisProps {
  data: LinkedInPost[];
}

const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({ data }) => {
  return (
    <div className="space-y-8 p-8">
      <AdvancedMetrics data={data} filteredData={data} />
    </div>
  );
};

export default AdvancedAnalysis;
