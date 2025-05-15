#!/bin/bash -eu

echo "--- 🔍 Running MCP inspector"
npm ci

# Run inspector with a timeout to prevent hanging in CI
set +e
INSPECTOR_OUTPUT=$(timeout 20s make inspector 2>&1)
INSPECTOR_EXIT_CODE=$?
set -e

if [ $INSPECTOR_EXIT_CODE -eq 124 ] && echo "$INSPECTOR_OUTPUT" | grep -q "is up and running"; then 
  echo "✅ Inspector timed out as expected and is running successfully"
  echo "Last output before timeout:"
  echo "$INSPECTOR_OUTPUT"
  exit 0
else 
  echo "❌ Inspector test failed"
  echo "Output:"
  echo "$INSPECTOR_OUTPUT"
  echo "Exit code: $INSPECTOR_EXIT_CODE"
  exit 1
fi
