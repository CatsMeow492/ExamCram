import React from 'react';
import PropTypes from 'prop-types';
import './QuestionCard.css';

const QuestionCard = ({ question, selectedAnswers, handleAnswerSelect, handleSubmitAnswer, feedback, handleExplain, loading, explanation, fetchRandomQuestion }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{question.question}</h2>
      </div>
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
      <button onClick={handleSubmitAnswer}>Submit Answer</button>
      {feedback && <p className="feedback">{feedback}</p>}
      <button onClick={handleExplain} disabled={loading}>
        {loading ? 'Loading...' : 'Explain'}
      </button>
      {explanation && <p className="explanation">{explanation}</p>}
      <button onClick={fetchRandomQuestion}>Next Question</button>
    </div>
  );
};

QuestionCard.propTypes = {
  question: PropTypes.shape({
    question: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
        correct: PropTypes.bool.isRequired,
      })
    ).isRequired,
  }).isRequired,
  selectedAnswers: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      correct: PropTypes.bool.isRequired,
    })
  ).isRequired,
  handleAnswerSelect: PropTypes.func.isRequired,
  handleSubmitAnswer: PropTypes.func.isRequired,
  feedback: PropTypes.string,
  handleExplain: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  explanation: PropTypes.string,
  fetchRandomQuestion: PropTypes.func.isRequired,
};

export default QuestionCard;
