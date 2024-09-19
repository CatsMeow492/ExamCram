package main

import (
    "encoding/json"
    "fmt"
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/dynamodb"
    "github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
    "github.com/aws/aws-sdk-go/service/secretsmanager"
)

func initAWS() *dynamodb.DynamoDB {
    sess := session.Must(session.NewSession(&aws.Config{
        Region: aws.String("us-east-1"),
    }))
    return dynamodb.New(sess)
}

func getSecret(secretArn string) (map[string]string, error) {
    sess := session.Must(session.NewSession(&aws.Config{
        Region: aws.String("us-east-1"),
    }))
    svc := secretsmanager.New(sess)

    input := &secretsmanager.GetSecretValueInput{
        SecretId: aws.String(secretArn),
    }

    result, err := svc.GetSecretValue(input)
    if (err != nil) {
        return nil, fmt.Errorf("failed to retrieve secret: %w", err)
    }

    var secretMap map[string]string
    err = json.Unmarshal([]byte(*result.SecretString), &secretMap)
    if (err != nil) {
        return nil, fmt.Errorf("failed to unmarshal secret: %w", err)
    }

    return secretMap, nil
}

func loadQuestions(svc *dynamodb.DynamoDB) {
    result, err := svc.Scan(&dynamodb.ScanInput{
        TableName: aws.String("Questions"),
    })
    if (err != nil) {
        panic(fmt.Sprintf("Error scanning DynamoDB table: %v", err))
    }

    for _, i := range result.Items {
        question := Question{}
        err = dynamodbattribute.UnmarshalMap(i, &question)
        if (err != nil) {
            panic(fmt.Sprintf("Error unmarshalling DynamoDB item: %v", err))
        }
        questions = append(questions, question)
    }
}
