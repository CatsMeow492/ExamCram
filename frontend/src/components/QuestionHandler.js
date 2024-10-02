import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import useFetchRandomQuestion from '../hooks/useFetchRandomQuestion';
import useFetchPracticeTestQuestions from '../hooks/useFetchPracticeTestQuestions';
import useFetchWorstQuestions from '../hooks/useFetchWorstQuestions';
import { handleAnswerSelect, handleSubmitAnswer, handleExplain, handleHint } from '../utils/handlers';

function QuestionHandler({ userId, updateUserMetrics, updatePerformanceData }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRandomQuestionCallback = useFetchRandomQuestion(setQuestions);
  const fetchPracticeTestQuestionsCallback = useFetchPracticeTestQuestions(setQuestions);
  const fetchWorstQuestionsCallback = useFetchWorstQuestions(userId, setQuestions);

  useEffect(() => {
    const studyOption = window.location.pathname.split('/').pop();
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
  }, [fetchRandomQuestionCallback, fetchPracticeTestQuestionsCallback, fetchWorstQuestionsCallback]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % questions.length);
    setSelectedAnswers([]);
    setFeedback(null);
    setExplanation(null);
  };

  return (
    <>
      {currentQuestion ? (
        <QuestionCard
          question={currentQuestion}
          selectedAnswers={selectedAnswers}
          handleAnswerSelect={(option) => handleAnswerSelect(option, selectedAnswers, setSelectedAnswers)}
          handleSubmitAnswer={() => handleSubmitAnswer(selectedAnswers, currentQuestion, setFeedback, updateUserMetrics, updatePerformanceData, currentQuestion.id)}
          feedback={feedback}
          handleExplain={() => handleExplain(selectedAnswers, currentQuestion, setLoading, setExplanation)}
          handleHint={() => handleHint(currentQuestion, setLoading, setExplanation)}
          loading={loading}
          explanation={explanation}
          fetchRandomQuestion={handleNextQuestion}
        />
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
}

export default QuestionHandler;
