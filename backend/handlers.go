package main

import (
	"backend/helpers"
	"backend/types" // Import the types package
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"sort"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
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

	prompt := fmt.Sprintf(
		"Question: %s\nAnswer: %s\nExplanation: Please explain the answer in a simple, intuitive, and easy-to-remember way. Limit your response to %d tokens.",
		req.Question,
		req.SelectedAnswer, maxTokens)

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

	var metrics types.UserMetrics
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

	// Fetch current metrics
	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String("UserMetrics"),
		Key: map[string]*dynamodb.AttributeValue{
			"UserId": {
				S: aws.String(metrics.UserId),
			},
		},
	})
	if err != nil {
		log.Println("Error getting item:", err)
		http.Error(w, "Error getting item", http.StatusInternalServerError)
		return
	}

	var currentMetrics types.UserMetrics
	if result.Item != nil {
		err = dynamodbattribute.UnmarshalMap(result.Item, &currentMetrics)
		if err != nil {
			log.Println("Error unmarshalling item:", err)
			http.Error(w, "Error unmarshalling item", http.StatusInternalServerError)
			return
		}
	}

	// Increment the current values
	newCorrectAnswers := currentMetrics.CorrectAnswers + metrics.CorrectAnswers
	newIncorrectAnswers := currentMetrics.IncorrectAnswers + metrics.IncorrectAnswers

	updateExpression := "SET CorrectAnswers = :correct, IncorrectAnswers = :incorrect"
	attributeValues := map[string]*dynamodb.AttributeValue{
		":correct": {
			N: aws.String(fmt.Sprintf("%d", newCorrectAnswers)),
		},
		":incorrect": {
			N: aws.String(fmt.Sprintf("%d", newIncorrectAnswers)),
		},
	}

	updateItemInput := &dynamodb.UpdateItemInput{
		TableName: aws.String("UserMetrics"),
		Key: map[string]*dynamodb.AttributeValue{
			"UserId": {
				S: aws.String(metrics.UserId),
			},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: attributeValues,
		ReturnValues:              aws.String("UPDATED_NEW"),
	}

	log.Printf("Updating UserMetrics table: UpdateExpression: %s, AttributeValues: %+v\n", updateExpression, attributeValues)

	_, err = svc.UpdateItem(updateItemInput)
	if err != nil {
		log.Printf("Error updating UserMetrics: %v\n", err)
		http.Error(w, "Error updating UserMetrics", http.StatusInternalServerError)
		return
	}

	metrics.CorrectAnswers = newCorrectAnswers
	metrics.IncorrectAnswers = newIncorrectAnswers

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func UpdatePerformanceDataHandler(w http.ResponseWriter, r *http.Request) {
	var performanceData types.QuestionPerformance

	// Decode the request body
	err := json.NewDecoder(r.Body).Decode(&performanceData)
	if err != nil {
		log.Println("Invalid request payload:", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	log.Printf("Received performance data: %+v\n", performanceData)

	if performanceData.UserId == "" || performanceData.QuestionId == "" {
		log.Println("userId and questionId are required")
		http.Error(w, "userId and questionId are required", http.StatusBadRequest)
		return
	}

	// Update UserMetrics table
	updateExpression := "ADD CorrectAnswers :inc"
	attributeValues := map[string]*dynamodb.AttributeValue{
		":inc": {
			N: aws.String("1"),
		},
	}

	if performanceData.Correct == 0 {
		updateExpression = "ADD IncorrectAnswers :inc"
	}

	updateItemInput := &dynamodb.UpdateItemInput{
		TableName: aws.String("UserMetrics"),
		Key: map[string]*dynamodb.AttributeValue{
			"UserId": {
				S: aws.String(performanceData.UserId),
			},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: attributeValues,
		ReturnValues:              aws.String("UPDATED_NEW"),
	}

	log.Printf("Updating UserMetrics table: UpdateExpression: %s, AttributeValues: %+v\n", updateExpression, attributeValues)

	_, err = svc.UpdateItem(updateItemInput)
	if err != nil {
		log.Printf("Error updating UserMetrics: %v\n", err)
		http.Error(w, "Error updating UserMetrics", http.StatusInternalServerError)
		return
	}

	// Update QuestionPerformance table
	qpUpdateExpression := "ADD Correct :inc"
	if performanceData.Correct == 0 {
		qpUpdateExpression = "ADD Incorrect :inc"
	}

	qpUpdateItemInput := &dynamodb.UpdateItemInput{
		TableName: aws.String("QuestionPerformance"),
		Key: map[string]*dynamodb.AttributeValue{
			"UserId": {
				S: aws.String(performanceData.UserId),
			},
			"QuestionId": {
				S: aws.String(performanceData.QuestionId),
			},
		},
		UpdateExpression:          aws.String(qpUpdateExpression),
		ExpressionAttributeValues: attributeValues,
		ReturnValues:              aws.String("UPDATED_NEW"),
	}

	log.Printf("Updating QuestionPerformance table: UpdateExpression: %s, AttributeValues: %+v\n", qpUpdateExpression, attributeValues)

	_, err = svc.UpdateItem(qpUpdateItemInput)
	if err != nil {
		log.Printf("Error updating QuestionPerformance: %v\n", err)
		http.Error(w, "Error updating QuestionPerformance", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(performanceData)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDToken string `json:"idToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Invalid request payload:", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	payload, err := verifyIDToken(req.IDToken)
	if err != nil {
		log.Println("Invalid ID token:", err)
		http.Error(w, "Invalid ID token", http.StatusUnauthorized)
		return
	}

	userID := payload.Subject
	email := payload.Claims["email"].(string)
	name := payload.Claims["name"].(string)
	picture := payload.Claims["picture"].(string)

	user := types.User{
		UserID:  userID,
		Email:   email,
		Name:    name,
		Picture: picture,
	}

	log.Printf("User struct: %+v\n", user)

	// Check if user exists
	result, err := svc.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String("Users"),
		Key: map[string]*dynamodb.AttributeValue{
			"UserID": {
				S: aws.String(userID),
			},
		},
	})
	if err != nil {
		log.Println("Error checking user existence:", err)
		http.Error(w, "Error checking user existence", http.StatusInternalServerError)
		return
	}

	if result.Item == nil {
		// User does not exist, create new user
		av, err := dynamodbattribute.MarshalMap(user)
		if err != nil {
			log.Println("Error marshalling user data:", err)
			http.Error(w, "Error marshalling user data", http.StatusInternalServerError)
			return
		}

		log.Printf("Marshalled user data: %+v\n", av)

		_, err = svc.PutItem(&dynamodb.PutItemInput{
			TableName: aws.String("Users"),
			Item:      av,
		})
		if err != nil {
			log.Println("Error creating user:", err)
			http.Error(w, "Error creating user", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
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
					{
						S: aws.String(userID),
					},
				},
			},
		},
	})
	if err != nil {
		log.Println("Error querying QuestionPerformance table:", err)
		http.Error(w, "Error querying QuestionPerformance table", http.StatusInternalServerError)
		return
	}

	var performanceData []types.QuestionPerformance
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &performanceData)
	if err != nil {
		log.Println("Error unmarshalling query result:", err)
		http.Error(w, "Error unmarshalling query result", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(performanceData)
}

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func HintHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Received request to /hint")
	var req types.HintRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// Initialize OpenAI client
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

	prompt := fmt.Sprintf(
		"Question: %s\nHint: Please provide a hint to help answer this question, make sure to define all the terms and services necessary to understand the question. The hint should be concise and to the point and limited to %d tokens.",
		req.Question, maxTokens)

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
		http.Error(w, "Error generating hint", http.StatusInternalServerError)
		return
	}

	hint := resp.Choices[0].Message.Content

	response := map[string]string{
		"hint": hint,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Println("Error encoding response:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func GetWorstQuestionsHandler(w http.ResponseWriter, r *http.Request) {
	userId := r.URL.Query().Get("userId")
	if userId == "" {
		http.Error(w, "userId is required", http.StatusBadRequest)
		return
	}

	log.Printf("Fetching performance data for userId: %s", userId)

	// Fetch performance data for the user
	performanceData, err := helpers.FetchPerformanceData(userId)
	if err != nil {
		log.Printf("Error fetching performance data: %v", err)
		http.Error(w, "Error fetching performance data", http.StatusInternalServerError)
		return
	}

	// Sort questions by the number of incorrect answers
	sort.Slice(performanceData, func(i, j int) bool {
		return performanceData[i].Incorrect > performanceData[j].Incorrect
	})

	// Select the top N worst questions
	const topN = 10
	if len(performanceData) > topN {
		performanceData = performanceData[:topN]
	}

	// Fetch the question details for the worst questions
	worstQuestions := make([]types.Question, len(performanceData)) // Change Question to types.Question
	for i, data := range performanceData {
		log.Printf("Fetching question details for questionId: %s", data.QuestionId)
		question, err := helpers.FetchQuestionById(data.QuestionId)
		if err != nil {
			log.Printf("Error fetching question details for questionId %s: %v", data.QuestionId, err)
			http.Error(w, "Error fetching question details", http.StatusInternalServerError)
			return
		}
		worstQuestions[i] = question
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(worstQuestions); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}
