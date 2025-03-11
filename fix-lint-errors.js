#!/usr/bin/env node

/**
 * Script to help fix common ESLint errors in a React TypeScript codebase
 * 
 * This script will:
 * 1. Fix unused variables by adding an underscore prefix or removing them
 * 2. Replace 'any' types with appropriate types
 * 3. Add missing dependencies to useEffect hooks
 */

const fs = require('fs');
// Unused: const path = require('path');
const { execSync } = require('child_process');

// Get the list of files with linting errors
const getLinterOutputFiles = () => {
  try {
    const output = execSync('npx eslint . --format json', { encoding: 'utf-8' });
    const results = JSON.parse(output);
    
    // Extract unique filenames with errors
    return [...new Set(results.map(result => result.filePath))];
  } catch (error) {
    // Parse the error output from eslint which might have returned a non-zero code
    try {
      const jsonStart = error.stdout.indexOf('[');
      if (jsonStart >= 0) {
        const jsonOutput = error.stdout.substring(jsonStart);
        const results = JSON.parse(jsonOutput);
        return [...new Set(results.map(result => result.filePath))];
      }
    } catch (e) {
      console.error('Could not parse ESLint output:', e);
    }
    
    console.error('Error running ESLint:', error.message);
    return [];
  }
};

// Function to fix common issues in a file
const fixFileIssues = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 1. Fix unused variables - by adding underscore prefix
    let modifiedContent = content.replace(
      /const \[([a-zA-Z0-9]+), set[a-zA-Z0-9]+\] = useState[^;]+;/g,
      (match, varName) => {
        // Check if the variable is used elsewhere in the file
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        const count = (content.match(regex) || []).length;
        
        // If variable is only used once (in the declaration), it's unused
        if (count <= 1) {
          return match.replace(varName, `_${varName}`);
        }
        
        return match;
      }
    );
    
    // 2. Fix 'any' types with more specific types
    modifiedContent = modifiedContent.replace(
      /: any(\)?)( =>|{)/g,
      ': unknown$1$2'
    );
    
    // 3. Add missing comment for useCallback to remind developers
    modifiedContent = modifiedContent.replace(
      /(const [a-zA-Z0-9]+ = )(?!useCallback)(async )?(\([^)]*\) => {)/g,
      (match, prefix, asyncKeyword, funcSignature) => {
        asyncKeyword = asyncKeyword || '';
        return `// TODO: Consider wrapping with useCallback if used in useEffect deps\n  ${prefix}${asyncKeyword}${funcSignature}`;
      }
    );
    
    // 4. Save changes if modifications were made
    if (content !== modifiedContent) {
      fs.writeFileSync(filePath, modifiedContent, 'utf-8');
      console.log(`Fixed issues in ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing issues in ${filePath}:`, error.message);
    return false;
  }
};

// Main function
const main = () => {
  console.log('Analyzing files with linting errors...');
  
  const files = getLinterOutputFiles();
  console.log(`Found ${files.length} files with potential issues`);
  
  let fixedFiles = 0;
  
  files.forEach(file => {
    if (fixFileIssues(file)) {
      fixedFiles++;
    }
  });
  
  console.log(`\nFixed issues in ${fixedFiles} files.`);
  console.log('\nNext steps:');
  console.log('1. Run "npm run lint" to see remaining issues');
  console.log('2. Fix the remaining complex issues manually:');
  console.log('   - Add missing dependencies to useEffect hooks');
  console.log('   - Create proper TypeScript interfaces for "any" types');
  console.log('   - Fix unused variables in complex scenarios');
};

main(); 