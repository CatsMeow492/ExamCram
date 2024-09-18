package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "math/rand"
    "net/http"
    "os"
    "time"
    "github.com/gorilla/mux"
    "github.com/joho/godotenv"
    "github.com/sashabaranov/go-openai"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/dynamodb"
    "github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type Option struct {
    Text    string `json:"text"`
    Correct bool   `json:"correct"`
}

type Question struct {
    QuestionID string   `json:"QuestionID"`
    Question   string   `json:"question"`
    Options    []Option `json:"options"`
}

type ExplainRequest struct {
    Question       string `json:"question"`
    SelectedAnswer string `json:"selectedAnswer"`
}

type ExplainResponse struct {
    Explanation string `json:"explanation"`
}

var questions []Question

func main() {
    // Load environment variables from .env file
    err := godotenv.Load()
    if err != nil {
        panic("Error loading .env file")
    }

    // Initialize AWS session
    sess := session.Must(session.NewSession(&aws.Config{
        Region: aws.String("us-east-1"), // Ensure this matches your DynamoDB table's region
    }))

    // Load questions from DynamoDB
    svc := dynamodb.New(sess)
    result, err := svc.Scan(&dynamodb.ScanInput{
        TableName: aws.String("Questions"), // Correct table name
    })
    if err != nil {
        panic(fmt.Sprintf("Error scanning DynamoDB table: %v", err))
    }

    for _, i := range result.Items {
        question := Question{}
        err = dynamodbattribute.UnmarshalMap(i, &question)
        if err != nil {
            panic(fmt.Sprintf("Error unmarshalling DynamoDB item: %v", err))
        }
        questions = append(questions, question)
    }

    r := mux.NewRouter()
    r.HandleFunc("/api/questions", GetQuestionsHandler).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/question/random", GetRandomQuestionHandler).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/explain", ExplainHandler).Methods("POST", "OPTIONS")
    r.Use(corsMiddleware)
    log.Println("Server is running on port 8080")
    http.ListenAndServe(":8080", r)
}

func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        log.Printf("CORS middleware: %s %s", r.Method, r.RequestURI)
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "*")
        if r.Method == "OPTIONS" {
            log.Println("Received OPTIONS request")
            w.WriteHeader(http.StatusOK)
            return
        }
        next.ServeHTTP(w, r)
    })
}

func ExplainHandler(w http.ResponseWriter, r *http.Request) {
    log.Println("Received request to /explain")
    var req ExplainRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        log.Println("Error decoding request body:", err)
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    explanation, err := getExplanationFromOpenAI(req.Question, req.SelectedAnswer)
    if err != nil {
        log.Println("Error getting explanation from OpenAI:", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    res := ExplainResponse{Explanation: explanation}
    json.NewEncoder(w).Encode(res)
}

func getExplanationFromOpenAI(question, selectedAnswer string) (string, error) {
    apiKey := os.Getenv("OPENAI_API_KEY")
    client := openai.NewClient(apiKey)
    prompt := "Question: " + question + "\nSelected Answer: " + selectedAnswer + "\nExplain the correct answer and why it is correct."

    ctx := context.Background()
    resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
        Model: "gpt-3.5-turbo",
        Messages: []openai.ChatCompletionMessage{
            {
                Role:    "system",
                Content: "You are a helpful assistant.",
            },
            {
                Role:    "user",
                Content: prompt,
            },
        },
        MaxTokens: 150,
    })
    if err != nil {
        return "", err
    }

    return resp.Choices[0].Message.Content, nil
}

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