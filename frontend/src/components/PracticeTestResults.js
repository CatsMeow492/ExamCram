import React from 'react';
import PropTypes from 'prop-types';
import '../styles/PracticeTestResults.css';

const PracticeTestResults = ({ score, wrongQuestions, studyGuide, onRetry }) => {
  const isPass = score >= 80;

  return (
    <div className="practice-test-results">
      <h2>Practice Test Results</h2>
      <div className={`score ${isPass ? 'pass' : 'fail'}`}>
        <h3>Your Score: {score}%</h3>
        <p>{isPass ? 'Congratulations! You passed!' : 'Keep practicing! You can do better!'}</p>
      </div>

      {!isPass && wrongQuestions.length > 0 && (
        <div className="wrong-questions">
          <h3>Questions to Review:</h3>
          <ul>
            {wrongQuestions.map((question, index) => (
              <li key={index}>
                <p><strong>Question {index + 1}:</strong> {question.question}</p>
                <p><strong>Correct Answer(s):</strong> {question.options.filter(opt => opt.correct).map(opt => opt.text).join(', ')}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isPass && studyGuide && (
        <div className="study-guide">
          <h3>Personalized Study Guide</h3>
          <div className="study-guide-content">
            {studyGuide}
          </div>
        </div>
      )}

      <button className="retry-button" onClick={onRetry}>
        Try Another Practice Test
      </button>
    </div>
  );
};

PracticeTestResults.propTypes = {
  score: PropTypes.number.isRequired,
  wrongQuestions: PropTypes.arrayOf(PropTypes.shape({
    question: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string.isRequired,
      correct: PropTypes.bool.isRequired,
    })).isRequired,
  })).isRequired,
  studyGuide: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};

export default PracticeTestResults; 