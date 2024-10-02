package helpers

import (
	"backend/types"
	"log"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

func FetchQuestionById(questionId string) (types.Question, error) {
	// Initialize a session that the SDK uses to load configuration, credentials, and region
	sess := session.Must(session.NewSession())

	// Create DynamoDB client
	svc := dynamodb.New(sess)

	// Define the input for the get item request
	input := &dynamodb.GetItemInput{
		TableName: aws.String("Questions"), // Replace with your table name
		Key: map[string]*dynamodb.AttributeValue{
			"QuestionID": { // Ensure this matches the primary key attribute name
				S: aws.String(questionId),
			},
		},
	}

	// Execute the get item request
	result, err := svc.GetItem(input)
	if err != nil {
		log.Printf("Error fetching question details for questionId %s: %v", questionId, err)
		return types.Question{}, err
	}

	if result.Item == nil {
		return types.Question{}, nil // Return empty question if not found
	}

	// Parse the result
	var question types.Question
	err = dynamodbattribute.UnmarshalMap(result.Item, &question)
	if err != nil {
		log.Printf("Error unmarshalling question details for questionId %s: %v", questionId, err)
		return types.Question{}, err
	}

	return question, nil
}
