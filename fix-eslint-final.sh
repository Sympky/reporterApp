#!/bin/bash

# Final script to fix all remaining ESLint issues in the codebase

echo "🔧 Fixing unused variables in our own scripts..."
# Remove unused 'path' import in our scripts
sed -i "s/import path from 'fs';/\/\/ import path from 'fs';/" fix-eslint-issues.js
sed -i "s/import path from 'fs';/\/\/ import path from 'fs';/" fix-lint-errors.mjs

echo "🔧 Fixing unused variables in components..."
# Fix unused 'row' variables in components
for file in $(grep -l "'row' is defined but never used" --include="*.tsx" -r resources/js/components/); do
  sed -i "s/(row) => {/(\_) => {/g" "$file"
  sed -i "s/(row: Row<.*>) => {/(\_: Row<.*>) => {/g" "$file"
done

# Fix unused 'e' variables
for file in $(grep -l "'e' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/(e) => {/(\_) => {/g" "$file"
  sed -i "s/(e: React.FormEvent) => {/(\_: React.FormEvent) => {/g" "$file"
  sed -i "s/(e: React.MouseEvent) => {/(\_: React.MouseEvent) => {/g" "$file"
  sed -i "s/(e: React.ChangeEvent<HTMLInputElement>) => {/(\_: React.ChangeEvent<HTMLInputElement>) => {/g" "$file"
done

echo "🔧 Fixing unused imports..."
# Remove unused imports
for file in $(grep -l "'Separator' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*Separator.* } from '@\/components\/ui\/separator';//g" "$file"
done

for file in $(grep -l "'SelectValue' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*SelectValue.* } from '@\/components\/ui\/select';//g" "$file"
done

for file in $(grep -l "'usePage' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*usePage.* } from '@inertiajs\/react';//g" "$file"
done

for file in $(grep -l "'Label' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*Label.* } from '@\/components\/ui\/label';//g" "$file"
done

for file in $(grep -l "'Input' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*Input.* } from '@\/components\/ui\/input';//g" "$file"
done

for file in $(grep -l "'Textarea' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*Textarea.* } from '@\/components\/ui\/textarea';//g" "$file"
done

for file in $(grep -l "'useEffect' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*useEffect.* } from 'react';//g" "$file"
done

echo "🔧 Fixing explicit 'any' types..."
# Replace explicit 'any' types with 'unknown'
for file in $(grep -l "Unexpected any. Specify a different type" --include="*.tsx" -r resources/js/); do
  sed -i "s/: any/: unknown/g" "$file"
  sed -i "s/<any>/<unknown>/g" "$file"
  sed -i "s/<any,/<unknown,/g" "$file"
  sed -i "s/,any>/,unknown>/g" "$file"
  sed -i "s/props as any/props as unknown/g" "$file"
done

echo "🔄 Fixing useEffect dependencies..."
# Add missing dependencies to useEffect hooks
for file in $(grep -l "React Hook useEffect has a missing dependency: 'setData'" --include="*.tsx" -r resources/js/); do
  sed -i "s/\[\]/\[setData\]/g" "$file"
done

for file in $(grep -l "React Hook useEffect has missing dependencies: 'data.project_id' and 'setData'" --include="*.tsx" -r resources/js/); do
  sed -i "s/\[\]/\[data.project_id, setData\]/g" "$file"
done

for file in $(grep -l "React Hook useEffect has a missing dependency: 'setCommonVulnerabilities'" --include="*.tsx" -r resources/js/); do
  sed -i "s/\[\]/\[setCommonVulnerabilities\]/g" "$file"
done

echo "🧹 Running ESLint with --fix option..."
# Run ESLint with --fix to automatically fix remaining issues
npx eslint . --fix

echo "✅ All done! Check for any remaining issues with 'npm run lint'" 