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

export const handleExplain = (selectedAnswers, question, setLoading, setExplanation) => {
    if (selectedAnswers.length > 0) {
        const requestBody = {
            question: question.question,
            selectedAnswers: selectedAnswers.map(answer => answer.text),
        };
        setLoading(true);
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
                setExplanation(data.explanation);
            })
            .catch(error => {
                console.error('Error fetching explanation:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    } else {
        console.log('No selected answers to explain');
    }
};
