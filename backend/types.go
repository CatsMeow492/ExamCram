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
