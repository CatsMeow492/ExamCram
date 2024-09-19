package main

import (
    "encoding/json"
    "log"
	"fmt"
    "math/rand"
    "net/http"
    "os"
    "time"
	"github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/service/dynamodb"
    "github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
    openai "github.com/sashabaranov/go-openai"
)

func GetQuestionsHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(questions)
}

func GetRandomQuestionHandler(w http.ResponseWriter, r *http.Request) {
    log.Println("Received request to /api/question/random")
    rand.Seed(time.Now().UnixNano())
    randomQuestion := questions[rand.Intn(len(questions))]
    log.Println("Random question selected:", randomQuestion)
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

    // Initialize OpenAI client
    client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

    prompt := fmt.Sprintf("Question: %s\nAnswer: %s\nExplanation:", req.Question, req.SelectedAnswer)

    resp, err := client.CreateChatCompletion(r.Context(), openai.ChatCompletionRequest{
        Model: openai.GPT3Dot5Turbo, // Use openai.GPT4 if you have access
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

    result, err := svc.GetItem(&dynamodb.GetItemInput{
        TableName: aws.String("UserMetrics"),
        Key: map[string]*dynamodb.AttributeValue{
            "UserId": {
                S: aws.String(userID),
            },
        },
    })
    if err != nil {
        log.Println("Error getting item:", err)
        http.Error(w, "Error getting item", http.StatusInternalServerError)
        return
    }

    if result.Item == nil {
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    var metrics UserMetrics
    err = dynamodbattribute.UnmarshalMap(result.Item, &metrics)
    if err != nil {
        log.Println("Error unmarshalling item:", err)
        http.Error(w, "Error unmarshalling item", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(metrics)
}

func UpdateUserMetricsHandler(w http.ResponseWriter, r *http.Request) {
    var metrics UserMetrics
    if err := json.NewDecoder(r.Body).Decode(&metrics); err != nil {
        log.Println("Error decoding request body:", err)
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    item, err := dynamodbattribute.MarshalMap(metrics)
    if err != nil {
        log.Println("Error marshalling item:", err)
        http.Error(w, "Error marshalling item", http.StatusInternalServerError)
        return
    }

    _, err = svc.PutItem(&dynamodb.PutItemInput{
        TableName: aws.String("UserMetrics"),
        Item:      item,
    })
    if err != nil {
        log.Println("Error putting item:", err)
        http.Error(w, "Error putting item", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(metrics)
}

func GetPerformanceDataHandler(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("userId")
    if userID == "" {
        http.Error(w, "Missing userId", http.StatusBadRequest)
        return
    }

    result, err := svc.Query(&dynamodb.QueryInput{
        TableName: aws.String("QuestionPerformance"),
        KeyConditions: map[string]*dynamodb.Condition{
            "UserId": {
                ComparisonOperator: aws.String("EQ"),
                AttributeValueList: []*dynamodb.AttributeValue{
                    {S: aws.String(userID)},
                },
            },
        },
    })
    if err != nil {
        log.Println("Error querying table:", err)
        http.Error(w, "Error querying table", http.StatusInternalServerError)
        return
    }

    var performances []QuestionPerformance
    err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &performances)
    if err != nil {
        log.Println("Error unmarshalling items:", err)
        http.Error(w, "Error unmarshalling items", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(performances)
}

func UpdatePerformanceDataHandler(w http.ResponseWriter, r *http.Request) {
    var performance QuestionPerformance
    if err := json.NewDecoder(r.Body).Decode(&performance); err != nil {
        log.Println("Error decoding request body:", err)
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    result, err := svc.GetItem(&dynamodb.GetItemInput{
        TableName: aws.String("QuestionPerformance"),
        Key: map[string]*dynamodb.AttributeValue{
            "UserId": {
                S: aws.String(performance.UserId),
            },
            "QuestionId": {
                S: aws.String(performance.QuestionId),
            },
        },
    })
    if err != nil {
        log.Println("Error getting item:", err)
        http.Error(w, "Error getting item", http.StatusInternalServerError)
        return
    }

    if result.Item != nil {
        var existingPerformance QuestionPerformance
        err = dynamodbattribute.UnmarshalMap(result.Item, &existingPerformance)
        if err != nil {
            log.Println("Error unmarshalling item:", err)
            http.Error(w, "Error unmarshalling item", http.StatusInternalServerError)
            return
        }

        if performance.Correct > 0 {
            existingPerformance.Correct += performance.Correct
        } else {
            existingPerformance.Incorrect += performance.Incorrect
        }

        performance = existingPerformance
    }

    item, err := dynamodbattribute.MarshalMap(performance)
    if err != nil {
        log.Println("Error marshalling item:", err)
        http.Error(w, "Error marshalling item", http.StatusInternalServerError)
        return
    }

    _, err = svc.PutItem(&dynamodb.PutItemInput{
        TableName: aws.String("QuestionPerformance"),
        Item:      item,
    })
    if err != nil {
        log.Println("Error putting item:", err)
        http.Error(w, "Error putting item", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(performance)
}
