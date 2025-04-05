export const fetchUserMetrics = (userId, setCorrectAnswers, setIncorrectAnswers) => {
    fetch(`/api/metrics?userId=${userId}`)
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            return response.text().then(text => {
                console.log('Response text:', text); // Log the response text
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                try {
                    return JSON.parse(text); // Attempt to parse JSON
                } catch (e) {
                    throw new Error(`Failed to parse JSON: ${e.message}`);
                }
            });
        })
        .then(data => {
            console.log('Fetched user metrics:', data); // Log the fetched data
            setCorrectAnswers(data.correctAnswers || 0);
            setIncorrectAnswers(data.incorrectAnswers || 0);
            console.log('Correct Answers (state):', data.correctAnswers);
            console.log('Incorrect Answers (state):', data.incorrectAnswers);
        })
        .catch(error => console.error('Error fetching user metrics:', error));
};

export const fetchPerformanceData = (userId, setPerformanceData) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/performance?userId=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Format the data as expected by PerformanceMetrics
            // The component expects an array of objects with correct and incorrect properties
            console.log('Raw performance data:', data);
            
            // Transform the data if it's not already in the expected format
            let formattedData = data;
            
            // If the data is an array of objects with QuestionId, Correct, and Incorrect properties
            // (format from the backend), transform it to the format expected by PerformanceMetrics
            if (Array.isArray(data) && data.length > 0 && 'QuestionId' in data[0]) {
                formattedData = data.map(item => ({
                    questionId: item.QuestionId,
                    correct: item.Correct,
                    incorrect: item.Incorrect
                }));
            }
            
            console.log('Formatted performance data:', formattedData);
            setPerformanceData(formattedData);
        })
        .catch(error => console.error('Error fetching performance data:', error));
};

export const fetchRandomQuestion = (setQuestions) => {
    console.log('Fetching random question...');
    fetch(`${process.env.REACT_APP_API_URL}/api/question/random`)
        .then(response => {
            console.log('Response:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Random question data:', data);
            setQuestions([data]); // Wrap the question in an array
        })
        .catch(error => console.error('Error fetching question:', error));
};

export const fetchWorstQuestions = (userId, setWorstQuestions) => {
    console.log(`Fetching worst questions for userId: ${userId}`);
    fetch(`${process.env.REACT_APP_API_URL}/api/worst-questions?userId=${userId}`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched worst questions:', data);
            setWorstQuestions(data);
        })
        .catch(error => console.error('Error fetching worst questions:', error));
};

export const fetchPracticeTestQuestions = (setQuestions) => {
    // Add a timestamp to the request body, but don't use custom headers
    const requestTimestamp = Date.now();
    console.log(`Fetching practice test questions, timestamp: ${requestTimestamp}`);
    
    fetch(`${process.env.REACT_APP_API_URL}/api/practice-test-questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // Removed 'X-Request-ID' header to prevent CORS issues
        },
        body: JSON.stringify({ 
            userId: localStorage.getItem('userId'),
            timestamp: requestTimestamp // Keep timestamp in the body
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Practice test questions loaded (timestamp: ${requestTimestamp}):`, data);
            if (data && data.questions && Array.isArray(data.questions)) {
                console.log(`Loaded ${data.questions.length} questions`);
                setQuestions(data.questions);
            } else {
                console.error('Received invalid practice test data format:', data);
            }
        })
        .catch(error => console.error(`Error fetching practice test questions (timestamp: ${requestTimestamp}):`, error));
};

export const generateStudyGuide = (userId, wrongQuestions, score) => {
    return fetch(`${process.env.REACT_APP_API_URL}/api/generate-study-guide`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId,
            wrongQuestions,
            score,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error generating study guide:', error);
            throw error;
        });
};


