package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func init() {
	// Initialize in-memory storage
	initInMemoryStorage()
}

// loggingMiddleware logs all HTTP requests with path, method, and response time
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("Request: %s %s", r.Method, r.URL.Path)

		next.ServeHTTP(w, r)

		log.Printf("Response: %s %s - %s", r.Method, r.URL.Path, time.Since(start))
	})
}

func main() {
	// Attempt to load .env file, but do not exit on failure
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Warning: .env file not found, proceeding without it")
	}

	// Retrieve environment variables
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Fatal("Error: OPENAI_API_KEY is not set")
	}

	// Load questions from local file instead of DynamoDB
	loadQuestionsFromFile("./formatted_questions.json")

	r := mux.NewRouter()
	r.Use(corsMiddleware)    // Apply CORS middleware globally
	r.Use(loggingMiddleware) // Apply logging middleware to log all requests

	r.HandleFunc("/api/questions", GetQuestionsHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/questions/random", GetRandomQuestionHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/explain", ExplainHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/metrics", GetUserMetricsHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/metrics", UpdateUserMetricsHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/performance", GetPerformanceDataHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/performance", UpdatePerformanceDataHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/login", LoginHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/health", HealthCheckHandler).Methods("GET")
	r.HandleFunc("/api/hint", HintHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/worst-questions", GetWorstQuestionsHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/practice-test-questions", GetPracticeTestQuestionsHandler).Methods("GET", "POST", "OPTIONS")
	r.HandleFunc("/api/practice-worst-questions/{userId}", GetWorstQuestionsHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/generate-study-guide", GenerateStudyGuideHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/submit-answer", SubmitAnswerHandler).Methods("POST", "OPTIONS")

	log.Println("Server is running on port 8080")
	err = http.ListenAndServe(":8080", r)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
