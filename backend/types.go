package main

type Question struct {
    ID       string   `json:"id" dynamodbav:"QuestionID"`
    Question string   `json:"question" dynamodbav:"Question"`
    Options  []Option `json:"options" dynamodbav:"Options"`
}

type Option struct {
    Text    string `json:"text"`
    Correct bool   `json:"correct"`
	Selected bool   `json:"selected"`
}

var questions []Question

type ExplainRequest struct {
    Question      string `json:"question"`
    SelectedAnswer string `json:"selectedAnswer"`
}

type UserMetrics struct {
    UserId     string `json:"userId" dynamodbav:"UserId"`
    Correct    int    `json:"correct"`
    Incorrect  int    `json:"incorrect"`
}

type QuestionPerformance struct {
    UserId     string `json:"userId" dynamodbav:"UserId"`
    QuestionId string `json:"questionId" dynamodbav:"QuestionId"`
    Correct    int    `json:"correct"`
    Incorrect  int    `json:"incorrect"`
}

type User struct {
    UserID    string `json:"userId" dynamodbav:"UserID"`
    Email     string `json:"email"`
    Name      string `json:"name"`
    Picture   string `json:"picture"`
}
