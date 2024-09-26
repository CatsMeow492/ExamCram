import React from 'react';
import PropTypes from 'prop-types';
import '../styles/QuestionCard.css';

const QuestionCard = ({ question, selectedAnswers, handleAnswerSelect, handleSubmitAnswer, feedback, handleExplain, loading, explanation, fetchRandomQuestion }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{question.question}</h2>
        {question.imageUrl && <img src={question.imageUrl} alt="Question" className="question-image" />}
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
      <button onClick={handleExplain} disabled={loading}>
        {loading ? 'Loading...' : 'Explain'}
      </button>
      <button onClick={fetchRandomQuestion}>Next Question</button>
      {feedback && <p className="feedback">{feedback}</p>}
      {explanation && <p className="explanation">{explanation}</p>}
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
    imageUrl: PropTypes.string, // Add this line to propTypes
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
