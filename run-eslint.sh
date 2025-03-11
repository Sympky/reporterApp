#!/bin/bash

# Script to run ESLint with the --max-warnings flag

echo "🧹 Running ESLint with --fix and --max-warnings=100..."
npx eslint . --fix --max-warnings=100

echo "✅ All done!" 