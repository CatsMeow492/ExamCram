import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import QuestionCard from './QuestionCard';
import PracticeTestResults from './PracticeTestResults';
import useFetchRandomQuestion from '../hooks/useFetchRandomQuestion';
import useFetchPracticeTestQuestions from '../hooks/useFetchPracticeTestQuestions';
import useFetchWorstQuestions from '../hooks/useFetchWorstQuestions';
// eslint-disable-next-line no-unused-vars
import { handleAnswerSelect, handleSubmitAnswer, handleExplain, handleHint } from '../utils/handlers';
import '../styles/QuestionHandler.css';

const PRACTICE_TEST_LENGTH = 5;

function QuestionHandler({ userId, updateUserMetrics, updatePerformanceData, performanceData = [] }) {
  const location = useLocation();
  const studyOption = location.state?.studyMode || 'random';
  
  // Track the current study mode instead of just if we've fetched
  const previousStudyMode = useRef(null);
  
  // Add a ref to track if we're in a practice test session
  const isPracticeTest = useRef(studyOption === 'practice-test');
  // Add a ref to track if initial questions are already loaded for practice test
  const practiceTestQuestionsLoaded = useRef(false);

  const [questions, setQuestions] = useState([]);
  const [initialQuestions, setInitialQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [hint, setHint] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [studyGuide, setStudyGuide] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [testScore, setTestScore] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [errorMessage, setErrorMessage] = useState('');
  // Add state to store the correct answer when user submits an answer
  const [correctAnswer, setCorrectAnswer] = useState(null);
  
  // Separate loading states
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRandomQuestionCallback = useFetchRandomQuestion(setQuestions);
  const fetchPracticeTestQuestionsCallback = useFetchPracticeTestQuestions(setQuestions);
  const fetchWorstQuestionsCallback = useFetchWorstQuestions(userId, setQuestions);

  const fetchExplanation = useCallback(async (questionId) => {
    setIsExplanationLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Error fetching explanation:', error);
      setExplanation('Failed to load explanation. Please try again.');
    } finally {
      setIsExplanationLoading(false);
    }
  }, []);

  // eslint-disable-next-line no-unused-vars
  const fetchHint = useCallback(async (questionId) => {
    setIsHintLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setHint(data.hint);
    } catch (error) {
      console.error('Error fetching hint:', error);
      setHint('Failed to load hint. Please try again.');
    } finally {
      setIsHintLoading(false);
    }
  }, []);
  
  const fetchQuestions = useCallback(async () => {
    setIsQuestionLoading(true);
    
    // Don't fetch new questions if we're in practice test mode and already have questions loaded
    if (isPracticeTest.current && practiceTestQuestionsLoaded.current && questions.length > 0) {
      setIsQuestionLoading(false);
      return;
    }

    let url = 'http://localhost:8080/api/questions/random';

    if (studyOption === 'practice-test') {
      url = 'http://localhost:8080/api/practice-test-questions';
    } else if (studyOption === 'practice-worst') {
      url = `http://localhost:8080/api/practice-worst-questions/${userId}`;
    }
    
    setErrorMessage('');
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (studyOption === 'practice-test') {
        // The response has a questions array property
        const questions = data.questions || data;
        const practiceQuestions = questions.slice(0, 5);
        setQuestions(practiceQuestions);
        setInitialQuestions(practiceQuestions);
        
        // Initialize an array with empty slots for each question's selected answer
        const initialAnswers = new Array(practiceQuestions.length);
        setSelectedAnswers(initialAnswers);
        
        practiceTestQuestionsLoaded.current = true;
      } else {
        setQuestions(data);
        setInitialQuestions(data);
        setSelectedAnswers([]);
      }
      
      // Reset state for new questions
      setFeedback(null);
      setExplanation(null);
      setHint(null);
      setCurrentQuestionIndex(0);
      setShowResults(false);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setErrorMessage('Failed to load questions. Please try again.');
    } finally {
      setIsQuestionLoading(false);
    }
  }, [studyOption, userId, questions.length, isPracticeTest, practiceTestQuestionsLoaded]);

  // eslint-disable-next-line no-unused-vars
  const fetchQuestion = useCallback(() => {
    // Return early if we're already loading questions
    if (isQuestionLoading) {
      console.log('Already loading questions, skipping duplicate fetch');
      return;
    }
    
    setIsQuestionLoading(true);
    console.log(`Fetching questions for study mode: ${studyOption}`);
    
    switch (studyOption) {
      case 'random':
        fetchRandomQuestionCallback();
        break;
      case 'practice-test':
        fetchPracticeTestQuestionsCallback();
        break;
      case 'practice-worst':
        fetchWorstQuestionsCallback();
        break;
      default:
        fetchRandomQuestionCallback();
    }
    
    // Set loading to false after a small delay to ensure the requests don't overlap
    setTimeout(() => {
      setIsQuestionLoading(false);
    }, 500);
  }, [studyOption, fetchRandomQuestionCallback, fetchPracticeTestQuestionsCallback, fetchWorstQuestionsCallback, isQuestionLoading]);

  useEffect(() => {
    // Fetch questions if study mode changes or component mounts
    if (previousStudyMode.current !== studyOption) {
      previousStudyMode.current = studyOption;
      isPracticeTest.current = studyOption === 'practice-test';
      practiceTestQuestionsLoaded.current = false; // Reset when study mode changes
      fetchQuestions();
    }
  }, [studyOption, fetchQuestions]);

  useEffect(() => {
    if (questions.length > 0 && initialQuestions.length === 0) {
      setInitialQuestions(questions);
    }
  }, [questions, initialQuestions]);

  useEffect(() => {
    setPerformanceMetrics(performanceData);
  }, [performanceData]);

  // Define currentQuestion before any useEffects that depend on it
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    // Fetch question-specific performance data when the current question changes
    if (currentQuestion && currentQuestion.id && userId) {
      const currentQuestionId = currentQuestion.id;
      
      console.log(`Fetching performance data for questionId=${currentQuestionId}, userId=${userId}`);
      
      fetch(`http://localhost:8080/api/performance?userId=${userId}&questionId=${currentQuestionId}`)
        .then(response => response.json())
        .then(data => {
          console.log('Fetched performance metrics for current question:', data);
          setPerformanceMetrics(data);
        })
        .catch(error => console.error('Error fetching performance metrics:', error));
    }
  }, [currentQuestion, userId]);

  useEffect(() => {
    if (studyOption === 'practice-test' && questions.length > PRACTICE_TEST_LENGTH) {
      // Slice the questions array to only include the first PRACTICE_TEST_LENGTH questions
      setQuestions(questions.slice(0, PRACTICE_TEST_LENGTH));
    }
  }, [questions, studyOption]);

  // Add a function to move to the next question
  const moveToNextQuestion = () => {
    const PRACTICE_TEST_LENGTH = 5;
    
    if (isPracticeTest.current) {
      if (currentQuestionIndex < PRACTICE_TEST_LENGTH - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        // Don't reset selectedAnswers completely as we now track per question
        setFeedback(null);
        setExplanation(null);
        setHint(null);
        setCorrectAnswer(null);
      } else {
        // Calculate final score percentage - each question is worth 20%
        const scorePercentage = (testScore / PRACTICE_TEST_LENGTH) * 100;
        
        // Show results page
        setShowResults(true);
        
        // Pass the score percentage to the results page
        setTestScore(scorePercentage);

        // If score is below 80%, generate study guide
        if (scorePercentage < 80) {
          fetch('http://localhost:8080/api/generate-study-guide', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              wrongQuestions,
              score: scorePercentage,
            }),
          })
            .then(response => response.json())
            .then(data => {
              setStudyGuide(data.studyGuide);
            })
            .catch(error => console.error('Error generating study guide:', error));
        }
      }
    } else {
      // For non-practice test modes, fetch next question
      // Reset states to ensure we're getting a clean slate
      setSelectedAnswers([]);
      setFeedback(null);
      setExplanation(null);
      setHint(null);
      
      // Fetch a new question for non-practice test modes
      previousStudyMode.current = null; // Force re-fetch
      fetchQuestions();
    }
  };

  const handleSubmitAnswerWrapper = async (answerText, time) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(''); // Clear any previous error messages

      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion || !answerText) {
        setErrorMessage("Cannot submit answer: missing question or answer");
        return;
      }

      const response = await fetch('http://localhost:8080/api/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer: answerText,
          userId,
          time,
          isPracticeTest: isPracticeTest.current,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFeedback(data.feedback);

      // Store the correct answer when an incorrect answer is submitted
      if (!data.isCorrect && data.correctAnswer) {
        console.log("Setting correct answer:", data.correctAnswer);
        setCorrectAnswer(data.correctAnswer);
      } else if (data.isCorrect) {
        // If the answer is correct, no need to highlight the correct answer
        setCorrectAnswer(null);
      } else {
        // If the server didn't send the correct answer, find it from the question
        const correctAnswerObj = currentQuestion.options.find(option => option.correct === true);
        if (correctAnswerObj) {
          console.log("Setting correct answer from question:", correctAnswerObj.text);
          setCorrectAnswer(correctAnswerObj.text);
        }
      }

      // Get updated performance data for this question
      if (updatePerformanceData) {
        // For practice test, update metrics without triggering refetch
        updatePerformanceData(currentQuestion.id, data.isCorrect, time, isPracticeTest.current);
      }

      // For practice test, keep track of wrong questions for the study guide
      if (isPracticeTest.current && !data.isCorrect) {
        setWrongQuestions(prev => [...prev, currentQuestion]);
      }

      // For practice test, track score
      if (isPracticeTest.current) {
        setTestScore(prev => data.isCorrect ? prev + 1 : prev);
      }

      // No longer automatically move to next question
      // User will need to click the Next Question button

    } catch (error) {
      console.error('Error submitting answer:', error);
      setErrorMessage('Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use moveToNextQuestion instead of fetchNextQuestion to ensure consistency with practice test logic
  const handleNextQuestion = () => {
    moveToNextQuestion();
  };

  const handleExplainWrapper = () => {
    setIsExplanationLoading(true);
    
    // Add defensive checks
    if (!currentQuestion || !currentQuestion.options) {
      console.error('Current question or options undefined in handleExplainWrapper');
      setIsExplanationLoading(false);
      return;
    }
    
    // Find all correct answers
    const correctAnswers = currentQuestion.options
      .filter(option => option.correct)
      .map(option => option.text);
    
    const correctAnswer = correctAnswers.length > 0 ? correctAnswers[0] : '';
    
    // Call handleExplain whether or not an answer is selected
    handleExplain(selectedAnswers, currentQuestion, setIsExplanationLoading, setExplanation, correctAnswer);
  };

  const handleHintWrapper = () => {
    setIsHintLoading(true);
    
    // Add defensive checks
    if (!currentQuestion) {
      console.error('Current question undefined in handleHintWrapper');
      setIsHintLoading(false);
      return;
    }
    
    handleHint(currentQuestion, setHint, setIsHintLoading);
  };

  const handleRetry = () => {
    setShowResults(false);
    setWrongQuestions([]);
    setStudyGuide(null);
    setTestScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setFeedback(null);
    fetchQuestions();
  };

  const handleRetryWithSameQuestions = () => {
    setShowResults(false);
    setWrongQuestions([]);
    setStudyGuide(null);
    setTestScore(0);
    setCurrentQuestionIndex(0);
    
    // Create a fresh array with the correct length for the selectedAnswers
    const initialAnswers = new Array(initialQuestions.length);
    setSelectedAnswers(initialAnswers);
    
    setFeedback(null);
    setExplanation(null);
    setHint(null);
    setCorrectAnswer(null);
    setQuestions(initialQuestions);
    
    console.log("Reset for retry with same questions. Questions count:", initialQuestions.length);
  };

  // Make sure to log what metrics we're passing to QuestionCard
  const currentQuestionPerformance = useMemo(() => {
    if (!currentQuestion || !currentQuestion.id) return null;
    
    // Check both the prop data and the state data
    console.log('Available performance data from props:', performanceData);
    console.log('Available performance data from state:', performanceMetrics);
    
    // First check if performanceMetrics is a direct match for this question
    if (performanceMetrics && 
        typeof performanceMetrics === 'object' && 
        !Array.isArray(performanceMetrics) && 
        performanceMetrics.questionId === currentQuestion.id) {
      console.log('Using single question metric from state:', performanceMetrics);
      return performanceMetrics;
    }
    
    // Check if performanceMetrics is an array with the metric we need
    if (Array.isArray(performanceMetrics) && performanceMetrics.length > 0) {
      const metric = performanceMetrics.find(m => m.questionId === currentQuestion.id);
      if (metric) {
        console.log('Found metric for current question in state:', metric);
        return metric;
      }
    }
    
    // Fall back to prop data which has all performance metrics
    if (Array.isArray(performanceData) && performanceData.length > 0) {
      console.log('Searching for metric in props data array...');
      const metric = performanceData.find(m => m.questionId === currentQuestion.id);
      if (metric) {
        console.log('Found metric in props data for current question:', metric);
        return metric;
      }
    }
    
    // If all else fails, check if we're in practice-worst mode, then the question likely has metrics
    // Create a default metrics object
    if (studyOption === 'practice-worst') {
      console.log('Creating default metric for practice-worst mode');
      // Get metrics from question-stats.json data in performanceData prop
      const metricFromStats = Array.isArray(performanceData) ? 
        performanceData.find(m => m.questionId === currentQuestion.id) : null;
        
      if (metricFromStats) {
        return metricFromStats;
      }
      
      // If still no metric found but we're in practice-worst, set empty metrics
      return {
        questionId: currentQuestion.id,
        correct: 0, 
        incorrect: 0
      };
    }
    
    return null;
  }, [currentQuestion, performanceData, performanceMetrics, studyOption]);

  if (isQuestionLoading) {
    return <div className="question-handler">Loading...</div>;
  }

  if (showResults) {
    return (
      <div className="question-handler">
        <PracticeTestResults 
          score={testScore} 
          wrongQuestions={wrongQuestions} 
          studyGuide={studyGuide} 
          onRetry={handleRetry}
          onRetryWithSameQuestions={handleRetryWithSameQuestions}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="question-handler">No questions available.</div>;
  }

  return (
    <div className="question-handler">
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <QuestionCard
        question={currentQuestion}
        selectedAnswers={Array.isArray(selectedAnswers[currentQuestionIndex]) 
          ? selectedAnswers[currentQuestionIndex] 
          : selectedAnswers.includes(currentQuestionIndex) 
            ? [selectedAnswers[currentQuestionIndex]] 
            : selectedAnswers[currentQuestionIndex] !== undefined 
              ? [selectedAnswers[currentQuestionIndex]] 
              : []}
        onAnswerSelect={(index) => {
          console.log("Answer selected:", index, "for question index:", currentQuestionIndex);
          console.log("Current question options:", currentQuestion.options);
          
          // Validate the index is within range 
          if (index < 0 || index >= currentQuestion.options.length) {
            console.error(`Selected index ${index} is out of range for question with ${currentQuestion.options.length} options`);
            return;
          }
          
          // Create a new array to avoid direct state mutation
          const newSelectedAnswers = [...selectedAnswers];
          
          // For single-select questions, we only store one answer per question
          newSelectedAnswers[currentQuestionIndex] = index;
          console.log("Updated selectedAnswers:", newSelectedAnswers);
          
          setSelectedAnswers(newSelectedAnswers);
          
          // Clear any error message when selecting an answer
          if (errorMessage) {
            setErrorMessage('');
          }
        }}
        feedback={feedback}
        explanation={explanation}
        hint={hint}
        performanceData={currentQuestionPerformance}
        correctAnswer={correctAnswer}
      />
      <div className="controls">
        {!feedback && (
          <button className="button submit-button" onClick={() => {
            // Get the selected answer for the current question
            const selectedIndex = selectedAnswers[currentQuestionIndex];
            console.log("Submit clicked", {
              currentQuestionIndex,
              selectedAnswers,
              selectedIndex,
              hasQuestion: !!currentQuestion,
              hasOptions: !!(currentQuestion && currentQuestion.options),
              optionsLength: currentQuestion?.options?.length || 0
            });
            
            // Validate that the selected index is valid for the current question's options
            if (selectedIndex !== undefined && 
                currentQuestion && 
                currentQuestion.options && 
                selectedIndex >= 0 && 
                selectedIndex < currentQuestion.options.length) {
              
              const selectedAnswerText = currentQuestion.options[selectedIndex].text;
              console.log("Selected answer text:", selectedAnswerText);
              // Pass the answer text, not the event
              handleSubmitAnswerWrapper(selectedAnswerText, 30); // 30 seconds as default time
            } else {
              let errorMsg = "Please select an answer before submitting.";
              
              // More detailed error for debugging
              if (selectedIndex !== undefined && 
                  currentQuestion && 
                  currentQuestion.options && 
                  (selectedIndex < 0 || selectedIndex >= currentQuestion.options.length)) {
                errorMsg = `Selected answer index (${selectedIndex}) is out of range for current question options (0-${currentQuestion.options.length-1}).`;
                console.error(errorMsg);
              }
              
              setErrorMessage(errorMsg);
              // Make the error message visible to the user
              const errorElement = document.querySelector(".error-message");
              if (errorElement) {
                errorElement.style.display = "block";
                // Scroll to error
                errorElement.scrollIntoView({ behavior: "smooth" });
                // Clear error after 3 seconds
                setTimeout(() => {
                  setErrorMessage("");
                }, 3000);
              }
            }
          }}>
            Submit Answer
          </button>
        )}
        {feedback && (
          <button className="button next-button" onClick={handleNextQuestion}>
            Next Question
          </button>
        )}
        <button className="button explain-button" onClick={handleExplainWrapper} disabled={isExplanationLoading}>
          {isExplanationLoading ? 'Loading...' : 'Explain'}
        </button>
        <button className="button hint-button" onClick={handleHintWrapper} disabled={isHintLoading}>
          {isHintLoading ? 'Loading...' : 'Hint'}
        </button>
      </div>
    </div>
  );
}

QuestionHandler.propTypes = {
  userId: PropTypes.string.isRequired,
  updateUserMetrics: PropTypes.func.isRequired,
  updatePerformanceData: PropTypes.func.isRequired,
  performanceData: PropTypes.arrayOf(PropTypes.shape({
    questionId: PropTypes.string,
    correct: PropTypes.number,
    incorrect: PropTypes.number,
  })),
};

export default QuestionHandler;
