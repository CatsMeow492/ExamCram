package types

type Question struct {
	ID       string   `json:"id" dynamodbav:"QuestionID"`
	Question string   `json:"question" dynamodbav:"Question"`
	Options  []Option `json:"options" dynamodbav:"Options"`
	ImageUrl string   `json:"imageUrl" dynamodbav:"ImageUrl"`
}

type Option struct {
	Text     string `json:"text"`
	Correct  bool   `json:"correct"`
	Selected bool   `json:"selected"`
}

type ExplainRequest struct {
	Question        string   `json:"question"`
	SelectedAnswers []string `json:"selectedAnswers"`
	CorrectAnswers  []string `json:"correctAnswers"`
}

type HintRequest struct {
	Question string `json:"question"`
}

type UserMetrics struct {
	UserId           string `json:"userId" dynamodbav:"UserId"`
	CorrectAnswers   int    `json:"correctAnswers" dynamodbav:"CorrectAnswers"`
	IncorrectAnswers int    `json:"incorrectAnswers" dynamodbav:"IncorrectAnswers"`
}

type QuestionPerformance struct {
	UserId     string `json:"userId" dynamodbav:"UserId"`
	QuestionId string `json:"questionId" dynamodbav:"QuestionId"`
	Correct    int    `json:"correct"`
	Incorrect  int    `json:"incorrect"`
}

type User struct {
	UserID  string `json:"userId" dynamodbav:"UserID"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

type PerformanceData struct {
	QuestionId string `json:"questionId" dynamodbav:"QuestionId"`
	Correct    int    `json:"correct" dynamodbav:"Correct"`
	Incorrect  int    `json:"incorrect" dynamodbav:"Incorrect"`
}
