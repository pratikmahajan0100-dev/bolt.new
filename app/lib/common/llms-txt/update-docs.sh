#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="$SCRIPT_DIR"
DOCS_CONFIG="$DOCS_DIR/docs.json"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed. Please install jq."
  exit 1
fi

# Read number of libraries from docs.json
LIB_COUNT=$(jq '.libraries | length' "$DOCS_CONFIG")
TODAY=$(date +%Y-%m-%d)

# Loop through libraries
for ((i=0; i<$LIB_COUNT; i++)); do
  NAME=$(jq -r ".libraries[$i].name" "$DOCS_CONFIG")
  DOC_SOURCE=$(jq -r ".libraries[$i].docSource" "$DOCS_CONFIG")
  DOC_FILE=$(jq -r ".libraries[$i].docFile" "$DOCS_CONFIG")
  
  echo "Updating docs for $NAME..."
  
  # Download content
  if curl -s "$DOC_SOURCE" -o "$DOCS_DIR/$DOC_FILE"; then
    echo "Updated $NAME docs successfully."
    
    # Update lastUpdated date in the config
    jq ".libraries[$i].lastUpdated = \"$TODAY\"" "$DOCS_CONFIG" > "$DOCS_CONFIG.tmp" && mv "$DOCS_CONFIG.tmp" "$DOCS_CONFIG"
  else
    echo "Error: Failed to download docs for $NAME"
  fi
done

echo "Documentation update complete." 