import { useCallback, useState } from 'react';
import { fetchPracticeTestQuestions } from '../api/data';

const useFetchPracticeTestQuestions = (setQuestions) => {
  // Add a state to track last fetch time
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  return useCallback(() => {
    // Set a minimum time between fetches (500ms) to prevent rapid duplicate calls
    const now = Date.now();
    if (now - lastFetchTime < 500) {
      console.log("Throttling practice test questions fetch - too soon since last fetch");
      return;
    }
    
    setLastFetchTime(now);
    console.log("Initiating practice test questions fetch from hook");
    fetchPracticeTestQuestions(setQuestions);
  }, [setQuestions, lastFetchTime, setLastFetchTime]);
};

export default useFetchPracticeTestQuestions;
