#!/bin/bash

# Set the table name
TABLE_NAME="Questions"

# Iterate over each batch file in the batches directory
for batch_file in batches/batch-*.json; do
  echo "Uploading $batch_file to DynamoDB..."
  aws dynamodb batch-write-item --request-items file://$batch_file
done

echo "All batches uploaded successfully."