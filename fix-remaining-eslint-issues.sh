#!/bin/bash

# Script to fix remaining ESLint issues in the codebase

echo "🔍 Fixing unused imports..."
# Remove unused imports
for file in $(grep -l "'Separator' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*Separator.* } from '@\/components\/ui\/separator';//" "$file"
done

for file in $(grep -l "'SelectValue' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*SelectValue.* } from '@\/components\/ui\/select';//" "$file"
done

for file in $(grep -l "'usePage' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*usePage.* } from '@inertiajs\/react';//" "$file"
done

for file in $(grep -l "'Label' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*Label.* } from '@\/components\/ui\/label';//" "$file"
done

for file in $(grep -l "'Input' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*Input.* } from '@\/components\/ui\/input';//" "$file"
done

for file in $(grep -l "'Textarea' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*Textarea.* } from '@\/components\/ui\/textarea';//" "$file"
done

for file in $(grep -l "'useEffect' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { .*useEffect.* } from 'react';//" "$file"
done

echo "🔧 Fixing unused variables..."
# Fix unused variables in components
for file in $(grep -l "'row' is defined but never used" --include="*.tsx" -r resources/js/components/); do
  sed -i "s/(row) => {/(\_) => {/" "$file"
  sed -i "s/(row: Row<.*>) => {/(\_: Row<.*>) => {/" "$file"
done

for file in $(grep -l "'e' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/(e) => {/(\_) => {/" "$file"
  sed -i "s/(e: React.FormEvent) => {/(\_: React.FormEvent) => {/" "$file"
  sed -i "s/(e: React.MouseEvent) => {/(\_: React.MouseEvent) => {/" "$file"
  sed -i "s/(e: React.ChangeEvent<HTMLInputElement>) => {/(\_: React.ChangeEvent<HTMLInputElement>) => {/" "$file"
done

echo "🔄 Fixing useEffect dependencies..."
# Add missing dependencies to useEffect hooks
for file in $(grep -l "React Hook useEffect has a missing dependency: 'setData'" --include="*.tsx" -r resources/js/); do
  sed -i "s/\[\]/\[setData\]/" "$file"
done

for file in $(grep -l "React Hook useEffect has missing dependencies: 'data.project_id' and 'setData'" --include="*.tsx" -r resources/js/); do
  sed -i "s/\[\]/\[data.project_id, setData\]/" "$file"
done

for file in $(grep -l "React Hook useEffect has a missing dependency: 'setCommonVulnerabilities'" --include="*.tsx" -r resources/js/); do
  sed -i "s/\[\]/\[setCommonVulnerabilities\]/" "$file"
done

echo "🧹 Running ESLint with --fix option..."
# Run ESLint with --fix to automatically fix remaining issues
npx eslint . --fix

echo "✅ All done! Check for any remaining issues with 'npm run lint'" 