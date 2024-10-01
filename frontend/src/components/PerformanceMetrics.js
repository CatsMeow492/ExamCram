import React from 'react';
import PropTypes from 'prop-types';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto'; // Ensure you have this import for Chart.js 3.x
import '../styles/PerformanceMetrics.css'; // Import the CSS file

const PerformanceMetrics = ({ barData, pieData }) => {
  // Calculate the percentage of incorrect answers for each question
  const totalAttemptsPerQuestion = barData.datasets[0].data.map((value, index) => {
    const correct = barData.datasets[1]?.data[index] || 0;
    return value + correct;
  });

  const percentageData = barData.datasets[0].data.map((value, index) => {
    const totalAttempts = totalAttemptsPerQuestion[index];
    return totalAttempts > 0 ? (value / totalAttempts) * 100 : 0;
  });

  // Sort the data to get the top 10 questions answered incorrectly the most
  const sortedData = percentageData
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const sortedBarData = {
    ...barData,
    datasets: [{
      ...barData.datasets[0],
      data: sortedData.map(item => item.value),
      label: 'Incorrect',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    }],
    labels: sortedData.map(item => barData.labels[item.index]),
  };

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
          maxRotation: 90,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: '#eee',
        },
        ticks: {
          callback: function(value) {
            return value + '%'; // Add percentage symbol to y-axis ticks
          },
          beginAtZero: true,
          max: 100, // Set the maximum value to 100%
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
        <Bar data={sortedBarData} options={barOptions} />
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
