package main

import (
	"backend/types"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var (
	// In-memory storage for user data
	userMetrics          = make(map[string]types.UserMetrics)
	performanceData      = make(map[string]map[string]types.PerformanceData) // userId -> questionId -> data
	users                = make(map[string]types.User)
	questions            []types.Question // Define the questions slice
	questionsByID        = make(map[string]types.Question)
	userMetricsMutex     = &sync.RWMutex{}
	performanceDataMutex = &sync.RWMutex{}
	usersMutex           = &sync.RWMutex{}

	// Data storage files - use absolute path
	dataDir             string
	userMetricsFile     string
	performanceDataFile string
	usersFile           string
)

// Initialize in-memory storage
func initInMemoryStorage() {
	// Get current working directory for absolute paths
	cwd, err := os.Getwd()
	if err != nil {
		log.Printf("Warning: Failed to get current working directory: %v", err)
		dataDir = "local_data"
	} else {
		dataDir = filepath.Join(cwd, "local_data")
	}

	// Set file paths based on dataDir
	userMetricsFile = filepath.Join(dataDir, "user_metrics.json")
	performanceDataFile = filepath.Join(dataDir, "performance_data.json")
	usersFile = filepath.Join(dataDir, "users.json")

	log.Printf("Data directory: %s", dataDir)

	// Create data directory if it doesn't exist
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("Warning: Failed to create data directory: %v", err)
	}

	// Test writing to local-data.json file
	testWriteToLocalDataJson()

	// Load data from disk if files exist
	loadUserMetricsFromDisk()
	loadPerformanceDataFromDisk()
	loadUsersFromDisk()

	log.Println("Initialized in-memory storage")
}

// Test writing to local-data.json
func testWriteToLocalDataJson() {
	// Create a test data struct
	type TestData struct {
		Message   string    `json:"message"`
		Timestamp time.Time `json:"timestamp"`
	}

	testData := TestData{
		Message:   "Test write to local-data.json",
		Timestamp: time.Now(),
	}

	// Marshal the test data to JSON
	data, err := json.MarshalIndent(testData, "", "  ")
	if err != nil {
		log.Printf("Error marshalling test data for local-data.json: %v", err)
		return
	}

	// Write to local-data.json in the current directory
	localDataFile := filepath.Join(".", "local-data.json")
	log.Printf("Attempting to write to %s (absolute path)", localDataFile)

	if err := os.WriteFile(localDataFile, data, 0644); err != nil {
		log.Printf("Error writing to local-data.json: %v", err)
		return
	}

	log.Printf("Successfully wrote to local-data.json")

	// Verify the file was written
	if _, err := os.Stat(localDataFile); err != nil {
		log.Printf("Error verifying local-data.json was written: %v", err)
		return
	}

	log.Printf("File existence verified: %s", localDataFile)
}

// Save user metrics to disk
func saveUserMetricsToDisk() {
	userMetricsMutex.RLock()
	defer userMetricsMutex.RUnlock()

	data, err := json.MarshalIndent(userMetrics, "", "  ")
	if err != nil {
		log.Printf("Error marshalling user metrics: %v", err)
		return
	}

	if err := os.WriteFile(userMetricsFile, data, 0644); err != nil {
		log.Printf("Error writing user metrics to disk: %v", err)
	}
}

// Load user metrics from disk
func loadUserMetricsFromDisk() {
	data, err := os.ReadFile(userMetricsFile)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("Error reading user metrics from disk: %v", err)
		}
		return
	}

	userMetricsMutex.Lock()
	defer userMetricsMutex.Unlock()

	if err := json.Unmarshal(data, &userMetrics); err != nil {
		log.Printf("Error unmarshalling user metrics: %v", err)
	} else {
		log.Printf("Loaded %d user metrics from disk", len(userMetrics))
	}
}

// Save performance data to disk
func savePerformanceDataToDisk() {
	performanceDataMutex.RLock()
	defer performanceDataMutex.RUnlock()

	log.Printf("Saving performance data to disk: %v users", len(performanceData))
	log.Printf("Data will be saved to: %s (absolute path)", performanceDataFile)

	// Debug directory existence
	dirInfo, err := os.Stat(dataDir)
	if err != nil {
		log.Printf("Error checking data directory: %v", err)
	} else {
		log.Printf("Data directory exists: %v, isDir: %v", dataDir, dirInfo.IsDir())
	}

	// Ensure directory exists
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("Error creating directory %s: %v", dataDir, err)
		return
	} else {
		log.Printf("Directory ensured: %s", dataDir)
	}

	data, err := json.MarshalIndent(performanceData, "", "  ")
	if err != nil {
		log.Printf("Error marshalling performance data: %v", err)
		return
	}

	log.Printf("Writing %d bytes to %s", len(data), performanceDataFile)

	// Try writing to a test file in the same directory first
	testFile := filepath.Join(dataDir, "test_write.txt")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		log.Printf("Error writing test file: %v", err)
	} else {
		log.Printf("Successfully wrote test file: %s", testFile)
	}

	// Now try writing the actual file
	if err := os.WriteFile(performanceDataFile, data, 0644); err != nil {
		log.Printf("Error writing performance data to disk: %v", err)
		return
	}

	// Verify the file was written
	if _, err := os.Stat(performanceDataFile); err != nil {
		log.Printf("Error verifying file was written: %v", err)
		return
	} else {
		log.Printf("File existence verified: %s", performanceDataFile)
	}

	log.Printf("Successfully saved performance data to %s", performanceDataFile)
}

// Load performance data from disk
func loadPerformanceDataFromDisk() {
	data, err := os.ReadFile(performanceDataFile)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("Error reading performance data from disk: %v", err)
		}
		return
	}

	performanceDataMutex.Lock()
	defer performanceDataMutex.Unlock()

	if err := json.Unmarshal(data, &performanceData); err != nil {
		log.Printf("Error unmarshalling performance data: %v", err)
	} else {
		log.Printf("Loaded performance data for %d users from disk", len(performanceData))
	}
}

// Save users to disk
func saveUsersToDisk() {
	usersMutex.RLock()
	defer usersMutex.RUnlock()

	data, err := json.MarshalIndent(users, "", "  ")
	if err != nil {
		log.Printf("Error marshalling users: %v", err)
		return
	}

	if err := os.WriteFile(usersFile, data, 0644); err != nil {
		log.Printf("Error writing users to disk: %v", err)
	}
}

// Load users from disk
func loadUsersFromDisk() {
	data, err := os.ReadFile(usersFile)
	if err != nil {
		if !os.IsNotExist(err) {
			log.Printf("Error reading users from disk: %v", err)
		}
		return
	}

	usersMutex.Lock()
	defer usersMutex.Unlock()

	if err := json.Unmarshal(data, &users); err != nil {
		log.Printf("Error unmarshalling users: %v", err)
	} else {
		log.Printf("Loaded %d users from disk", len(users))
	}
}

// Load questions from a local JSON file
func loadQuestionsFromFile(filepath string) {
	log.Printf("Loading questions from file: %s", filepath)
	data, err := os.ReadFile(filepath)
	if err != nil {
		log.Fatalf("Error reading questions file: %v", err)
	}

	// Parse the formatted_questions.json structure which is a map with question IDs as keys
	var questionsMap map[string]struct {
		Question string         `json:"question"`
		ImageUrl interface{}    `json:"imageUrl"`
		Options  []types.Option `json:"options"`
	}

	err = json.Unmarshal(data, &questionsMap)
	if err != nil {
		log.Fatalf("Error unmarshalling questions: %v", err)
	}

	// Convert the map to a slice of Question objects
	questions = make([]types.Question, 0, len(questionsMap))
	for id, q := range questionsMap {
		var imageUrl string
		if q.ImageUrl != nil {
			if strVal, ok := q.ImageUrl.(string); ok {
				imageUrl = strVal
			}
		}

		question := types.Question{
			ID:       id,
			Question: q.Question,
			Options:  q.Options,
			ImageUrl: imageUrl,
		}
		questions = append(questions, question)
		questionsByID[id] = question
	}

	log.Printf("Loaded %d questions", len(questions))
}

// Get user metrics from in-memory storage
func getUserMetrics(userID string) (types.UserMetrics, bool) {
	userMetricsMutex.RLock()
	defer userMetricsMutex.RUnlock()

	metrics, exists := userMetrics[userID]
	return metrics, exists
}

// Update user metrics in in-memory storage
func updateUserMetrics(metrics types.UserMetrics) {
	userMetricsMutex.Lock()
	defer userMetricsMutex.Unlock()

	log.Printf("Updating metrics for user %s", metrics.UserId)

	// Get current metrics if they exist
	currentMetrics, exists := userMetrics[metrics.UserId]
	if exists {
		currentMetrics.CorrectAnswers += metrics.CorrectAnswers
		currentMetrics.IncorrectAnswers += metrics.IncorrectAnswers
		userMetrics[metrics.UserId] = currentMetrics
		log.Printf("Updated existing metrics: correct=%d, incorrect=%d", currentMetrics.CorrectAnswers, currentMetrics.IncorrectAnswers)
	} else {
		userMetrics[metrics.UserId] = metrics
		log.Printf("Created new metrics: correct=%d, incorrect=%d", metrics.CorrectAnswers, metrics.IncorrectAnswers)
	}

	// Save changes to disk immediately
	saveUserMetricsToDisk()
}

// Get performance data for a user
func getPerformanceData(userID string) map[string]types.PerformanceData {
	performanceDataMutex.RLock()
	defer performanceDataMutex.RUnlock()

	data, exists := performanceData[userID]
	if !exists {
		return make(map[string]types.PerformanceData)
	}
	return data
}

// Update performance data for a user and question
func updatePerformanceData(userID string, questionID string, correct bool) {
	performanceDataMutex.Lock()
	defer performanceDataMutex.Unlock()

	log.Printf("Updating performance data for user %s, question %s, correct: %v", userID, questionID, correct)

	// Initialize user's performance data map if it doesn't exist
	if _, exists := performanceData[userID]; !exists {
		performanceData[userID] = make(map[string]types.PerformanceData)
		log.Printf("Created new performance data map for user %s", userID)
	}

	// Get current performance data for this question
	data, exists := performanceData[userID][questionID]
	if !exists {
		data = types.PerformanceData{
			QuestionId: questionID,
			Correct:    0,
			Incorrect:  0,
		}
		log.Printf("Created new performance entry for question %s", questionID)
	}

	// Update the correct or incorrect count
	if correct {
		data.Correct++
		log.Printf("Incremented correct count to %d", data.Correct)
	} else {
		data.Incorrect++
		log.Printf("Incremented incorrect count to %d", data.Incorrect)
	}

	// Store the updated data
	performanceData[userID][questionID] = data

	// Save changes to disk immediately
	savePerformanceDataToDisk()

	// Also save this update to local-data.json
	saveToLocalDataJson(userID, questionID, data)
}

// Save performance data to local-data.json
func saveToLocalDataJson(userID, questionID string, perfData types.PerformanceData) {
	// Create a data structure representing the update
	type QuestionUpdate struct {
		UserID      string                `json:"userId"`
		QuestionID  string                `json:"questionId"`
		Performance types.PerformanceData `json:"performance"`
		Timestamp   time.Time             `json:"timestamp"`
	}

	update := QuestionUpdate{
		UserID:      userID,
		QuestionID:  questionID,
		Performance: perfData,
		Timestamp:   time.Now(),
	}

	// Write to local-data.json in the current directory
	localDataFile := filepath.Join(".", "local-data.json")
	log.Printf("Saving performance update to %s", localDataFile)

	// Create a fresh file with just this update
	data, err := json.MarshalIndent(update, "", "  ")
	if err != nil {
		log.Printf("Error marshalling update for local-data.json: %v", err)
		return
	}

	if err := os.WriteFile(localDataFile, data, 0644); err != nil {
		log.Printf("Error writing update to local-data.json: %v", err)
		return
	}

	log.Printf("Successfully saved performance update to local-data.json")
}

// Get user by ID
func getUser(userID string) (types.User, bool) {
	usersMutex.RLock()
	defer usersMutex.RUnlock()

	user, exists := users[userID]
	return user, exists
}

// Save user
func saveUser(user types.User) {
	usersMutex.Lock()
	defer usersMutex.Unlock()

	log.Printf("Saving user %s (%s)", user.UserID, user.Name)
	users[user.UserID] = user

	// Save changes to disk immediately
	saveUsersToDisk()
}
