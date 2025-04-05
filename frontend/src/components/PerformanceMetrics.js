import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import '../styles/PerformanceMetrics.css';

// Register the necessary components
ChartJS.register(ArcElement, Tooltip, Legend);

const PerformanceMetrics = ({ performanceData = [] }) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Debug logging
    console.log('PerformanceMetrics component received data:', performanceData);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [performanceData]);

  // Calculate summary metrics and pie chart data
  const { totalAttempts, totalCorrect, totalIncorrect, percentageCorrect, percentageIncorrect, pieChartData } = useMemo(() => {
    console.log('Performance data for calculations:', performanceData);
    
    if (!Array.isArray(performanceData)) {
      console.error('Performance data is not an array:', performanceData);
      return {
        totalAttempts: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        percentageCorrect: 0,
        percentageIncorrect: 0,
        pieChartData: {
          labels: ['Correct', 'Incorrect'],
          datasets: [{
            data: [0, 0],
            backgroundColor: ['#36A2EB', '#FF6384'],
            hoverBackgroundColor: ['#36A2EB', '#FF6384']
          }]
        }
      };
    }
    
    const totalCorrect = performanceData.reduce((total, item) => {
      return total + (typeof item.correct === 'number' ? item.correct : 0);
    }, 0);
    
    const totalIncorrect = performanceData.reduce((total, item) => {
      return total + (typeof item.incorrect === 'number' ? item.incorrect : 0);
    }, 0);
    
    const totalAttempts = totalCorrect + totalIncorrect;
    const percentageCorrect = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const percentageIncorrect = totalAttempts > 0 ? (totalIncorrect / totalAttempts) * 100 : 0;

    const pieChartData = {
      labels: ['Correct', 'Incorrect'],
      datasets: [{
        data: [totalCorrect, totalIncorrect],
        backgroundColor: ['#36A2EB', '#FF6384'],
        hoverBackgroundColor: ['#36A2EB', '#FF6384']
      }]
    };

    return { totalAttempts, totalCorrect, totalIncorrect, percentageCorrect, percentageIncorrect, pieChartData };
  }, [performanceData]);

  // Check if we have any data to display
  if (!Array.isArray(performanceData) || performanceData.length === 0) {
    return (
      <div className="performance-metrics">
        <h2 className="metrics-title">Performance Metrics</h2>
        <p className="metrics-description">No performance data available yet. Answer some questions to see your metrics.</p>
      </div>
    );
  }

  // Prepare data for the heatmap
  const maxSquaresPerRow = isMobile ? 8 : 15;
  const data = [];

  for (let i = 0; i < Math.ceil(performanceData.length / maxSquaresPerRow); i++) {
    const row = performanceData.slice(i * maxSquaresPerRow, (i + 1) * maxSquaresPerRow).map(item => {
      const correct = typeof item.correct === 'number' ? item.correct : 0;
      const incorrect = typeof item.incorrect === 'number' ? item.incorrect : 0;
      const total = correct + incorrect;
      
      if (total === 0) return null; // Unattempted
      return correct / total;
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
                  const questionId = performanceData[rowIndex * maxSquaresPerRow + colIndex]?.questionId || `Question ${questionNumber}`;
                  
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
                          <span>{questionId}: </span>
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
        <Pie data={pieChartData} options={{
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
  performanceData: PropTypes.array,
};

export default PerformanceMetrics;
