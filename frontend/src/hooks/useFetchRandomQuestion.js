import { useCallback } from 'react';
import { fetchRandomQuestion } from '../api/data';

const useFetchRandomQuestion = (setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation) => {
  return useCallback(() => {
    fetchRandomQuestion(setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation);
  }, [setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation]);
};

export default useFetchRandomQuestion;
