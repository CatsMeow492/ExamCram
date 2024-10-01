import json
import os

def convert_to_dynamodb_format(input_file, output_dir):
    with open(input_file, 'r') as f:
        questions = json.load(f)

    dynamodb_items = []
    for question_dict in questions:
        for question_id, question_data in question_dict.items():
            item = {
                "PutRequest": {
                    "Item": {
                        "QuestionID": {"S": question_id},
                        "question": {"S": question_data["question"]},
                        "options": {
                            "L": [
                                {
                                    "M": {
                                        "text": {"S": option["text"]},
                                        "correct": {"BOOL": option["correct"]}
                                    }
                                } for option in question_data["options"]
                            ]
                        }
                    }
                }
            }
            # Add image_url if it exists and is not None
            if "imageUrl" in question_data and question_data["imageUrl"] is not None:
                item["PutRequest"]["Item"]["imageUrl"] = {"S": question_data["imageUrl"]}
            
            dynamodb_items.append(item)

    # Split into batches of 25 items
    os.makedirs(output_dir, exist_ok=True)
    for i in range(0, len(dynamodb_items), 25):
        batch = dynamodb_items[i:i + 25]
        batch_file = os.path.join(output_dir, f'batch-{i//25 + 1}.json')
        with open(batch_file, 'w') as f:
            json.dump({"Questions": batch}, f, indent=2)

if __name__ == "__main__":
    convert_to_dynamodb_format('questions.json', 'batches')
