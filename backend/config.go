package main

import (
    "github.com/joho/godotenv"
    "log"
    "os"
)

func loadEnv() {
    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    if os.Getenv("OPENAI_API_KEY") == "" {
        log.Fatal("OPENAI_API_KEY is not set in the environment")
    }
}
