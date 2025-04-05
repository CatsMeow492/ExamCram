import { useState } from 'react';

const useFetchWorstQuestions = (userId, setQuestions) => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorstQuestions = async () => {
    setIsLoading(true);
    try {
      console.log(`Fetching worst questions for user ${userId}`);
      
      // Use the direct endpoint that we fixed in the backend
      const response = await fetch(`http://localhost:8080/api/practice-worst-questions/${userId}`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
      }

      const data = await response.json();
      console.log('Fetched worst questions:', data);
      
      if (Array.isArray(data)) {
        setQuestions(data);
      } else if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        console.error('Unexpected response format for worst questions:', data);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching worst questions:', error);
      // Use empty array on error
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return fetchWorstQuestions;
};

export default useFetchWorstQuestions;
