import { useCallback } from 'react';
import { fetchUserMetrics } from '../api/data';

const useFetchUserMetrics = (userId, setCorrectAnswers, setIncorrectAnswers) => {
  return useCallback(() => {
    fetchUserMetrics(userId, setCorrectAnswers, setIncorrectAnswers);
  }, [userId, setCorrectAnswers, setIncorrectAnswers]);
};

export default useFetchUserMetrics;
