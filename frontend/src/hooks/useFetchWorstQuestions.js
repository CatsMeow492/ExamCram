import { useCallback } from 'react';
import { fetchWorstQuestions } from '../api/data';

const useFetchWorstQuestions = (userId, setWorstQuestions) => {
  return useCallback(() => {
    fetchWorstQuestions(userId, setWorstQuestions);
  }, [userId, setWorstQuestions]);
};

export default useFetchWorstQuestions;
