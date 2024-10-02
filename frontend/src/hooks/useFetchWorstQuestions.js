import { useCallback } from 'react';

const useFetchWorstQuestions = (setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation) => {
  return useCallback(() => {
    // Fetch worst questions logic here
    fetch(`${process.env.REACT_APP_API_URL}/api/worst-questions`)
      .then(response => response.json())
      .then(data => {
        setQuestion(data.question);
        setCurrentQuestionId(data.questionId);
        setSelectedAnswers([]);
        setFeedback(null);
        setExplanation(null);
      })
      .catch(error => console.error('Error fetching worst questions:', error));
  }, [setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation]);
};

export default useFetchWorstQuestions;
