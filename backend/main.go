package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"google.golang.org/api/idtoken"
)

var svc *dynamodb.DynamoDB

func init() {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-east-1"),
	})
	if err != nil {
		log.Fatalf("Failed to create session: %v", err)
	}
	svc = dynamodb.New(sess)
}

func main() {
	// Attempt to load .env file, but do not exit on failure
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Warning: .env file not found, proceeding without it")
	}

	// Check if running in production
	if os.Getenv("ENV") == "production" {
		// Fetch secrets from AWS Secrets Manager
		secret, err := getSecret("arn:aws:secretsmanager:us-east-1:500532294210:secret:examcram/openai/api-key-kUfllr")
		if err != nil {
			log.Fatal("Error fetching secrets from AWS Secrets Manager:", err)
		}

		// Set environment variables from secrets
		os.Setenv("OPENAI_API_KEY", secret["OPENAI_API_KEY"])
	}

	// Retrieve environment variables
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Fatal("Error: OPENAI_API_KEY is not set")
	}

	svc = initAWS()
	loadQuestions(svc) // Load questions from DynamoDB

	r := mux.NewRouter()
	r.Use(corsMiddleware) // Apply CORS middleware globally

	r.HandleFunc("/api/questions", GetQuestionsHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/question/random", GetRandomQuestionHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/explain", ExplainHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/metrics", GetUserMetricsHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/metrics", UpdateUserMetricsHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/performance", GetPerformanceDataHandler).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/performance", UpdatePerformanceDataHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/login", LoginHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/health", HealthCheckHandler).Methods("GET")
	r.HandleFunc("/api/hint", HintHandler).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/worst-questions", GetWorstQuestionsHandler).Methods("GET", "OPTIONS")

	log.Println("Server is running on port 8080")
	http.ListenAndServe(":8080", r)
}

func verifyIDToken(token string) (*idtoken.Payload, error) {
	ctx := context.Background()
	clientID := os.Getenv("REACT_APP_GOOGLE_CLIENT_ID")
	payload, err := idtoken.Validate(ctx, token, clientID)
	if err != nil {
		return nil, err
	}
	return payload, nil
}
