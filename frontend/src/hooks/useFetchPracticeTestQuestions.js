import { useCallback } from 'react';

const useFetchPracticeTestQuestions = (setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation) => {
  return useCallback(() => {
    // Fetch practice test questions logic here
    fetch(`${process.env.REACT_APP_API_URL}/api/practice-test-questions`)
      .then(response => response.json())
      .then(data => {
        setQuestion(data.question);
        setCurrentQuestionId(data.questionId);
        setSelectedAnswers([]);
        setFeedback(null);
        setExplanation(null);
      })
      .catch(error => console.error('Error fetching practice test questions:', error));
  }, [setQuestion, setCurrentQuestionId, setSelectedAnswers, setFeedback, setExplanation]);
};

export default useFetchPracticeTestQuestions;
