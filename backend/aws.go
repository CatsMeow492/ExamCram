package main

import (
    "fmt"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/dynamodb"
    "github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

func initAWS() *dynamodb.DynamoDB {
    sess := session.Must(session.NewSession(&aws.Config{
        Region: aws.String("us-east-1"),
    }))
    return dynamodb.New(sess)
}

func loadQuestions(svc *dynamodb.DynamoDB) {
    result, err := svc.Scan(&dynamodb.ScanInput{
        TableName: aws.String("Questions"),
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
}
