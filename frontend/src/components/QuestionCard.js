import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown'; // Import react-markdown
import '../styles/QuestionCard.css';

const QuestionCard = ({ 
  question, 
  selectedAnswers, 
  handleAnswerSelect, 
  handleSubmitAnswer, 
  feedback, 
  handleExplain, 
  isExplanationLoading, 
  explanation, 
  fetchRandomQuestion, 
  handleHint, 
  isHintLoading, 
  hint, 
  performanceMetrics, 
  studyMode 
}) => {
  if (!question || !question.options) {
    return <p>Loading...</p>; // Display a loading message or spinner
  }

  console.log('Performance metrics in QuestionCard:', performanceMetrics);
  console.log('Question in QuestionCard:', question);
  console.log('Study mode in QuestionCard:', studyMode);
  // Find the performance metrics for the current question
  const currentQuestionMetrics = performanceMetrics.find(metric => metric.questionId === question.id) || { correct: 0, incorrect: 0 };

  return (
    <div className="question-card">
      <div className="card-header">
        <h2>{question.question}</h2>
      </div>
      <div className="card-content">
        {question.imageUrl && <img src={question.imageUrl} alt="Question" className="question-image" />}
        {studyMode === 'practice-worst' && performanceMetrics && (
          <div className="performance-metrics">
            <p>Correct: {currentQuestionMetrics.correct} | Incorrect: {currentQuestionMetrics.incorrect}</p>
          </div>
        )}
        <ul>
          {question.options.map((option, idx) => (
            <li
              key={idx}
              onClick={() => handleAnswerSelect(option)}
              className={`option ${selectedAnswers.includes(option) ? 'selected' : ''}`}
            >
              {option.text}
            </li>
          ))}
        </ul>
        <div className="button-container">
          <button onClick={handleSubmitAnswer}>Submit Answer</button>
          <button onClick={handleExplain} disabled={isExplanationLoading}>
            {isExplanationLoading ? 'Loading...' : 'Explain'}
          </button>
          <button onClick={handleHint} disabled={isHintLoading}>
            {isHintLoading ? 'Loading...' : 'Hint'}
          </button>
          <button onClick={fetchRandomQuestion}>Next Question</button>
        </div>
        {feedback && <p className="feedback">{feedback}</p>}
        {explanation && <ReactMarkdown className="explanation">{explanation}</ReactMarkdown>} {/* Render explanation as markdown */}
        {hint && <ReactMarkdown className="hint">{hint}</ReactMarkdown>}
      </div>
    </div>
  );
};

QuestionCard.propTypes = {
  question: PropTypes.object,
  selectedAnswers: PropTypes.array.isRequired,
  handleAnswerSelect: PropTypes.func.isRequired,
  handleSubmitAnswer: PropTypes.func.isRequired,
  feedback: PropTypes.string,
  handleExplain: PropTypes.func.isRequired,
  isExplanationLoading: PropTypes.bool.isRequired,
  explanation: PropTypes.string,
  fetchRandomQuestion: PropTypes.func.isRequired,
  handleHint: PropTypes.func.isRequired,
  isHintLoading: PropTypes.bool.isRequired,
  hint: PropTypes.string,
  performanceMetrics: PropTypes.array,
  studyMode: PropTypes.string.isRequired, // Add studyMode prop type
};

export default QuestionCard;
