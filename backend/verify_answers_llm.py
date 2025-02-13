import boto3
import json
import os
from openai import OpenAI
import time
from tqdm import tqdm

def get_all_questions():
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('Questions')
    
    response = table.scan()
    questions = response['Items']
    
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        questions.extend(response['Items'])
    
    return questions

def format_question_for_llm(question):
    options_text = []
    for i, opt in enumerate(question['options']):
        mark = '[CORRECT]' if opt['correct'] else '[INCORRECT]'
        options_text.append(f"{chr(65 + i)}. {opt['text']} {mark}")
    
    return {
        'id': question['QuestionID'],
        'question': question['question'],
        'options': '\n'.join(options_text),
    }

def verify_batch_with_llm(questions_batch, client):
    prompt = """You are an AWS Machine Learning Specialty certification expert. Please review these AWS ML exam questions and their marked answers.
For each question:
1. Verify if the marked correct answers make sense
2. Flag any potential issues with the answers
3. Provide a brief explanation of why the marked answers are correct or incorrect
4. If you spot any issues, suggest the correct answers

Questions to review:

"""
    
    for q in questions_batch:
        prompt += f"\nQuestion ID: {q['id']}\n"
        prompt += f"Question: {q['question']}\n"
        prompt += f"Options:\n{q['options']}\n"
        prompt += "-" * 80 + "\n"

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an AWS Machine Learning Specialty certification expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return None

def get_openai_api_key():
    try:
        # Create a Secrets Manager client
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager'
        )
        
        # Get the secret value
        get_secret_value_response = client.get_secret_value(
            SecretId='OPENAI_API_KEY'
        )
        
        # Parse the secret string (remove any quotes or whitespace)
        secret = get_secret_value_response['SecretString'].strip().strip('"')
        return secret
    except Exception as e:
        print(f"Error retrieving OpenAI API key: {e}")
        return None

def main():
    # Get OpenAI API key from AWS Secrets Manager
    api_key = get_openai_api_key()
    if not api_key:
        print("Error: Could not retrieve OpenAI API key")
        return
    
    # Initialize OpenAI client with API key
    client = OpenAI(
        api_key=api_key
    )
    
    # Get all questions
    print("Fetching questions from DynamoDB...")
    questions = get_all_questions()
    formatted_questions = [format_question_for_llm(q) for q in questions]
    
    # Process in batches of 5 questions
    batch_size = 5
    results = []
    
    print(f"\nVerifying {len(formatted_questions)} questions in batches of {batch_size}...")
    for i in tqdm(range(0, len(formatted_questions), batch_size)):
        batch = formatted_questions[i:i + batch_size]
        result = verify_batch_with_llm(batch, client)
        
        if result:
            # Save the result to a file
            with open(f'verification_results/batch_{i//batch_size + 1}.txt', 'w') as f:
                f.write(result)
            results.append(result)
        
        # Sleep to respect rate limits
        time.sleep(3)
    
    # Save all results to a single file
    os.makedirs('verification_results', exist_ok=True)
    with open('verification_results/all_results.txt', 'w') as f:
        f.write('\n\n' + '='*80 + '\n\n'.join(results))
    
    print("\nVerification complete! Results saved in verification_results/")

if __name__ == "__main__":
    main() 