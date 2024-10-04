import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom'; // Import Link
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/App.css';
import PerformanceMetrics from './components/PerformanceMetrics';
import StudyOptions from './components/StudyOptions';
import QuestionHandler from './components/QuestionHandler';
import Login from './components/Login';
import useFetchUserMetrics from './hooks/useFetchUserMetrics';
import useFetchPerformanceData from './hooks/useFetchPerformanceData';
import Lantern from './components/Lantern';
import './styles/App.css';

function App() {
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [performanceData, setPerformanceData] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState('guest');

  const fetchUserMetricsCallback = useFetchUserMetrics(userId, setCorrectAnswers, setIncorrectAnswers);
  const fetchPerformanceDataCallback = useFetchPerformanceData(userId, setPerformanceData);

  useEffect(() => {
    if (user && user.sub) {
      setUserId(user.sub);
    }
  }, [user]);

  useEffect(() => {
    if (userId !== 'guest') {
      fetchUserMetricsCallback();
      fetchPerformanceDataCallback();
    }
  }, [userId, fetchUserMetricsCallback, fetchPerformanceDataCallback]);

  const getUserId = () => {
    return user ? user.sub : null;
  };

  const updateUserMetrics = (isCorrect) => {
    fetch(`/api/metrics?userId=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const currentCorrectAnswers = data.correctAnswers || 0;
            const currentIncorrectAnswers = data.incorrectAnswers || 0;

            const newCorrectAnswers = isCorrect ? currentCorrectAnswers + 1 : currentCorrectAnswers;
            const newIncorrectAnswers = isCorrect ? currentIncorrectAnswers : currentIncorrectAnswers + 1;

            const userMetrics = {
                userId: userId,
                correctAnswers: newCorrectAnswers,
                incorrectAnswers: newIncorrectAnswers,
            };

            return fetch(`${process.env.REACT_APP_API_URL}/api/metrics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userMetrics),
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('User metrics updated:', data);
            setCorrectAnswers(data.correctAnswers);
            setIncorrectAnswers(data.incorrectAnswers);
        })
        .catch(error => console.error('Error updating user metrics:', error));
  };

  const updatePerformanceData = (questionId, isCorrect) => {
    const userId = getUserId();
    if (!userId) {
      console.error('UserId is not set');
      return;
    }
  
    if (!questionId) {
      console.error('QuestionId is not set');
      return;
    }
  
    const newPerformanceData = {
      userId,
      questionId,
      correct: isCorrect ? 1 : 0,
      incorrect: isCorrect ? 0 : 1,
    };
  
    console.log('Sending performance data:', newPerformanceData);

    fetch(`${process.env.REACT_APP_API_URL}/api/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPerformanceData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        setPerformanceData(prevData => [...prevData, newPerformanceData]);
      })
      .catch(error => console.error('Error updating performance data:', error));
  };

  const transformedPerformanceData = Array.isArray(performanceData) ? performanceData.reduce((acc, item) => {
    acc[item.questionId] = {
      correct: item.correct,
      incorrect: item.incorrect,
    };
    return acc;
  }, {}) : {};

  const barData = {
    labels: Object.keys(transformedPerformanceData).map(questionId => questionId),
    datasets: [
      {
        label: 'Correct',
        backgroundColor: 'blue',
        data: Object.values(transformedPerformanceData).map(d => d.correct || 0),
      },
      {
        label: 'Incorrect',
        backgroundColor: 'red',
        data: Object.values(transformedPerformanceData).map(d => d.incorrect || 0),
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

  const totalAttempts = correctAnswers + incorrectAnswers;
  const averageCorrect = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
  const lightColor = totalAttempts < 20 || averageCorrect < 80 ? 'red' : 'green';

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <div className="App">
          <header className="App-header">
            {user ? (
              <Link to="/study-options" className="app-title-link">
                <h1 className="app-title">Exam Cram</h1>
              </Link>
            ) : (
              <h1 className="app-title">Welcome</h1>
            )}
            <h4 className="app-subtitle">When the night before wasn't enough..</h4>
            {!user ? (
              <Login setUser={setUser} setUserId={setUserId} />
            ) : (
              <Routes>
                <Route path="/study/:option" element={<QuestionHandler userId={userId} updateUserMetrics={updateUserMetrics} updatePerformanceData={updatePerformanceData} />} />
                <Route path="/study-options" element={<StudyOptions />} />
                <Route path="*" element={<Navigate to="/study-options" />} />
              </Routes>
            )}
            <div className="lantern-container" onClick={() => setShowCharts(!showCharts)} >
              <Lantern />
            </div>
            
            {showCharts && <div className="chart-container"><PerformanceMetrics barData={barData} pieData={pieData} /></div>}
          </header>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;