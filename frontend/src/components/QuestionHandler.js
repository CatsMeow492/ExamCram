import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import QuestionCard from './QuestionCard';
import PracticeTestResults from './PracticeTestResults';
import useFetchRandomQuestion from '../hooks/useFetchRandomQuestion';
import useFetchPracticeTestQuestions from '../hooks/useFetchPracticeTestQuestions';
import useFetchWorstQuestions from '../hooks/useFetchWorstQuestions';
import { handleAnswerSelect, handleSubmitAnswer, handleExplain, handleHint } from '../utils/handlers';

const PRACTICE_TEST_LENGTH = 5;

function QuestionHandler({ userId, updateUserMetrics, updatePerformanceData, performanceData }) {
  const location = useLocation();
  const studyOption = location.state?.studyMode || 'random';

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
  
  // Separate loading states
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);

  const fetchRandomQuestionCallback = useFetchRandomQuestion(setQuestions);
  const fetchPracticeTestQuestionsCallback = useFetchPracticeTestQuestions(setQuestions);
  const fetchWorstQuestionsCallback = useFetchWorstQuestions(userId, setQuestions);

  const fetchQuestion = useCallback(() => {
    setIsQuestionLoading(true);
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
    setIsQuestionLoading(false);
  }, [studyOption, fetchRandomQuestionCallback, fetchPracticeTestQuestionsCallback, fetchWorstQuestionsCallback]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  useEffect(() => {
    if (questions.length > 0 && initialQuestions.length === 0) {
      setInitialQuestions(questions);
    }
  }, [questions, initialQuestions]);

  useEffect(() => {
    setPerformanceMetrics(performanceData);
  }, [performanceData]);

  useEffect(() => {
    if (questions.length > 0) {
      const currentQuestionId = questions[currentQuestionIndex]?.id;
      if (currentQuestionId) {
        fetch(`${process.env.REACT_APP_API_URL}/api/performance?userId=${userId}&questionId=${currentQuestionId}`)
          .then(response => response.json())
          .then(data => setPerformanceMetrics(data))
          .catch(error => console.error('Error fetching performance metrics:', error));
      }
    }
  }, [questions, currentQuestionIndex, userId]);

  useEffect(() => {
    if (studyOption === 'practice-test' && questions.length > PRACTICE_TEST_LENGTH) {
      // Slice the questions array to only include the first PRACTICE_TEST_LENGTH questions
      setQuestions(questions.slice(0, PRACTICE_TEST_LENGTH));
    }
  }, [questions, studyOption]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleSubmitAnswerWrapper = () => {
    if (selectedAnswers.length === 0) {
      setFeedback("Please select an answer before submitting.");
      return;
    }

    const isCorrect = handleSubmitAnswer(
      selectedAnswers,
      currentQuestion,
      setFeedback,
      updateUserMetrics,
      updatePerformanceData,
      currentQuestion?.id
    );

    if (studyOption === 'practice-test') {
      if (!isCorrect) {
        setWrongQuestions(prev => [...prev, currentQuestion]);
      }

      // Wait 3 seconds before moving to next question
      setTimeout(() => {
        if (currentQuestionIndex < PRACTICE_TEST_LENGTH - 1) {
          setCurrentQuestionIndex(prevIndex => prevIndex + 1);
          setSelectedAnswers([]);
          setFeedback(null);
        } else {
          // Calculate score
          const score = ((PRACTICE_TEST_LENGTH - wrongQuestions.length) / PRACTICE_TEST_LENGTH) * 100;
          setTestScore(score);
          setShowResults(true);

          // If score is below 80%, generate study guide
          if (score < 80) {
            fetch(`${process.env.REACT_APP_API_URL}/api/generate-study-guide`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId,
                wrongQuestions,
                score,
              }),
            })
              .then(response => response.json())
              .then(data => {
                setStudyGuide(data.studyGuide);
              })
              .catch(error => console.error('Error generating study guide:', error));
          }
        }
      }, 3000);
    } else {
      // For non-practice test modes, wait 3 seconds before fetching next question
      setTimeout(() => {
        fetchQuestion();
        setSelectedAnswers([]);
        setFeedback(null);
      }, 3000);
    }
  };

  const fetchNextQuestion = () => {
    setSelectedAnswers([]);
    setFeedback(null);
    setExplanation(null);
    setHint(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      fetchQuestion();
    }
  };

  const handleExplainWrapper = () => {
    setIsExplanationLoading(true);
    const correctAnswer = currentQuestion.options.find(option => option.correct).text;
    handleExplain(selectedAnswers, currentQuestion, setIsExplanationLoading, setExplanation, correctAnswer);
  };

  const handleHintWrapper = () => {
    setIsHintLoading(true);
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
    fetchQuestion();
  };

  const handleRetryWithSameQuestions = () => {
    setShowResults(false);
    setWrongQuestions([]);
    setStudyGuide(null);
    setTestScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setFeedback(null);
    setQuestions(initialQuestions);
  };

  if (isQuestionLoading) {
    return <div>Loading question...</div>;
  }

  if (showResults) {
    return (
      <PracticeTestResults
        score={testScore}
        wrongQuestions={wrongQuestions}
        studyGuide={studyGuide}
        onRetry={handleRetry}
        onRetryWithSameQuestions={handleRetryWithSameQuestions}
      />
    );
  }

  return (
    <QuestionCard
      question={currentQuestion}
      selectedAnswers={selectedAnswers}
      handleAnswerSelect={(option) => handleAnswerSelect(option, selectedAnswers, setSelectedAnswers)}
      handleSubmitAnswer={handleSubmitAnswerWrapper}
      feedback={feedback}
      handleExplain={handleExplainWrapper}
      isExplanationLoading={isExplanationLoading}
      explanation={explanation}
      fetchRandomQuestion={fetchNextQuestion}
      handleHint={handleHintWrapper}
      isHintLoading={isHintLoading}
      hint={hint}
      performanceMetrics={performanceMetrics}
      studyMode={studyOption}
    />
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

QuestionHandler.defaultProps = {
  performanceData: [],
};

export default QuestionHandler;
