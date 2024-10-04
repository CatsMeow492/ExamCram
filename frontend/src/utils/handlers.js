export const handleAnswerSelect = (option, selectedAnswers, setSelectedAnswers) => {
    setSelectedAnswers(prevSelected => {
        if (prevSelected.includes(option)) {
            return prevSelected.filter(answer => answer !== option);
        } else {
            return [...prevSelected, option];
        }
    });
};

export const handleSubmitAnswer = (selectedAnswers, question, setFeedback, updateUserMetrics, updatePerformanceData, currentQuestionId) => {
    if (selectedAnswers.length > 0) {
        const isCorrect = selectedAnswers.every(answer => answer.correct) && selectedAnswers.length === question.options.filter(option => option.correct).length;
        setFeedback(isCorrect ? 'Correct!' : 'Incorrect!');
        updateUserMetrics(isCorrect);
        updatePerformanceData(currentQuestionId, isCorrect);
    }
};

export const handleExplain = (selectedAnswers, question, setIsExplanationLoading, setExplanation, correctAnswer) => {
    if (selectedAnswers.length > 0) {
        const requestBody = {
            question: question.question,
            selectedAnswers: selectedAnswers.map(answer => answer.text),
            correctAnswer: correctAnswer,
        };
        setIsExplanationLoading(true);
        fetch(`${process.env.REACT_APP_API_URL}/api/explain`, {
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
    } else {
        console.log('No selected answers to explain');
    }
};

export const handleHint = (question, setHint, setIsHintLoading) => {
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
