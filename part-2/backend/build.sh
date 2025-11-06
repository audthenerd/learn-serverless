#!/bin/bash

# Build script to compile TypeScript handlers

echo "Building TypeScript handlers to .build folder..."

# Create .build directory if it doesn't exist
mkdir -p .build

# Array of handler directories
handlers=(
  "get-conversations"
  "get-conversation-by-id"
  "generate-response"
  "summarize"
)

# Compile each handler to .build folder
for handler in "${handlers[@]}"; do
  echo "Compiling $handler..."
  
  # Create handler directory in .build
  mkdir -p .build/$handler
  
  # Compile TypeScript to .build
  npx tsc src/handlers/$handler/index.ts \
    --outDir .build/$handler \
    --target ES2022 \
    --module ES2022 \
    --lib ES2022 \
    --moduleResolution node \
    --esModuleInterop \
    --skipLibCheck \
    --resolveJsonModule
  
  # Copy package.json to .build
  cp src/handlers/$handler/package.json .build/$handler/
done

echo "Build complete! Output in .build/"
