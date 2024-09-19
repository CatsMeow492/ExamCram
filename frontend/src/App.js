import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';
import QuestionCard from './components/QuestionCard';
import PerformanceMetrics from './components/PerformanceMetrics';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function App() {
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [performanceData, setPerformanceData] = useState({});
  const [showCharts, setShowCharts] = useState(false); // Add state for toggling charts
  const userId = 'taylor'; // Replace with actual user ID

  useEffect(() => {
    fetchRandomQuestion();
    fetchUserMetrics();
    fetchPerformanceData();
  }, []);

  const fetchUserMetrics = () => {
    fetch(`/api/metrics?userId=${userId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setCorrectAnswers(data.correctAnswers || 0);
        setIncorrectAnswers(data.incorrectAnswers || 0);
      })
      .catch(error => console.error('Error fetching user metrics:', error));
  };

  const fetchPerformanceData = () => {
    fetch(`/api/performance?userId=${userId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setPerformanceData(data || {});
      })
      .catch(error => console.error('Error fetching performance data:', error));
  };

  const updateUserMetrics = (correct, incorrect) => {
    fetch(`/api/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, correctAnswers: correct, incorrectAnswers: incorrect }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setCorrectAnswers(data.correctAnswers);
        setIncorrectAnswers(data.incorrectAnswers);
      })
      .catch(error => console.error('Error updating user metrics:', error));
  };

  const updatePerformanceData = (questionId, isCorrect) => {
    fetch(`/api/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, questionId, isCorrect }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setPerformanceData(data);
      })
      .catch(error => console.error('Error updating performance data:', error));
  };

  const fetchRandomQuestion = () => {
    console.log('Fetching random question...');
    fetch(`${process.env.REACT_APP_API_URL}/question/random`)
      .then(response => {
        console.log('Response:', response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Random question data:', data);
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
      if (isCorrect) {
        const newCorrect = correctAnswers + 1;
        setCorrectAnswers(newCorrect);
        updateUserMetrics(newCorrect, incorrectAnswers);
      } else {
        const newIncorrect = incorrectAnswers + 1;
        setIncorrectAnswers(newIncorrect);
        updateUserMetrics(correctAnswers, newIncorrect);
      }
      updatePerformanceData(question.id, isCorrect);
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

  const barData = {
    labels: Object.keys(performanceData),
    datasets: [
      {
        label: 'Correct',
        backgroundColor: 'blue',
        data: Object.values(performanceData).map(d => d.correct || 0),
      },
      {
        label: 'Incorrect',
        backgroundColor: 'red',
        data: Object.values(performanceData).map(d => d.incorrect || 0),
      },
    ],
  };

  const pieData = {
    labels: ['Correct', 'Incorrect'],
    datasets: [
      {
        data: [correctAnswers, incorrectAnswers],
        backgroundColor: ['blue', 'red'],
      },
    ],
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Random Question</h1>
        {question ? (
          <QuestionCard
            question={question}
            selectedAnswer={selectedAnswer}
            handleAnswerSelect={handleAnswerSelect}
            handleSubmitAnswer={handleSubmitAnswer}
            feedback={feedback}
            handleExplain={handleExplain}
            loading={loading}
            explanation={explanation}
            fetchRandomQuestion={fetchRandomQuestion}
            toggleCharts={() => setShowCharts(!showCharts)} // Pass toggle function
          />
        ) : (
          <p>Loading...</p>
        )}
        {showCharts && <PerformanceMetrics barData={barData} pieData={pieData} />}
      </header>
    </div>
  );
}

export default App;
