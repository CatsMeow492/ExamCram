package helpers

import (
	"log"
	"strconv"

	"backend/types"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

func FetchPerformanceData(userId string) ([]types.QuestionPerformance, error) {
	// Initialize a session that the SDK uses to load configuration, credentials, and region
	sess := session.Must(session.NewSession())

	// Create DynamoDB client
	svc := dynamodb.New(sess)

	// Define the input for the query
	input := &dynamodb.QueryInput{
		TableName: aws.String("QuestionPerformance"), // Replace with your table name
		KeyConditions: map[string]*dynamodb.Condition{
			"UserId": {
				ComparisonOperator: aws.String("EQ"),
				AttributeValueList: []*dynamodb.AttributeValue{
					{
						S: aws.String(userId),
					},
				},
			},
		},
	}

	// Execute the query
	result, err := svc.Query(input)
	if err != nil {
		log.Printf("Error querying QuestionPerformance table: %v", err)
		return nil, err
	}

	// Parse the result
	var performanceData []types.QuestionPerformance
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &performanceData)
	if err != nil {
		log.Printf("Error unmarshalling query result: %v", err)
		return nil, err
	}

	return performanceData, nil
}

func mustAtoi(s string) int {
	i, err := strconv.Atoi(s)
	if err != nil {
		panic(err) // or handle the error appropriately
	}
	return i
}
