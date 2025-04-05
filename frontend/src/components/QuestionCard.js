import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown'; // Import react-markdown
import '../styles/QuestionCard.css';

const QuestionCard = ({ 
  question, 
  selectedAnswers, 
  onAnswerSelect,
  feedback, 
  explanation, 
  hint, 
  performanceData,
  correctAnswer
}) => {
  if (!question || !question.options) {
    return <p>Loading question data...</p>;
  }

  // Debug the performance data we received
  console.log('Performance data in QuestionCard:', performanceData);

  // Find the performance metrics for the current question - with defensive check
  let currentQuestionMetrics = { correct: 0, incorrect: 0 };

  // First check if performanceData is just the metrics for this question (object)
  if (performanceData && typeof performanceData === 'object' && !Array.isArray(performanceData)) {
    console.log('Using direct performance metrics:', performanceData);
    currentQuestionMetrics = performanceData;
  } 
  // Then check if it's an array and we need to find this question's metrics
  else if (Array.isArray(performanceData) && performanceData.length > 0) {
    console.log('Searching for metrics in array with questionId:', question.id);
    const foundMetric = performanceData.find(metric => metric.questionId === question.id);
    if (foundMetric) {
      console.log('Found metric in array:', foundMetric);
      currentQuestionMetrics = foundMetric;
    }
  }
  
  // Ensure we have numeric values for correct/incorrect
  currentQuestionMetrics.correct = currentQuestionMetrics.correct || 0;
  currentQuestionMetrics.incorrect = currentQuestionMetrics.incorrect || 0;

  // Determine if we need to show the correct answer (when feedback is shown and answer was incorrect)
  const showCorrectAnswer = feedback && correctAnswer;

  return (
    <div className="question-card">
      <div className="card-header">
        <h2>{question.question}</h2>
      </div>
      <div className="card-content">
        {question.imageUrl && <img src={question.imageUrl} alt="Question" className="question-image" />}
        
        {/* Always show performance metrics if they exist */}
        {(currentQuestionMetrics.correct > 0 || currentQuestionMetrics.incorrect > 0) && (
          <div className="performance-metrics">
            <p>Your history with this question:</p>
            <p>Correct: {currentQuestionMetrics.correct} | Incorrect: {currentQuestionMetrics.incorrect}</p>
          </div>
        )}
        
        <ul className="options-list">
          {question.options.map((option, idx) => {
            // Determine the appropriate class for this option
            let optionClass = "option";
            
            // Check if this option is selected - fix selection display
            const isSelected = selectedAnswers === idx || 
                              (Array.isArray(selectedAnswers) && selectedAnswers.includes(idx));
            
            if (isSelected) {
              optionClass += " selected";
              
              // If feedback exists and this wasn't the correct answer
              if (feedback && correctAnswer && option.text !== correctAnswer) {
                optionClass += " incorrect-selection";
              }
            }
            
            // Highlight the correct answer when showing feedback after incorrect submission
            if (showCorrectAnswer && option.text === correctAnswer) {
              optionClass += " correct-answer";
            }
            
            return (
              <li
                key={idx}
                onClick={() => onAnswerSelect(idx)}
                className={optionClass}
              >
                {option.text}
              </li>
            );
          })}
        </ul>
        
        {feedback && (
          <p className={`feedback ${typeof feedback === 'string' && feedback.startsWith('Correct') ? 'correct' : 'incorrect'}`}>
            {typeof feedback === 'object' ? feedback.feedback || feedback.message || 'Response received' : feedback}
          </p>
        )}
        
        {explanation && <ReactMarkdown className="explanation">{explanation}</ReactMarkdown>}
        
        {hint && <ReactMarkdown className="hint">{hint}</ReactMarkdown>}
      </div>
    </div>
  );
};

QuestionCard.propTypes = {
  question: PropTypes.object,
  selectedAnswers: PropTypes.array.isRequired,
  onAnswerSelect: PropTypes.func.isRequired,
  feedback: PropTypes.string,
  explanation: PropTypes.string,
  hint: PropTypes.string,
  performanceData: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  correctAnswer: PropTypes.string
};

QuestionCard.defaultProps = {
  performanceData: null,
  selectedAnswers: [],
  correctAnswer: null
};

export default QuestionCard;
