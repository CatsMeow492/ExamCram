import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../styles/PerformanceMetrics.css';

// Register the necessary components
ChartJS.register(ArcElement, Tooltip, Legend);

const PerformanceMetrics = ({ barData, pieData, performanceData = [] }) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Adjust this breakpoint as needed
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prepare data for the heatmap
  const maxSquaresPerRow = isMobile ? 8 : 15;
  const data = [];

  for (let i = 0; i < Math.ceil(performanceData.length / maxSquaresPerRow); i++) {
    const row = performanceData.slice(i * maxSquaresPerRow, (i + 1) * maxSquaresPerRow).map(item => {
      if (item.correct + item.incorrect === 0) return null; // Unattempted
      return item.correct / (item.correct + item.incorrect);
    });
    data.push(row);
  }

  // Function to determine cell color
  const getCellColor = (value) => {
    if (value === null) return '#ccc';
    // Red for 0%, Yellow for 50%, Green for 100%
    const red = Math.round(255 * (1 - value));
    const green = Math.round(255 * value);
    return `rgb(${red}, ${green}, 0)`;
  };

  // Calculate summary metrics
  const totalAttempts = performanceData.reduce((total, item) => total + item.correct + item.incorrect, 0);
  const totalCorrect = performanceData.reduce((total, item) => total + item.correct, 0);
  const totalIncorrect = performanceData.reduce((total, item) => total + item.incorrect, 0);
  const percentageCorrect = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
  const percentageIncorrect = totalAttempts > 0 ? (totalIncorrect / totalAttempts) * 100 : 0;

  return (
    <div className="performance-metrics">
      <h2 className="metrics-title">Performance Metrics</h2>
      <p className="metrics-description">Track your progress and performance over time.</p>
      <div className="heatmap-container">
        <div className="custom-heatmap">
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="heatmap-row">
              <div className="heatmap-cells">
                {row.map((value, colIndex) => {
                  const questionNumber = rowIndex * maxSquaresPerRow + colIndex + 1;
                  return (
                    <div
                      key={colIndex}
                      className="heatmap-cell"
                      style={{
                        backgroundColor: getCellColor(value),
                      }}
                      onMouseEnter={() => setHoveredCell({ rowIndex, colIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {questionNumber}
                      {hoveredCell && 
                       hoveredCell.rowIndex === rowIndex && 
                       hoveredCell.colIndex === colIndex && (
                        <div className="cell-tooltip">
                          <span>Q{questionNumber}: </span>
                          <span>{value !== null ? `${(value * 100).toFixed(0)}%` : 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="chart-container">
        <Pie data={pieData} options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'right',
            },
          },
        }} />
      </div>
      <div className="metrics-summary">
        <p>Total Attempts: {totalAttempts}</p>
        <p>Total Correct: {totalCorrect}</p>
        <p>Total Incorrect: {totalIncorrect}</p>
        <p>Percentage Correct: {percentageCorrect.toFixed(2)}%</p>
        <p>Percentage Incorrect: {percentageIncorrect.toFixed(2)}%</p>
      </div>
    </div>
  );
};

PerformanceMetrics.propTypes = {
  barData: PropTypes.object.isRequired,
  pieData: PropTypes.object.isRequired,
  performanceData: PropTypes.array,
};

export default PerformanceMetrics;
