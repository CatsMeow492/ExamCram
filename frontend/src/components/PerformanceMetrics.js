import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';

const PerformanceMetrics = ({ barData, pieData }) => {
  return (
    <div className="performance-metrics">
      <Bar data={barData} />
      <Pie data={pieData} />
    </div>
  );
};

export default PerformanceMetrics;
