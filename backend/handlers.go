package main

import (
    "encoding/json"
    "log"
    "math/rand"
    "net/http"
    "os"
    "time"

    openai "github.com/sashabaranov/go-openai"
)

func GetQuestionsHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(questions)
}

func GetRandomQuestionHandler(w http.ResponseWriter, r *http.Request) {
    rand.Seed(time.Now().UnixNano())
    randomQuestion := questions[rand.Intn(len(questions))]
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(randomQuestion)
}

func ExplainHandler(w http.ResponseWriter, r *http.Request) {
    log.Println("Received request to /explain")
    var req ExplainRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        log.Println("Error decoding request body:", err)
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Call OpenAI API
    client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))
    prompt := "Question: " + req.Question + "\nAnswer: " + req.SelectedAnswer + "\nExplanation:"

    resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
        Model:     openai.GPT4o,
        Prompt:    prompt,
        MaxTokens: 150,
    })
    if err != nil {
        log.Println("Error calling OpenAI API:", err)
        http.Error(w, "Error generating explanation", http.StatusInternalServerError)
        return
    }

    explanation := resp.Choices[0].Text

    response := map[string]string{
        "explanation": explanation,
    }

    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(response); err != nil {
        log.Println("Error encoding response:", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}
