import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown'; // Import react-markdown
import '../styles/QuestionCard.css';

const QuestionCard = ({ question, selectedAnswers, handleAnswerSelect, handleSubmitAnswer, feedback, handleExplain, loading, explanation, fetchRandomQuestion, handleHint }) => {
  if (!question || !question.options) {
    return <p>Loading...</p>; // Display a loading message or spinner
  }

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
      <button onClick={handleHint} disabled={loading}>
        {loading ? 'Loading...' : 'Hint'}
      </button>
      <button onClick={fetchRandomQuestion}>Next Question</button>
      {feedback && <p className="feedback">{feedback}</p>}
      {explanation && <ReactMarkdown className="explanation">{explanation}</ReactMarkdown>} {/* Render explanation as markdown */}
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
  loading: PropTypes.bool.isRequired,
  explanation: PropTypes.string,
  fetchRandomQuestion: PropTypes.func.isRequired,
  handleHint: PropTypes.func.isRequired,
};

export default QuestionCard;
