import { useCallback } from 'react';
import { fetchRandomQuestion } from '../api/data';

const useFetchRandomQuestion = (setQuestions) => {
  return useCallback(() => {
    fetchRandomQuestion(setQuestions);
  }, [setQuestions]);
};

export default useFetchRandomQuestion;
