import json
import re

def parse_questions(raw_text):
    # Split the raw text into individual questions using a regex pattern
    questions = re.split(r'(?=Question #\d+)', raw_text)
    parsed_questions = {}

    for raw_question in questions:
        if not raw_question.strip():
            continue  # Skip empty strings

        # Split the raw question into lines
        lines = raw_question.strip().split('\n')

        # Extract the question number
        q_num_match = re.match(r'Question #(\d+)', lines[0])
        if q_num_match:
            q_num = q_num_match.group(1)
        else:
            q_num = "Unknown"

        # Initialize variables
        question_lines = []
        options = []
        imageUrl = None
        correct_option = None

        # Flags
        in_options = False

        # Process each line
        for i, line in enumerate(lines[1:], 1):
            line = line.strip()
            if re.match(r'^[A-D]\.\s', line):
                in_options = True
                options.append({'text': line[3:].strip(), 'correct': False})
                continue
            elif line.startswith('Correct Answer:'):
                correct_letters = re.findall(r'Correct Answer:\s*([A-D])', line)
                if correct_letters:
                    correct_letter = correct_letters[0]
                    correct_index = ord(correct_letter) - ord('A')
                    if 0 <= correct_index < len(options):
                        options[correct_index]['correct'] = True
                break  # Rest of the data is not needed
            elif in_options and not line.startswith('Community vote distribution'):
                # Append to the last option if it spans multiple lines
                options[-1]['text'] += ' ' + line.strip()
            elif re.match(r'https?://', line):
                imageUrl = line.strip()
            elif not in_options:
                question_lines.append(line.strip())

        question_text = ' '.join(question_lines)

        # Construct the question entry
        question_entry = {
            f"Question #{q_num}": {
                "question": question_text,
                "imageUrl": imageUrl,
                "options": options
            }
        }

        # Add to the parsed questions
        parsed_questions.update(question_entry)

    return parsed_questions

# Read the raw_questions file
with open('raw_questions.txt', 'r', encoding='utf-8') as f:
    raw_data = f.read()

# Parse the questions
parsed_questions = parse_questions(raw_data)

# Write to formatted_questions.json
with open('formatted_questions.json', 'w', encoding='utf-8') as f:
    json.dump(parsed_questions, f, indent=4)

print("Questions have been successfully formatted and saved to formatted_questions.json.")