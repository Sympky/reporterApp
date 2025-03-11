#!/bin/bash

# Script to run ESLint only on the files we've fixed

echo "🧹 Running ESLint on fixed files..."
npx eslint resources/js/pages/reports/show.tsx resources/js/pages/clients/index.tsx resources/js/components/ui/textarea.tsx --fix

echo "✅ All done!" 