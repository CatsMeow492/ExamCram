import { useCallback } from 'react';
import { fetchPracticeTestQuestions } from '../api/data';

const useFetchPracticeTestQuestions = (setQuestions) => {
  return useCallback(() => {
    fetchPracticeTestQuestions(setQuestions);
  }, [setQuestions]);
};

export default useFetchPracticeTestQuestions;
