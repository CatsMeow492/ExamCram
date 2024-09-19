package main

type Question struct {
    Question string   `json:"question"`
    Options  []Option `json:"options"`
}

type Option struct {
    Text    string `json:"text"`
    Correct bool   `json:"correct"`
}

var questions []Question

type ExplainRequest struct {
    Question      string `json:"question"`
    SelectedAnswer string `json:"selectedAnswer"`
}

type UserMetrics struct {
	UserId string `json:"user_id"`
	CorrectAnswers int `json:"correct_answers"`
	IncorrectAnswers int `json:"incorrect_answers"`
}

type QuestionPerformance struct {
	UserId     string `json:"user_id"`
	QuestionId string `json:"question_id"`
	Correct    int    `json:"correct"`
	Incorrect  int    `json:"incorrect"`
}
