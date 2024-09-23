import React, { useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode'; // Correct import for jwt-decode
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import './App.css';
import QuestionCard from './components/QuestionCard';
import PerformanceMetrics from './components/PerformanceMetrics';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function App() {
  const [question, setQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [performanceData, setPerformanceData] = useState({});
  const [showCharts, setShowCharts] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState('guest');
  const [currentQuestionId, setCurrentQuestionId] = useState(null); 

  const fetchUserMetrics = useCallback(() => {
    fetch(`/api/metrics?userId=${userId}`)
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            return response.text().then(text => {
                console.log('Response text:', text); // Log the response text
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                try {
                    return JSON.parse(text); // Attempt to parse JSON
                } catch (e) {
                    throw new Error(`Failed to parse JSON: ${e.message}`);
                }
            });
        })
        .then(data => {
            console.log('Fetched user metrics:', data); // Log the fetched data
            setCorrectAnswers(data.correctAnswers || 0);
            setIncorrectAnswers(data.incorrectAnswers || 0);
            console.log('Correct Answers (state):', data.correctAnswers);
            console.log('Incorrect Answers (state):', data.incorrectAnswers);
        })
        .catch(error => console.error('Error fetching user metrics:', error));
  }, [userId]);

  const fetchPerformanceData = useCallback(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/performance?userId=${userId}`)
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
  }, [userId]);

  useEffect(() => {
    if (user && user.sub) {
      setUserId(user.sub); 
    }
  }, [user]);

  useEffect(() => {
    if (userId !== 'guest') {
      fetchRandomQuestion();
      fetchUserMetrics();
      fetchPerformanceData();
    }
  }, [userId, fetchUserMetrics, fetchPerformanceData]); 

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
  
    const performanceData = {
      userId,
      questionId,
      correct: isCorrect ? 1 : 0,
      incorrect: isCorrect ? 0 : 1,
  };
  
    console.log('Sending performance data:', performanceData);

    fetch(`${process.env.REACT_APP_API_URL}/api/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(performanceData),
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
    fetch(`${process.env.REACT_APP_API_URL}/api/question/random`)
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
        setCurrentQuestionId(data.id); 
        setSelectedAnswers([]);
        setFeedback(null);
        setExplanation(null);
      })
      .catch(error => console.error('Error fetching question:', error));
  };

  const handleAnswerSelect = (option) => {
    setSelectedAnswers(prevSelected => {
      if (prevSelected.includes(option)) {
        return prevSelected.filter(answer => answer !== option);
      } else {
        return [...prevSelected, option];
      }
    });
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswers.length > 0) {
      const isCorrect = selectedAnswers.every(answer => answer.correct) && selectedAnswers.length === question.options.filter(option => option.correct).length;
      setFeedback(isCorrect ? 'Correct!' : 'Incorrect!');
      if (isCorrect) {
        updateUserMetrics(true); 
      } else {
        updateUserMetrics(false); 
      }
      updatePerformanceData(currentQuestionId, isCorrect);
    }
  };

  const handleExplain = () => {
    if (selectedAnswers.length > 0) {
      const requestBody = {
        question: question.question,
        selectedAnswers: selectedAnswers.map(answer => answer.text),
      };
      console.log('Sending request to /explain with body:', requestBody);
      setLoading(true);
      fetch(`${process.env.REACT_APP_API_URL}/api/explain`, {
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
      console.log('No selected answers to explain');
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

  console.log('PieData', pieData);

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
                  handleAnswerSelect={handleAnswerSelect}
                  handleSubmitAnswer={handleSubmitAnswer}
                  feedback={feedback}
                  handleExplain={handleExplain} 
                  loading={loading}
                  explanation={explanation}
                  fetchRandomQuestion={fetchRandomQuestion}
                />
              ) : (
                <p>Loading...</p>
              )}
              {showCharts && <PerformanceMetrics barData={barData} pieData={pieData} />}
            </>
          )}
        </header>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
