#!/bin/bash

# Script to fix all ESLint issues in the codebase

echo "🔍 Fixing unused variables..."
# Fix unused variables in components
for file in $(grep -l "'loading' is assigned a value but never used" --include="*.tsx" -r resources/js/components/); do
  sed -i "s/const \[loading, setLoading\] = useState(true);/const [, setLoading] = useState(true);/" "$file"
done

for file in $(grep -l "'project' is assigned a value but never used" --include="*.tsx" -r resources/js/components/); do
  sed -i "s/const \[project, setProject\] = useState<Project | null>(null);/const [, setProject] = useState<Project | null>(null);/" "$file"
done

for file in $(grep -l "'template' is assigned a value but never used" --include="*.tsx" -r resources/js/components/); do
  sed -i "s/const \[template, setTemplate\] = useState<Template | null>(null);/const [, setTemplate] = useState<Template | null>(null);/" "$file"
done

for file in $(grep -l "'vulnerability' is assigned a value but never used" --include="*.tsx" -r resources/js/components/); do
  sed -i "s/const \[vulnerability, setVulnerability\] = useState<Vulnerability | null>(null);/const [, setVulnerability] = useState<Vulnerability | null>(null);/" "$file"
done

# Fix unused event parameters
for file in $(grep -l "'e' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/(e) => {/(_) => {/" "$file"
  sed -i "s/(e: React.FormEvent) => {/(\_: React.FormEvent) => {/" "$file"
  sed -i "s/(e: React.MouseEvent) => {/(\_: React.MouseEvent) => {/" "$file"
  sed -i "s/(e: React.ChangeEvent<HTMLInputElement>) => {/(\_: React.ChangeEvent<HTMLInputElement>) => {/" "$file"
done

echo "🔧 Fixing explicit 'any' types..."
# Replace explicit 'any' types with 'unknown'
for file in $(grep -l "Unexpected any. Specify a different type" --include="*.tsx" -r resources/js/); do
  sed -i "s/: any/: unknown/g" "$file"
  sed -i "s/<any>/<unknown>/g" "$file"
  sed -i "s/<any,/<unknown,/g" "$file"
  sed -i "s/,any>/,unknown>/g" "$file"
done

echo "🔄 Fixing useEffect dependencies..."
# Run our Node.js script to fix useEffect dependencies
node fix-eslint-issues.js

echo "🧹 Running ESLint with --fix option..."
# Run ESLint with --fix to automatically fix remaining issues
npx eslint . --fix

echo "✅ All done! Check for any remaining issues with 'npm run lint'" 