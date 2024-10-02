import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import useFetchRandomQuestion from '../hooks/useFetchRandomQuestion';
import useFetchPracticeTestQuestions from '../hooks/useFetchWorstQuestions';
import useFetchWorstQuestions from '../hooks/useFetchWorstQuestions';
import { handleAnswerSelect, handleSubmitAnswer, handleExplain, handleHint } from '../utils/handlers';

function QuestionHandler({ userId, updateUserMetrics, updatePerformanceData }) {
  const [question, setQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);

  const fetchRandomQuestionCallback = useFetchRandomQuestion(setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation);
  const fetchPracticeTestQuestionsCallback = useFetchPracticeTestQuestions(setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation);
  const fetchWorstQuestionsCallback = useFetchWorstQuestions(setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation);

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

  return (
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
    </>
  );
}

export default QuestionHandler;
