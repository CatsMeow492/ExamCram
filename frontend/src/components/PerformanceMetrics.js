import React from 'react';
import PropTypes from 'prop-types';
import { Bar, Pie } from 'react-chartjs-2';

const PerformanceMetrics = ({ barData, pieData }) => {
  return (
    <div className="performance-metrics">
      <Bar data={barData} />
      <Pie data={pieData} />
    </div>
  );
};

PerformanceMetrics.propTypes = {
  barData: PropTypes.object.isRequired,
  pieData: PropTypes.object.isRequired,
};

export default PerformanceMetrics;
