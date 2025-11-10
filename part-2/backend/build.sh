#!/bin/bash

# Build script to compile TypeScript handlers

echo "Building TypeScript handlers to .build folder..."

# Create .build directory if it doesn't exist
mkdir -p .build

# Install dev dependencies if node_modules doesn't exist (for building)
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies for build..."
  npm install
fi

# Compile entire src directory preserving structure
echo "Compiling TypeScript source..."
./node_modules/.bin/tsc

# Install production-only dependencies in .build
echo "Installing production dependencies..."
cp package.json .build/
cd .build || exit
npm install --production --no-save
cd ..

# Dynamically find all handler directories
echo "Finding handlers in src/handlers/..."
handlers=()
for dir in src/handlers/*/; do
  if [ -d "$dir" ]; then
    handler=$(basename "$dir")
    handlers+=("$handler")
    echo "Found handler: $handler"
  fi
done

# Setup each handler with utils, middleware, schemas and node_modules
for handler in "${handlers[@]}"; do
  if [ -d ".build/handlers/$handler" ]; then
    echo "Setting up $handler..."
    
    # Copy utils folder to each handler directory
    if [ -d ".build/utils" ]; then
      echo "  Copying utils to $handler..."
      cp -r .build/utils .build/handlers/"$handler"/utils
    fi
    
    # Copy middleware folder to each handler directory
    if [ -d ".build/middleware" ]; then
      echo "  Copying middleware to $handler..."
      cp -r .build/middleware .build/handlers/"$handler"/middleware
    fi
    
    # Replace relative import paths in all compiled JS files
    echo "  Fixing import paths in $handler..."
    find ".build/handlers/$handler" -name "*.js" -type f | while read -r jsfile; do
      # First: Remove ../../ and replace with ./
      sed -i '' 's|"\.\./\.\./|"./|g' "$jsfile"
      sed -i '' "s|'\.\./\.\./|'./|g" "$jsfile"
      
      # Then: Add .mjs extension to all relative imports (starting with ./ or ../)
      # For double quotes
      sed -i '' 's|"\(\.\./[^"]*\)"|"\1.mjs"|g' "$jsfile"
      sed -i '' 's|"\(\./[^"]*\)"|"\1.mjs"|g' "$jsfile"
      # For single quotes
      sed -i '' "s|'\(\.\./[^']*\)'|'\1.mjs'|g" "$jsfile"
      sed -i '' "s|'\(\./[^']*\)'|'\1.mjs'|g" "$jsfile"
    done
    
    # Rename all .js files to .mjs (ES modules without package.json)
    echo "  Renaming .js to .mjs in $handler..."
    find ".build/handlers/$handler" -name "*.js" -type f | while read -r jsfile; do
      mv "$jsfile" "${jsfile%.js}.mjs"
    done
    
    # Symlink production node_modules
    ln -sf ../../node_modules .build/handlers/"$handler"/node_modules
  fi
done

echo "Build complete! Output in .build/"
