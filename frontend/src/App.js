import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './styles/App.css';
import QuestionCard from './components/QuestionCard';
import PerformanceMetrics from './components/PerformanceMetrics';
import useFetchUserMetrics from './hooks/useFetchUserMetrics';
import useFetchPerformanceData from './hooks/useFetchPerformanceData';
import useFetchRandomQuestion from './hooks/useFetchRandomQuestion';
import { handleAnswerSelect, handleSubmitAnswer, handleExplain, handleHint } from './utils/handlers';
import { jwtDecode } from 'jwt-decode';
import './styles/App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function App() {
  const [question, setQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [performanceData, setPerformanceData] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState('guest');
  const [currentQuestionId, setCurrentQuestionId] = useState(null); 

  const fetchUserMetricsCallback = useFetchUserMetrics(userId, setCorrectAnswers, setIncorrectAnswers);
  const fetchPerformanceDataCallback = useFetchPerformanceData(userId, setPerformanceData);
  const fetchRandomQuestionCallback = useFetchRandomQuestion(setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation);

  useEffect(() => {
    if (user && user.sub) {
      setUserId(user.sub); 
    }
  }, [user]);

  useEffect(() => {
    if (userId !== 'guest') {
      fetchRandomQuestionCallback();
      fetchUserMetricsCallback();
      fetchPerformanceDataCallback();
    }
  }, [userId, fetchUserMetricsCallback, fetchPerformanceDataCallback, fetchRandomQuestionCallback]); 

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

  // Transform the API response into the expected format
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

  const handleLoginSuccess = (response) => {
    console.log('Login Success:', response);
    const idToken = response.credential;
    const decodedToken = jwtDecode(idToken); 
    console.log('Decoded Token:', decodedToken);

    fetch(`${process.env.REACT_APP_API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        setUser(decodedToken); 
        setUserId(decodedToken.sub); 
      })
      .catch(error => {
        console.error('Error during login:', error);
      });
  };

  const handleLoginFailure = (response) => {
    console.log('Login Failed:', response);
  };

  console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="App">
        <header className="App-header">
          <h1>{user ? "Random Question" : "Exam Cram"}</h1>
          <div className="light" style={{ backgroundColor: lightColor }} onClick={() => setShowCharts(!showCharts)}></div>
          {!user ? (
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onFailure={handleLoginFailure}
              cookiePolicy={'single_host_origin'}
              redirectUri="http://localhost:3000"
            />
          ) : (
            <>
              {question ? (
                <QuestionCard
                  question={question}
                  selectedAnswers={selectedAnswers}
                  handleAnswerSelect={(option) => handleAnswerSelect(option, selectedAnswers, setSelectedAnswers)}
                  handleSubmitAnswer={() => handleSubmitAnswer(selectedAnswers, question, setFeedback, updateUserMetrics, updatePerformanceData, currentQuestionId)}
                  feedback={feedback}
                  handleExplain={() => handleExplain(selectedAnswers, question, setLoading, setExplanation)}
                  handleHint={() => handleHint(question, setLoading, setExplanation)}
                  loading={loading}
                  explanation={explanation}
                  fetchRandomQuestion={fetchRandomQuestionCallback}
                />
              ) : (
                <p>Loading...</p>
              )}
              
              {showCharts && <div className="chart-container"><PerformanceMetrics barData={barData} pieData={pieData} /></div>}
              
            </>
          )}
        </header>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
