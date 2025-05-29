#!/bin/bash -eu

echo "--- 🚀 Testing MCP server startup"
npm ci
npm run build

# Run the server with a timeout to prevent hanging in CI
set +e
SERVER_OUTPUT=$(timeout 10s node build/index.js 2>&1)
SERVER_EXIT_CODE=$?
set -e

# Check for exit code 124, which indicates the timeout was reached (process was still running)
# Also check for a successful startup message in the output
if [ $SERVER_EXIT_CODE -eq 124 ] && echo "$SERVER_OUTPUT" | grep -q "Gravatar MCP Server running on stdio"; then 
  echo "✅ Server started successfully and was running when timeout occurred"
  echo "Last output before timeout:"
  echo "$SERVER_OUTPUT"
  exit 0
else 
  echo "❌ Server startup test failed"
  echo "Output:"
  echo "$SERVER_OUTPUT"
  echo "Exit code: $SERVER_EXIT_CODE"
  exit 1
fi
