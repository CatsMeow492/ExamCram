package main

import (
    "log"
    "net/http"
    "github.com/gorilla/mux"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

var svc *dynamodb.DynamoDB

func main() {
    loadEnv()

    svc = initAWS()
    loadQuestions(svc)

    r := mux.NewRouter()
    r.HandleFunc("/api/questions", GetQuestionsHandler).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/question/random", GetRandomQuestionHandler).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/explain", ExplainHandler).Methods("POST", "OPTIONS")
    r.HandleFunc("/api/metrics", GetUserMetricsHandler).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/metrics", UpdateUserMetricsHandler).Methods("POST", "OPTIONS")
    r.HandleFunc("/api/performance", GetPerformanceDataHandler).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/performance", UpdatePerformanceDataHandler).Methods("POST", "OPTIONS")
    r.Use(corsMiddleware)

    log.Println("Server is running on port 8080")
    http.ListenAndServe(":8080", r)
}