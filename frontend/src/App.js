import React, { useEffect, useState } from 'react';
import './App.css'; // Import the CSS file

function App() {
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRandomQuestion = () => {
    fetch(`${process.env.REACT_APP_API_URL}/question/random`)
      .then(response => response.json())
      .then(data => {
        setQuestion(data);
        setSelectedAnswer(null);
        setFeedback(null);
        setExplanation(null);
      })
      .catch(error => console.error('Error fetching question:', error));
  };

  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer) {
      const isCorrect = selectedAnswer.correct;
      setFeedback(isCorrect ? 'Correct!' : 'Incorrect!');
    }
  };

  const handleExplain = () => {
    if (selectedAnswer) {
      const requestBody = {
        question: question.question,
        selectedAnswer: selectedAnswer.text,
      };
      console.log('Sending request to /explain with body:', requestBody);
      setLoading(true);
      fetch(`${process.env.REACT_APP_API_URL}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then(response => {
          console.log('Received response:', response);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log('Received data:', data);
          setExplanation(data.explanation);
        })
        .catch(error => {
          console.error('Error fetching explanation:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log('No selected answer to explain');
    }
  };

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Random Question</h1>
        {question ? (
          <div className="card">
            <h2>{question.question}</h2>
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
        ) : (
          <p>Loading...</p>
        )}
      </header>
    </div>
  );
}

export default App;
