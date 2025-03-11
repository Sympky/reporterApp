#!/bin/bash

# Script to fix 'any' types in the codebase

echo "🔧 Fixing explicit 'any' types..."
# Replace explicit 'any' types with 'unknown'
for file in $(grep -l "Unexpected any. Specify a different type" --include="*.tsx" -r resources/js/); do
  sed -i "s/: any/: unknown/g" "$file"
  sed -i "s/<any>/<unknown>/g" "$file"
  sed -i "s/<any,/<unknown,/g" "$file"
  sed -i "s/,any>/,unknown>/g" "$file"
done

echo "🧹 Running ESLint with --fix option..."
# Run ESLint with --fix to automatically fix remaining issues
npx eslint . --fix

echo "✅ All done! Check for any remaining issues with 'npm run lint'" 