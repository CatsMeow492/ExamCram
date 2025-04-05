export const handleAnswerSelect = (index, question, selectedAnswers, setSelectedAnswers) => {
    if (!question || !question.options) {
        console.error('Question or question options undefined in handleAnswerSelect');
        return;
    }
    
    setSelectedAnswers(prevSelected => {
        if (prevSelected.includes(index)) {
            return prevSelected.filter(selectedIndex => selectedIndex !== index);
        } else {
            return [...prevSelected, index];
        }
    });
};

export const handleSubmitAnswer = (selectedAnswers, question, setFeedback, updateUserMetrics, updatePerformanceData, currentQuestionId) => {
    if (!question || !question.options) {
        console.error('Question or question options undefined in handleSubmitAnswer');
        return false;
    }
    
    if (selectedAnswers.length > 0) {
        // Create an array of correct indices
        const correctIndices = question.options
            .map((option, index) => option.correct ? index : null)
            .filter(index => index !== null);
        
        // Check if selected answers match the correct answers
        const isCorrect = 
            selectedAnswers.length === correctIndices.length && 
            selectedAnswers.every(index => {
                const option = question.options[index];
                return option && option.correct;
            });
        
        let feedbackMessage = '';
        if (isCorrect) {
            feedbackMessage = 'Correct! Great job!';
        } else {
            const correctAnswersText = correctIndices
                .map(index => question.options[index].text)
                .join('\n');
            
            feedbackMessage = `Incorrect. The correct answer${correctIndices.length > 1 ? 's are' : ' is'}:\n${correctAnswersText}`;
        }
        
        setFeedback(feedbackMessage);
        if (updateUserMetrics) updateUserMetrics(isCorrect);
        if (updatePerformanceData && currentQuestionId) updatePerformanceData(currentQuestionId, isCorrect);
        return isCorrect;
    }
    return false;
};

export const handleExplain = (selectedAnswers, question, setIsExplanationLoading, setExplanation, correctAnswer) => {
    if (!question) {
        console.error('Question is undefined in handleExplain');
        return;
    }

    // Create a request body with the question and correct answer
    // Even if no answer is selected, we can still get an explanation
    const requestBody = {
        question: question.question,
        correctAnswers: [correctAnswer],
        selectedAnswers: []
    };
    
    // If there are selected answers, include them in the request
    if (selectedAnswers && selectedAnswers.length > 0) {
        const selectedOptionsText = selectedAnswers
            .map(index => (question.options && question.options[index]) ? question.options[index].text : '')
            .filter(text => text !== '');
        
        requestBody.selectedAnswers = selectedOptionsText;
    }
    
    setIsExplanationLoading(true);
    fetch(`http://localhost:8080/api/explain`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Explanation:', data.explanation);
            setExplanation(data.explanation);
        })
        .catch(error => {
            console.error('Error fetching explanation:', error);
        })
        .finally(() => {
            setIsExplanationLoading(false);
        });
};

export const handleHint = (question, setHint, setIsHintLoading) => {
    if (!question) {
        console.error('Question is undefined in handleHint');
        return;
    }
    
    const requestBody = {
        question: question.question,
    };
    
    setIsHintLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/api/hint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Hint:', data.hint);
                setHint(data.hint);
            })
            .catch(error => {
                console.error('Error fetching hint:', error);
            })
            .finally(() => {
                setIsHintLoading(false);
            });
};
