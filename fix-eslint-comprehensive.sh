#!/bin/bash

# Comprehensive script to fix all ESLint issues in the codebase

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

for file in $(grep -l "'CardFooter' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/, CardFooter//" "$file"
done

for file in $(grep -l "'Clipboard' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/, Clipboard//" "$file"
done

for file in $(grep -l "'Tabs' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { Tabs, TabsContent, TabsList, TabsTrigger } from '@\/components\/ui\/tabs';//" "$file"
done

for file in $(grep -l "'Table' is defined but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@\/components\/ui\/table';//" "$file"
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

# Comment out unused variables
for file in $(grep -l "'activeTab' is assigned a value but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/const \[activeTab, setActiveTab\] = useState<string>('overview');/\/\/ Unused: const [activeTab, setActiveTab] = useState<string>('overview');/" "$file"
done

for file in $(grep -l "'copied' is assigned a value but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/const \[copied, setCopied\] = useState(false);/\/\/ Unused: const [copied, setCopied] = useState(false);/" "$file"
done

for file in $(grep -l "'csrf_token' is assigned a value but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/const { csrf_token } = usePage().props as any;/\/\/ Unused: const { csrf_token } = usePage().props as unknown;/" "$file"
done

for file in $(grep -l "'copyToClipboard' is assigned a value but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/const copyToClipboard = () => {/\/\/ Unused: const copyToClipboard = () => {/" "$file"
  sed -i "s/setCopied(true);/\/\/ Unused: setCopied(true);/" "$file"
  sed -i "s/setTimeout(() => setCopied(false), 2000);/\/\/ Unused: setTimeout(() => setCopied(false), 2000);/" "$file"
done

for file in $(grep -l "'handleClientClick' is assigned a value but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/const handleClientClick = () => {/\/\/ Unused: const handleClientClick = () => {/" "$file"
done

for file in $(grep -l "'handleProjectClick' is assigned a value but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/const handleProjectClick = (projectId: number) => {/\/\/ Unused: const handleProjectClick = (projectId: number) => {/" "$file"
done

for file in $(grep -l "'handleVulnerabilityClick' is assigned a value but never used" --include="*.tsx" -r resources/js/); do
  sed -i "s/const handleVulnerabilityClick = (vulnerabilityId: number) => {/\/\/ Unused: const handleVulnerabilityClick = (vulnerabilityId: number) => {/" "$file"
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