import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import QuestionCard from './QuestionCard';
import useFetchRandomQuestion from '../hooks/useFetchRandomQuestion';
import useFetchPracticeTestQuestions from '../hooks/useFetchPracticeTestQuestions';
import useFetchWorstQuestions from '../hooks/useFetchWorstQuestions';
import { handleAnswerSelect, handleSubmitAnswer, handleExplain, handleHint } from '../utils/handlers';

function QuestionHandler({ userId, updateUserMetrics, updatePerformanceData, performanceData }) {
  const location = useLocation();
  const studyOption = location.state?.studyMode || 'random';

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [hint, setHint] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  
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

  const currentQuestion = questions[currentQuestionIndex];

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

  const handleSubmitAnswerWrapper = () => {
    handleSubmitAnswer(
      selectedAnswers,
      currentQuestion,
      setFeedback,
      updateUserMetrics,
      updatePerformanceData,
      currentQuestion?.id
    );
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

  if (isQuestionLoading) {
    return <div>Loading question...</div>;
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

export default QuestionHandler;
