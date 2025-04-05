package main

import (
	"backend/types" // Import the types package
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/gorilla/mux"
	openai "github.com/sashabaranov/go-openai"
)

var maxTokens = 350

func GetQuestionsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(questions)
}

func GetRandomQuestionHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Received request to /api/question/random")
	rand.Seed(time.Now().UnixNano())
	randomQuestion := questions[rand.Intn(len(questions))]
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(randomQuestion)
}

func ExplainHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Received request to /explain")
	var req types.ExplainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Initialize OpenAI client
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

	// Join the correct answers into a single string
	correctAnswersStr := strings.Join(req.CorrectAnswers, ", ")

	var prompt string
	if len(req.SelectedAnswers) > 0 {
		// If the user has selected answers, include them in the explanation
		prompt = fmt.Sprintf(
			"Question: %s\nSelected Answer(s): %s\nCorrect Answer(s): %s\n"+
				"Explanation: Please provide a comprehensive explanation that covers the following points:\n"+
				"1. Why the correct answer(s) is/are correct.\n"+
				"2. If the selected answer(s) is/are incorrect, explain why it's/they're wrong.\n"+
				"3. Provide any additional context or information that helps understand the concept better.\n"+
				"Please explain in a simple, intuitive, and easy-to-remember way. Limit your response to %d words.",
			req.Question,
			strings.Join(req.SelectedAnswers, ", "),
			correctAnswersStr,
			maxTokens)
	} else {
		// If no answers are selected, just explain the correct answer
		prompt = fmt.Sprintf(
			"Question: %s\nCorrect Answer(s): %s\n"+
				"Explanation: Please provide a comprehensive explanation that covers the following points:\n"+
				"1. Why the correct answer(s) is/are correct.\n"+
				"2. Explain why each of the other possible options would be incorrect.\n"+
				"3. Provide any additional context or information that helps understand the concept better.\n"+
				"Please explain in a simple, intuitive, and easy-to-remember way. Limit your response to %d words.",
			req.Question,
			correctAnswersStr,
			maxTokens)
	}

	resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
		Model: openai.GPT4o,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		MaxTokens: maxTokens,
	})
	if err != nil {
		log.Println("Error calling OpenAI API:", err)
		http.Error(w, "Error generating explanation", http.StatusInternalServerError)
		return
	}

	explanation := resp.Choices[0].Message.Content

	response := map[string]string{
		"explanation": explanation,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Println("Error encoding response:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func GetUserMetricsHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		http.Error(w, "Missing userId", http.StatusBadRequest)
		return
	}

	metrics, exists := getUserMetrics(userID)
	if !exists {
		// If user doesn't exist yet, return empty metrics
		metrics = types.UserMetrics{
			UserId:           userID,
			CorrectAnswers:   0,
			IncorrectAnswers: 0,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func UpdateUserMetricsHandler(w http.ResponseWriter, r *http.Request) {
	var metrics types.UserMetrics

	if err := json.NewDecoder(r.Body).Decode(&metrics); err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("Decoded metrics: %+v\n", metrics)

	if metrics.UserId == "" {
		log.Println("UserId is required")
		http.Error(w, "UserId is required", http.StatusBadRequest)
		return
	}

	// Update metrics in our in-memory storage
	updateUserMetrics(metrics)

	// Return the updated metrics
	updatedMetrics, _ := getUserMetrics(metrics.UserId)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedMetrics)
}

func UpdatePerformanceDataHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserId         string `json:"userId"`
		QuestionId     string `json:"questionId"`
		IsCorrect      bool   `json:"isCorrect"`
		TimeTaken      int    `json:"timeTaken"`
		IsPracticeTest bool   `json:"isPracticeTest"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("DEBUG: Received UpdatePerformanceData request: userId=%s, questionId=%s, isCorrect=%v, isPracticeTest=%v",
		req.UserId, req.QuestionId, req.IsCorrect, req.IsPracticeTest)

	// Validate required fields
	if req.UserId == "" || req.QuestionId == "" {
		log.Println("UserId and QuestionId are required but missing")
		http.Error(w, "UserId and QuestionId are required", http.StatusBadRequest)
		return
	}

	// Record this attempt in the history
	type Attempt struct {
		UserId         string    `json:"userId"`
		QuestionId     string    `json:"questionId"`
		IsCorrect      bool      `json:"isCorrect"`
		TimeTaken      int       `json:"timeTaken"`
		IsPracticeTest bool      `json:"isPracticeTest"`
		Timestamp      time.Time `json:"timestamp"`
	}

	attempt := Attempt{
		UserId:         req.UserId,
		QuestionId:     req.QuestionId,
		IsCorrect:      req.IsCorrect,
		TimeTaken:      req.TimeTaken,
		IsPracticeTest: req.IsPracticeTest,
		Timestamp:      time.Now(),
	}

	// Path to the history file
	historyFile := filepath.Join(".", "attempts-history.json")

	// Read existing history if it exists
	var history []Attempt
	historyData, err := os.ReadFile(historyFile)
	if err == nil {
		// File exists, parse it
		if err := json.Unmarshal(historyData, &history); err != nil {
			log.Printf("ERROR: Parsing existing history file: %v", err)
			// Continue with empty history if we can't parse the file
			history = []Attempt{}
		}
	} else if !os.IsNotExist(err) {
		// Some error other than file not existing
		log.Printf("ERROR: Reading history file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Add new attempt to history
	history = append(history, attempt)

	// Write updated history back to file
	updatedHistoryData, err := json.MarshalIndent(history, "", "  ")
	if err != nil {
		log.Printf("ERROR: Marshalling history data: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(historyFile, updatedHistoryData, 0644); err != nil {
		log.Printf("ERROR: Writing history file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("DEBUG: Successfully added attempt to history file")

	// Update question statistics
	type QuestionStat struct {
		QuestionId string    `json:"questionId"`
		UserId     string    `json:"userId"`
		Correct    int       `json:"correct"`
		Incorrect  int       `json:"incorrect"`
		LastUpdate time.Time `json:"lastUpdate"`
	}

	// Path to the stats file
	statsFile := filepath.Join(".", "question-stats.json")

	// Read existing stats if they exist
	var stats []QuestionStat
	statsData, err := os.ReadFile(statsFile)
	if err == nil {
		// File exists, parse it
		if err := json.Unmarshal(statsData, &stats); err != nil {
			log.Printf("ERROR: Parsing existing stats file: %v", err)
			// Continue with empty stats if we can't parse the file
			stats = []QuestionStat{}
		}
	} else if !os.IsNotExist(err) {
		// Some error other than file not existing
		log.Printf("ERROR: Reading stats file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Find the stat entry for this user+question or create a new one
	var statUpdated bool
	for i, stat := range stats {
		if stat.UserId == req.UserId && stat.QuestionId == req.QuestionId {
			// Update existing stat
			if req.IsCorrect {
				stats[i].Correct++
			} else {
				stats[i].Incorrect++
			}
			stats[i].LastUpdate = time.Now()
			statUpdated = true
			break
		}
	}

	if !statUpdated {
		// Create new stat
		newStat := QuestionStat{
			QuestionId: req.QuestionId,
			UserId:     req.UserId,
			Correct:    0,
			Incorrect:  0,
			LastUpdate: time.Now(),
		}

		// Increment the appropriate counter
		if req.IsCorrect {
			newStat.Correct = 1
		} else {
			newStat.Incorrect = 1
		}

		stats = append(stats, newStat)
	}

	// Write updated stats back to file
	updatedStatsData, err := json.MarshalIndent(stats, "", "  ")
	if err != nil {
		log.Printf("ERROR: Marshalling stats data: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if err := os.WriteFile(statsFile, updatedStatsData, 0644); err != nil {
		log.Printf("ERROR: Writing stats file: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("DEBUG: Successfully updated question statistics")

	// Also update performance data in our in-memory storage
	updatePerformanceData(req.UserId, req.QuestionId, req.IsCorrect)

	// Also write to local-data.json for backward compatibility
	attemptData, err := json.MarshalIndent(attempt, "", "  ")
	if err != nil {
		log.Printf("ERROR: Marshalling attempt data for local-data.json: %v", err)
	} else if err := os.WriteFile(filepath.Join(".", "local-data.json"), attemptData, 0644); err != nil {
		log.Printf("ERROR: Writing to local-data.json: %v", err)
	}

	w.WriteHeader(http.StatusOK)
}

// Helper function to get current directory
func getCurrentDirectory() string {
	dir, err := os.Getwd()
	if err != nil {
		log.Printf("ERROR: Failed to get current working directory: %v", err)
		return "unknown"
	}
	return dir
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDToken string `json:"idToken"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// In local mode, we'll just create a mock user based on the token
	// In a real implementation, you would verify the token with Google
	user := types.User{
		UserID:  req.IDToken, // Use the token as a user ID for simplicity
		Email:   "local@example.com",
		Name:    "Local User",
		Picture: "https://example.com/profile.jpg",
	}

	// Save the user
	saveUser(user)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func GetPerformanceDataHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	questionID := r.URL.Query().Get("questionId")

	log.Printf("GetPerformanceDataHandler called with userId=%s, questionId=%s", userID, questionID)

	if userID == "" {
		http.Error(w, "Missing userId", http.StatusBadRequest)
		return
	}

	// Read performance data from question-stats.json directly
	statsFile := filepath.Join(".", "question-stats.json")
	statsData, err := os.ReadFile(statsFile)
	if err != nil {
		log.Printf("ERROR: Failed to read stats file: %v", err)
		http.Error(w, "Failed to read performance data", http.StatusInternalServerError)
		return
	}

	type QuestionStat struct {
		QuestionId string    `json:"questionId"`
		UserId     string    `json:"userId"`
		Correct    int       `json:"correct"`
		Incorrect  int       `json:"incorrect"`
		LastUpdate time.Time `json:"lastUpdate"`
	}

	var allStats []QuestionStat
	if err := json.Unmarshal(statsData, &allStats); err != nil {
		log.Printf("ERROR: Failed to parse stats file: %v", err)
		http.Error(w, "Failed to parse performance data", http.StatusInternalServerError)
		return
	}

	// If questionId is provided, return just that one metric as an object (not an array)
	if questionID != "" {
		log.Printf("Looking for specific question performance: %s", questionID)
		var foundStat *types.PerformanceData

		for _, stat := range allStats {
			if stat.UserId == userID && stat.QuestionId == questionID {
				foundStat = &types.PerformanceData{
					QuestionId: stat.QuestionId,
					Correct:    stat.Correct,
					Incorrect:  stat.Incorrect,
				}
				break
			}
		}

		if foundStat != nil {
			log.Printf("Found performance metric for questionId=%s: correct=%d, incorrect=%d",
				questionID, foundStat.Correct, foundStat.Incorrect)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(foundStat)
		} else {
			log.Printf("No performance data found for questionId=%s", questionID)
			// Return an empty object with the questionId instead of an empty array
			emptyMetric := types.PerformanceData{
				QuestionId: questionID,
				Correct:    0,
				Incorrect:  0,
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(emptyMetric)
		}
		return
	}

	// Otherwise filter stats for this user and return as array
	userStats := make([]types.PerformanceData, 0)
	for _, stat := range allStats {
		if stat.UserId == userID {
			userStats = append(userStats, types.PerformanceData{
				QuestionId: stat.QuestionId,
				Correct:    stat.Correct,
				Incorrect:  stat.Incorrect,
			})
		}
	}

	log.Printf("Returning %d performance records for user %s", len(userStats), userID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userStats)
}

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func HintHandler(w http.ResponseWriter, r *http.Request) {
	var req types.HintRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

	prompt := fmt.Sprintf(
		"I'm studying for an exam and struggling with this question: '%s'\n"+
			"Please provide a hint that nudges me in the right direction without giving away the answer. "+
			"The hint should be clear enough to help me understand the concept, but vague enough that I still need to think about it.",
		req.Question,
	)

	resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
		Model: openai.GPT4o,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		MaxTokens: 150,
	})
	if err != nil {
		log.Println("Error calling OpenAI API:", err)
		http.Error(w, "Error generating hint", http.StatusInternalServerError)
		return
	}

	hint := resp.Choices[0].Message.Content

	response := map[string]string{
		"hint": hint,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetWorstQuestionsHandler(w http.ResponseWriter, r *http.Request) {
	// First try to get userId from URL vars (for /api/practice-worst-questions/{userId})
	vars := mux.Vars(r)
	userID := vars["userId"]

	// If not found in URL vars, try query parameters (for /api/worst-questions?userId=xxx)
	if userID == "" {
		userID = r.URL.Query().Get("userId")
	}

	// If still not found, return an error
	if userID == "" {
		http.Error(w, "Missing userId in path or query parameters", http.StatusBadRequest)
		return
	}

	log.Printf("GetWorstQuestionsHandler: Processing request for userId=%s", userID)

	limit := 10 // Default limit to 10 worst questions

	// Get performance data from question-stats.json instead of in-memory storage
	statsFile := filepath.Join(".", "question-stats.json")
	statsData, err := os.ReadFile(statsFile)
	if err != nil {
		log.Printf("ERROR: Failed to read stats file: %v", err)
		http.Error(w, "Failed to read performance data", http.StatusInternalServerError)
		return
	}

	type QuestionStat struct {
		QuestionId string    `json:"questionId"`
		UserId     string    `json:"userId"`
		Correct    int       `json:"correct"`
		Incorrect  int       `json:"incorrect"`
		LastUpdate time.Time `json:"lastUpdate"`
	}

	var allStats []QuestionStat
	if err := json.Unmarshal(statsData, &allStats); err != nil {
		log.Printf("ERROR: Failed to parse stats file: %v", err)
		http.Error(w, "Failed to parse performance data", http.StatusInternalServerError)
		return
	}

	// Filter stats for this user
	userStats := make(map[string]types.PerformanceData)
	for _, stat := range allStats {
		if stat.UserId == userID {
			userStats[stat.QuestionId] = types.PerformanceData{
				QuestionId: stat.QuestionId,
				Correct:    stat.Correct,
				Incorrect:  stat.Incorrect,
			}
		}
	}

	// Create a slice to sort
	type QuestionPerformance struct {
		QuestionID string
		Score      float64 // Lower is worse
	}

	performanceSlice := make([]QuestionPerformance, 0, len(userStats))
	for questionID, data := range userStats {
		// Calculate a score - prioritize questions with more incorrect answers
		// and a low correct/incorrect ratio
		total := data.Correct + data.Incorrect
		if total == 0 {
			continue // Skip questions with no attempts
		}

		// Score formula: incorrect answers have more weight than correct ones
		score := float64(data.Correct) / float64(total)

		performanceSlice = append(performanceSlice, QuestionPerformance{
			QuestionID: questionID,
			Score:      score,
		})
	}

	// If no performance data is found, return a random selection of questions
	if len(performanceSlice) == 0 {
		log.Printf("No performance data found for user %s, returning random questions", userID)
		GetPracticeTestQuestionsHandler(w, r) // Reuse existing handler for random questions
		return
	}

	// Sort by score (lower is worse)
	sort.Slice(performanceSlice, func(i, j int) bool {
		return performanceSlice[i].Score < performanceSlice[j].Score
	})

	// Limit the number of questions
	if len(performanceSlice) > limit {
		performanceSlice = performanceSlice[:limit]
	}

	// Get the actual question objects
	worstQuestions := make([]types.Question, 0, len(performanceSlice))
	for _, perf := range performanceSlice {
		if question, exists := questionsByID[perf.QuestionID]; exists {
			worstQuestions = append(worstQuestions, question)
		}
	}

	// If we couldn't find enough matching questions, pad with random ones
	if len(worstQuestions) < 5 {
		log.Printf("Only found %d worst questions for user %s, adding random questions", len(worstQuestions), userID)

		// Make a copy of all questions to shuffle
		questionPool := make([]types.Question, len(questions))
		copy(questionPool, questions)

		// Shuffle the questions
		rand.Seed(time.Now().UnixNano())
		rand.Shuffle(len(questionPool), func(i, j int) {
			questionPool[i], questionPool[j] = questionPool[j], questionPool[i]
		})

		// Add random questions until we have at least 5
		for _, q := range questionPool {
			// Skip if already in worstQuestions
			alreadyIncluded := false
			for _, wq := range worstQuestions {
				if wq.ID == q.ID {
					alreadyIncluded = true
					break
				}
			}

			if !alreadyIncluded {
				worstQuestions = append(worstQuestions, q)
				if len(worstQuestions) >= 5 {
					break
				}
			}
		}
	}

	log.Printf("Returning %d worst questions for user %s", len(worstQuestions), userID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(worstQuestions)
}

func GetPracticeTestQuestionsHandler(w http.ResponseWriter, r *http.Request) {
	// Only try to decode the body for POST requests
	if r.Method == "POST" {
		var req types.PracticeTestRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Println("Error decoding request body:", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		// For future use - we could personalize questions based on userId
		// userId := req.UserId
	} else {
		// For GET requests, userId could be in query parameters
		// userId := r.URL.Query().Get("userId")
	}

	// For a practice test, let's select 5 random questions
	// In a more sophisticated implementation, this could be personalized
	// based on the user's performance
	numQuestions := 5
	if len(questions) < numQuestions {
		numQuestions = len(questions)
	}

	// Make a copy of the questions to shuffle
	questionPool := make([]types.Question, len(questions))
	copy(questionPool, questions)

	// Shuffle the questions
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(questionPool), func(i, j int) {
		questionPool[i], questionPool[j] = questionPool[j], questionPool[i]
	})

	// Take the first numQuestions
	testQuestions := questionPool[:numQuestions]

	response := types.PracticeTestResponse{
		Questions: testQuestions,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GenerateStudyGuideHandler(w http.ResponseWriter, r *http.Request) {
	var req types.StudyGuideRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Extract question texts from the wrong questions
	var wrongQuestionTexts []string
	for _, q := range req.WrongQuestions {
		wrongQuestionTexts = append(wrongQuestionTexts, q.Question)
	}

	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

	prompt := fmt.Sprintf(
		"You scored %.1f%% on your practice test. Here are the questions you got wrong:\n\n%s\n\n"+
			"Based on these questions, generate a focused study guide that:\n"+
			"1. Identifies the key concepts you should review\n"+
			"2. Provides explanations of these concepts\n"+
			"3. Offers memory aids or techniques to help you remember\n"+
			"4. Suggests practice exercises\n\n"+
			"Make the study guide concise but comprehensive. Focus on the areas where you seem to be struggling the most.",
		req.Score*100,
		strings.Join(wrongQuestionTexts, "\n"),
	)

	resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
		Model: openai.GPT4o,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		MaxTokens: 1000,
	})
	if err != nil {
		log.Println("Error calling OpenAI API:", err)
		http.Error(w, "Error generating study guide", http.StatusInternalServerError)
		return
	}

	studyGuide := resp.Choices[0].Message.Content

	response := types.StudyGuideResponse{
		StudyGuide: studyGuide,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func SubmitAnswerHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		QuestionId     string `json:"questionId"`
		Answer         string `json:"answer"`
		UserId         string `json:"userId"`
		Time           int    `json:"time"`
		IsPracticeTest bool   `json:"isPracticeTest"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("DEBUG: Received SubmitAnswer request: userId=%s, questionId=%s, answer=%s",
		req.UserId, req.QuestionId, req.Answer)

	// Find the question to evaluate the answer
	var correctAnswer string
	var isCorrect bool

	for _, q := range questions {
		if q.ID == req.QuestionId {
			for _, opt := range q.Options {
				if opt.Correct {
					correctAnswer = opt.Text
				}
				if opt.Text == req.Answer && opt.Correct {
					isCorrect = true
				}
			}
			break
		}
	}

	response := struct {
		IsCorrect     bool   `json:"isCorrect"`
		CorrectAnswer string `json:"correctAnswer"`
		Feedback      string `json:"feedback"`
	}{
		IsCorrect:     isCorrect,
		CorrectAnswer: correctAnswer,
		Feedback:      getFeedbackForAnswer(isCorrect),
	}

	// Update performance data in the background
	go func() {
		updateReq := struct {
			UserId         string `json:"userId"`
			QuestionId     string `json:"questionId"`
			IsCorrect      bool   `json:"isCorrect"`
			TimeTaken      int    `json:"timeTaken"`
			IsPracticeTest bool   `json:"isPracticeTest"`
		}{
			UserId:         req.UserId,
			QuestionId:     req.QuestionId,
			IsCorrect:      isCorrect,
			TimeTaken:      req.Time,
			IsPracticeTest: req.IsPracticeTest,
		}

		jsonData, err := json.Marshal(updateReq)
		if err != nil {
			log.Printf("ERROR: Failed to marshal performance update: %v", err)
			return
		}

		// Create an internal request to update performance data
		updateURL := "/api/performance"
		httpReq := httptest.NewRequest(http.MethodPost, updateURL, bytes.NewBuffer(jsonData))
		httpReq.Header.Set("Content-Type", "application/json")
		recorder := httptest.NewRecorder()

		// Call the performance update handler directly
		UpdatePerformanceDataHandler(recorder, httpReq)

		if recorder.Code != http.StatusOK {
			log.Printf("ERROR: Failed to update performance data: %s", recorder.Body.String())
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Helper function to get feedback based on answer correctness
func getFeedbackForAnswer(isCorrect bool) string {
	if isCorrect {
		correctFeedback := []string{
			"Great job! That's correct!",
			"Excellent! You got it right!",
			"Perfect! You're on the right track!",
			"That's right! Well done!",
			"Correct! Keep up the good work!",
		}
		return correctFeedback[rand.Intn(len(correctFeedback))]
	} else {
		incorrectFeedback := []string{
			"Not quite. Try again!",
			"That's not correct. Keep learning!",
			"Incorrect. Review this topic and try again.",
			"Wrong answer. Don't give up!",
			"That's not right. Let's keep practicing!",
		}
		return incorrectFeedback[rand.Intn(len(incorrectFeedback))]
	}
}
