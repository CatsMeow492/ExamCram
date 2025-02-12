import json
import os
import re
import sys

def clean_question_data(question_data):
    """Clean and sanitize question data before conversion."""
    # Deep copy the question to avoid modifying original
    cleaned = {
        "question": question_data["question"],
        "imageUrl": question_data.get("imageUrl"),
        "options": []
    }
    
    # First pass - identify "Most Voted" options and if it's a multi-select question
    most_voted_indices = []
    is_multi_select = "Choose two" in question_data["question"] or "Choose three" in question_data["question"]
    
    for i, option in enumerate(question_data["options"]):
        if "Most Voted" in option["text"]:
            most_voted_indices.append(i)
    
    # Clean each option
    for i, option in enumerate(question_data["options"]):
        # Get the original text
        text = option["text"]
        
        # Remove "Most Voted" and similar markers
        text = re.sub(r'\s*Most Voted\s*', '', text)
        
        # Split if the text contains E., F. etc. indicating combined answers
        if re.search(r'\s+[E-F]\.\s+', text):
            text = re.sub(r'\s+[E-F]\.\s+.*$', '', text)
            
        # Clean up any double spaces and trim
        text = ' '.join(text.split())
        
        # Determine if this option should be marked as correct
        is_correct = option["correct"]
        if i in most_voted_indices and not any(opt["correct"] for opt in question_data["options"]):
            is_correct = True
        
        # For multi-select questions, keep original correct flags
        if is_multi_select:
            is_correct = option["correct"]
        
        cleaned["options"].append({
            "text": text,
            "correct": is_correct
        })
    
    return cleaned

def convert_to_dynamodb_format(input_file, output_dir):
    print(f"Reading from {input_file}")
    print(f"Writing to {output_dir}")
    
    with open(input_file, 'r') as f:
        questions = json.load(f)

    dynamodb_items = []
    for question_id, question_data in questions.items():
        # Clean the question data
        cleaned_data = clean_question_data(question_data)
        
        item = {
            "PutRequest": {
                "Item": {
                    "QuestionID": {"S": question_id},
                    "question": {"S": cleaned_data["question"]},
                    "options": {
                        "L": [
                            {
                                "M": {
                                    "text": {"S": option["text"]},
                                    "correct": {"BOOL": option["correct"]}
                                }
                            } for option in cleaned_data["options"]
                        ]
                    }
                }
            }
        }
        # Add image_url if it exists and is not None
        if cleaned_data["imageUrl"] is not None:
            item["PutRequest"]["Item"]["imageUrl"] = {"S": cleaned_data["imageUrl"]}
        
        dynamodb_items.append(item)

    # Split into batches of 25 items
    os.makedirs(output_dir, exist_ok=True)
    for i in range(0, len(dynamodb_items), 25):
        batch = dynamodb_items[i:i + 25]
        batch_file = os.path.join(output_dir, f'batch-{i//25 + 1}.json')
        with open(batch_file, 'w') as f:
            json.dump({
                "Questions": batch
            }, f, indent=2)
    
    print(f"Successfully processed {len(dynamodb_items)} questions into {(len(dynamodb_items) + 24) // 25} batch files")

if __name__ == "__main__":
    # Use command line arguments if provided, otherwise use defaults
    input_file = sys.argv[1] if len(sys.argv) > 1 else "backend/formatted_questions.json"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "backend/batches"
    
    convert_to_dynamodb_format(input_file, output_dir)
