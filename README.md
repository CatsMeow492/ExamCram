# ExamCram

Welcome to ExamCram, an interactive platform designed to help you prepare for exams with random questions, performance metrics, and detailed explanations. This project is hosted at [ExamCram](https://examcram.youngmohney.com).

## Table of Contents
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Learn More](#learn-more)

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Prerequisites

Make sure you have the following installed:
- Node.js
- npm or yarn
- Docker (for backend deployment)
- AWS CLI (for deployment to AWS services)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/examcram.git
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```
   cd backend
   go mod tidy
   ```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

## Project Structure

The project is divided into two main parts: the frontend and the backend.

### Frontend

The frontend is a React application located in the `frontend` directory. Key files and directories include:

- `src/App.js`: Main application component.
- `src/components/QuestionCard.js`: Component for displaying questions.
- `src/utils/handlers.js`: Utility functions for handling user interactions.
- `src/styles`: CSS files for styling the application.

### Backend

The backend is a Go application located in the `backend` directory. Key files and directories include:

- `main.go`: Entry point of the backend application.
- `handlers.go`: HTTP handlers for various API endpoints.
- `aws.go`: Functions for interacting with AWS services.
- `types.go`: Data structures used in the application.
- `convert_to_dynamodb_format.py`: Script for converting questions to DynamoDB format.

## Environment Variables

The project uses environment variables for configuration. Create a `.env` file in both the frontend and backend directories with the necessary variables.

### Frontend

```
REACT_APP_API_URL=http://localhost:8080
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Backend

```
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=your-aws-region
```

## Deployment

### Frontend

The frontend can be deployed to an S3 bucket using the GitHub Actions workflow defined in `.github/workflows/frontenddeploy.yml`.

### Backend

The backend can be deployed to AWS ECS using the GitHub Actions workflow defined in `.github/workflows/deploy.yml`.

### AWS DynamoDB

To upload questions to DynamoDB, use the `upload_batches.sh` script:

```
sh upload_batches.sh
```

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

---
This README provides an overview of the ExamCram project, including setup instructions, available scripts, project structure, environment variables, and deployment steps. For detailed code references, please refer to the respective files in the project.