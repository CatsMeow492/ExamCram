import React from 'react';

const QuestionCard = ({ question, selectedAnswer, handleAnswerSelect, handleSubmitAnswer, feedback, handleExplain, loading, explanation, fetchRandomQuestion, toggleCharts }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{question.question}</h2>
        <button onClick={toggleCharts} className="toggle-charts-button">Toggle Charts</button>
      </div>
      <ul>
        {question.options.map((option, idx) => (
          <li
            key={idx}
            onClick={() => handleAnswerSelect(option)}
            className={`option ${selectedAnswer === option ? 'selected' : ''}`}
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

export default QuestionCard;
