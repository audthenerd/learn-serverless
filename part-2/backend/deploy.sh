#!/bin/bash

# Usage: ./deploy.sh [profile-name]
# Example: ./deploy.sh notifly-dev

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if AI_API_KEY is set
if [ -z "$AI_API_KEY" ]; then
  echo "Error: AI_API_KEY not found in .env file"
  exit 1
fi

# Get profile from argument or use default
PROFILE=${1:-default}

# Deploy with parameter override
echo "Deploying with profile: $PROFILE"
sam deploy --profile $PROFILE --parameter-overrides AiApiKey=$AI_API_KEY
