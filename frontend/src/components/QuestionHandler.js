import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import QuestionCard from './QuestionCard';
import useFetchRandomQuestion from '../hooks/useFetchRandomQuestion';
import useFetchPracticeTestQuestions from '../hooks/useFetchPracticeTestQuestions';
import useFetchWorstQuestions from '../hooks/useFetchWorstQuestions';
import { handleAnswerSelect, handleSubmitAnswer, handleExplain, handleHint } from '../utils/handlers';

function QuestionHandler({ userId, updateUserMetrics, updatePerformanceData, performanceData }) {
  const location = useLocation();
  const studyOption = location.state?.studyMode || 'random'; // Default to 'random' if not provided

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  const fetchRandomQuestionCallback = useFetchRandomQuestion(setQuestions);
  const fetchPracticeTestQuestionsCallback = useFetchPracticeTestQuestions(setQuestions);
  const fetchWorstQuestionsCallback = useFetchWorstQuestions(userId, setQuestions);
  console.log('Study option in QuestionHandler:', studyOption);

  useEffect(() => {
    setPerformanceMetrics(performanceData);
    console.log('Performance metrics in QuestionHandler:', performanceMetrics);
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
  }, [studyOption, fetchRandomQuestionCallback, fetchPracticeTestQuestionsCallback, fetchWorstQuestionsCallback]);

  useEffect(() => {
    // Fetch performance metrics for the current question
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
  };

  return (
    <QuestionCard
      question={currentQuestion}
      selectedAnswers={selectedAnswers}
      handleAnswerSelect={(option) => handleAnswerSelect(option, selectedAnswers, setSelectedAnswers)}
      handleSubmitAnswer={() => handleSubmitAnswer(selectedAnswers, currentQuestion, setFeedback, updateUserMetrics, updatePerformanceData, currentQuestion?.id)}
      feedback={feedback}
      handleExplain={() => handleExplain(selectedAnswers, currentQuestion, setLoading, setExplanation)}
      loading={loading}
      explanation={explanation}
      fetchRandomQuestion={fetchNextQuestion}
      handleHint={() => handleHint(currentQuestion)}
      performanceMetrics={performanceMetrics} // Pass performance metrics to QuestionCard
      studyMode={studyOption}
    />
  );
}

export default QuestionHandler;
