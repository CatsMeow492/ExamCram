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
            setPerformanceData(data || {});
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


