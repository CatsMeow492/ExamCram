#!/usr/bin/env python3
import json
import os

def merge_question_files():
    # Load the new questions
    with open('formatted_questions_new.json', 'r') as f:
        new_questions = json.load(f)
    
    # Load the existing questions
    with open('formatted_questions.json', 'r') as f:
        existing_questions = json.load(f)
    
    # Create a backup of the original file
    with open('formatted_questions.bak.json', 'w') as f:
        json.dump(existing_questions, f, indent=2)
    
    # Merge the two dictionaries (new questions will be added to existing ones)
    merged_questions = {**new_questions, **existing_questions}
    
    # Sort by question number
    sorted_keys = sorted(merged_questions.keys(), 
                         key=lambda x: int(x.split('#')[1]) if len(x.split('#')) > 1 and x.split('#')[1].isdigit() else 9999)
    
    sorted_questions = {k: merged_questions[k] for k in sorted_keys}
    
    # Save the merged questions back to formatted_questions.json
    with open('formatted_questions_merged.json', 'w') as f:
        json.dump(sorted_questions, f, indent=2)
    
    print(f"Original question count: {len(existing_questions)}")
    print(f"New question count: {len(new_questions)}")
    print(f"Merged question count: {len(merged_questions)}")
    print(f"Saved merged questions to formatted_questions_merged.json")
    print("To use these questions, rename formatted_questions_merged.json to formatted_questions.json")

if __name__ == "__main__":
    merge_question_files() 