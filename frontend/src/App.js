import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import './styles/App.css';
import Login from './components/Login';
import QuestionHandler from './components/QuestionHandler';
import StudyOptions from './components/StudyOptions';
import PerformanceMetrics from './components/PerformanceMetrics';
import Lantern from './components/Lantern';

function AppContent() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState('guest');
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [performanceData, setPerformanceData] = useState([]);
  const [showCharts, setShowCharts] = useState(false);

  // Check if user is already logged in from localStorage ON MOUNT
  useEffect(() => {
    try {
      // Check if localStorage is available
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedUserId = localStorage.getItem('userId');
        if (savedUserId) {
          console.log('Found saved userId in localStorage on mount:', savedUserId);
          // Create minimal user object from saved ID
          setUser({
            sub: savedUserId,
            name: savedUserId.split('-')[0] || 'User', // Handle potential split issue
            id: savedUserId
          });
          setUserId(savedUserId);
        }
      }
    } catch (storageError) {
      console.warn('Could not read userId from localStorage:', storageError);
    }
  }, []);

  useEffect(() => {
    if (user && user.sub) {
      setUserId(user.sub);
    }
  }, [user]);

  useEffect(() => {
    // Load user metrics
    if (userId && userId !== 'guest') {
      fetch(`http://localhost:8080/api/metrics?userId=${userId}`)
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

      // Load performance data - always include userId
      console.log(`Fetching performance data for user: ${userId}`);
      fetch(`http://localhost:8080/api/performance?userId=${userId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          console.log('Performance API response status:', response.status);
          return response.json();
        })
        .then(data => {
          console.log('Performance data received in App:', data);
          console.log('Data type:', typeof data, 'Data length:', Array.isArray(data) ? data.length : 'Not an array');
          setPerformanceData(data || []);
        })
        .catch(error => console.error('Error fetching performance data:', error));
    }
  }, [userId]);

  const updateUserMetrics = (isCorrect) => {
    fetch(`http://localhost:8080/api/metrics?userId=${userId}`)
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

            return fetch(`http://localhost:8080/api/metrics`, {
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

  const updatePerformanceData = (questionId, isCorrect, timeTaken, isPracticeTest = false) => {
    // Don't fetch new data for practice tests to prevent resetting questions
    const shouldFetchUpdatedData = !isPracticeTest;

    fetch('http://localhost:8080/api/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        userId,
        isCorrect,
        timeTaken,
        isPracticeTest
      }),
    })
      .then(response => {
        // Check if response has content before trying to parse JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json') && 
            response.headers.get('content-length') !== '0') {
          return response.json();
        } else {
          // Return empty object for empty responses
          return {};
        }
      })
      .then(data => {
        if (data) {
          // Always update the performance data state
          // This doesn't cause refetches, just updates the UI
          setPerformanceData(prevData => {
            // If we received new data, use it
            if (data.length && data.length > 0) {
              return data;
            }
            
            // Otherwise update the specific question's performance
            const newData = [...(prevData || [])];
            const index = newData.findIndex(item => item.questionId === questionId);
            
            if (index >= 0) {
              // Update existing question data
              newData[index] = {
                ...newData[index],
                correct: isCorrect ? (newData[index].correct || 0) + 1 : (newData[index].correct || 0),
                incorrect: !isCorrect ? (newData[index].incorrect || 0) + 1 : (newData[index].incorrect || 0)
              };
            } else {
              // Add new question data
              newData.push({
                questionId,
                correct: isCorrect ? 1 : 0,
                incorrect: isCorrect ? 0 : 1
              });
            }
            
            return newData;
          });
        }
      })
      .catch(error => console.error('Error updating performance:', error));
  };

  const totalAttempts = correctAnswers + incorrectAnswers;
  const averageCorrect = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
  const lightColor = totalAttempts < 20 || averageCorrect < 80 ? {firstColor: '#171717', secondColor: '#4e4e4e', thirdColor: '#171717'} : {firstColor: '#171717', secondColor: '#4e4e4e', thirdColor: '#171717'};

  // Login Screen Component
  const LoginScreen = () => (
    <div className="App">
      <header className="App-header">
        <h1 className="app-title">Exam Cram</h1>
        <h4 className="app-subtitle">When the night before wasn&apos;t enough..</h4>
      </header>
      <main className="App-content">
        <Login setUser={setUser} setUserId={setUserId} />
      </main>
      <footer className="App-footer">
        <div className="lantern-container" onClick={() => setShowCharts(!showCharts)}>
          <Lantern lightColor={lightColor} />
        </div>
        {showCharts && <PerformanceMetrics performanceData={performanceData} />}
      </footer>
    </div>
  );

  // Main App Component (when logged in)
  const MainApp = () => (
    <div className="App">
      <header className="App-header">
        <Link to="/study-options" className="app-title-link">
          <h1 className="app-title">Exam Cram</h1>
        </Link>
        <h4 className="app-subtitle">When the night before wasn&apos;t enough..</h4>
      </header>
      <main className="App-content">
        <Routes>
          <Route path="/study/:option" element={<QuestionHandler userId={userId} updateUserMetrics={updateUserMetrics} updatePerformanceData={updatePerformanceData} performanceData={performanceData} />} />
          <Route path="/study-options" element={<StudyOptions />} />
          <Route path="*" element={<Navigate to="/study-options" replace />} />
        </Routes>
      </main>
      <footer className="App-footer">
        <div className="lantern-container" onClick={() => setShowCharts(!showCharts)}>
          <Lantern lightColor={lightColor} />
        </div>
        {showCharts && <PerformanceMetrics performanceData={performanceData} />}
      </footer>
    </div>
  );

  // Render either LoginScreen or MainApp based on login state
  return !user ? <LoginScreen /> : <MainApp />;
}

function App() {
  return (
    <Router>
       <AppContent />
    </Router>
  );
}

export default App;