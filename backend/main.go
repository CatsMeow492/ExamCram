package main

import (
    "log"
    "net/http"
    "github.com/gorilla/mux"
)

func main() {
    loadEnv()

    svc := initAWS()
    loadQuestions(svc)

    r := mux.NewRouter()
    r.HandleFunc("/api/questions", GetQuestionsHandler).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/question/random", GetRandomQuestionHandler).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/explain", ExplainHandler).Methods("POST", "OPTIONS")
    r.Use(corsMiddleware)

    log.Println("Server is running on port 8080")
    http.ListenAndServe(":8080", r)
}