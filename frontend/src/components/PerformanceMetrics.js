import React from 'react';
import PropTypes from 'prop-types';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto'; // Ensure you have this import for Chart.js 3.x
import '../styles/PerformanceMetrics.css'; // Import the CSS file

const PerformanceMetrics = ({ barData, pieData }) => {
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to take up more space
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#333',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#fff',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#333',
        },
      },
      y: {
        grid: {
          color: '#eee',
        },
        ticks: {
          color: '#333',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 100, // Add padding to the right to prevent legend cutoff
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: '#333',
          font: {
            size: 14,
            weight: 'bold',
          },
          padding: 10, // Add padding between legend items
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#fff',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="performance-metrics">
      <div className="chart-container">
        <Bar data={barData} options={barOptions} />
      </div>
      <div className="chart-container">
        <Pie data={pieData} options={pieOptions} />
      </div>
    </div>
  );
};

PerformanceMetrics.propTypes = {
  barData: PropTypes.object.isRequired,
  pieData: PropTypes.object.isRequired,
};

export default PerformanceMetrics;
