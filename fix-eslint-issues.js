#!/usr/bin/env node

/**
 * Script to automatically fix common ESLint issues in TypeScript React files
 * 
 * This script will:
 * 1. Remove unused variables by commenting them out
 * 2. Add missing dependencies to useEffect hooks
 * 3. Replace explicit 'any' types with more specific types
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get list of files with ESLint issues
const getFilesWithIssues = () => {
  try {
    const output = execSync('npx eslint . --format json').toString();
    const results = JSON.parse(output);
    return results.filter(result => result.errorCount > 0 || result.warningCount > 0)
      .map(result => ({
        filePath: result.filePath,
        messages: result.messages
      }));
  } catch (error) {
    // If eslint exits with error code, parse the output
    try {
      const jsonStr = error.stdout.toString();
      const results = JSON.parse(jsonStr);
      return results.filter(result => result.errorCount > 0 || result.warningCount > 0)
        .map(result => ({
          filePath: result.filePath,
          messages: result.messages
        }));
    } catch (e) {
      console.error('Failed to parse ESLint output:', e);
      return [];
    }
  }
};

// Fix unused variables by commenting them out
const fixUnusedVariables = (content, messages) => {
  let lines = content.split('\n');
  
  // Find all unused variable messages
  const unusedVars = messages.filter(msg => 
    msg.ruleId === '@typescript-eslint/no-unused-vars'
  );
  
  // Sort by line number in descending order to avoid position shifts
  unusedVars.sort((a, b) => b.line - a.line);
  
  for (const msg of unusedVars) {
    const lineIndex = msg.line - 1;
    const line = lines[lineIndex];
    const varName = msg.message.match(/'([^']+)'/)?.[1];
    
    if (varName && line.includes(varName)) {
      // Comment out the variable
      if (line.includes(` ${varName},`)) {
        // If it's in a destructuring pattern, just remove it
        lines[lineIndex] = line.replace(` ${varName},`, '');
      } else if (line.includes(`${varName},`)) {
        // If it's at the start of a destructuring pattern
        lines[lineIndex] = line.replace(`${varName},`, '');
      } else if (line.includes(`, ${varName}`)) {
        // If it's at the end of a destructuring pattern
        lines[lineIndex] = line.replace(`, ${varName}`, '');
      } else if (line.match(new RegExp(`\\b${varName}\\b.*=`))) {
        // If it's a variable declaration
        lines[lineIndex] = `// Unused: ${line}`;
      }
    }
  }
  
  return lines.join('\n');
};

// Fix missing dependencies in useEffect hooks
const fixUseEffectDeps = (content, messages) => {
  let lines = content.split('\n');
  
  // Find all useEffect dependency warnings
  const depWarnings = messages.filter(msg => 
    msg.ruleId === 'react-hooks/exhaustive-deps'
  );
  
  for (const warning of depWarnings) {
    const lineIndex = warning.line - 1;
// Unused:     const line = lines[lineIndex];
    
    // Extract the missing dependencies from the warning message
    const missingDepsMatch = warning.message.match(/(?:'([^']+)'(?:, )?)+/g);
    if (!missingDepsMatch) continue;
    
    const missingDeps = missingDepsMatch.map(dep => 
      dep.replace(/[',\s]/g, '')
    ).filter(Boolean);
    
    // Find the useEffect dependency array line
    let depArrayLineIndex = lineIndex;
    while (depArrayLineIndex < lines.length && !lines[depArrayLineIndex].includes('[]')) {
      depArrayLineIndex++;
    }
    
    if (depArrayLineIndex < lines.length) {
      const depArrayLine = lines[depArrayLineIndex];
      
      // Add the missing dependencies to the array
      if (depArrayLine.includes('[]')) {
        // Empty dependency array
        lines[depArrayLineIndex] = depArrayLine.replace('[]', `[${missingDeps.join(', ')}]`);
      } else {
        // Non-empty dependency array
        const match = depArrayLine.match(/\[(.*)\]/);
        if (match) {
          const existingDeps = match[1].split(',').map(d => d.trim()).filter(Boolean);
          const allDeps = [...new Set([...existingDeps, ...missingDeps])];
          lines[depArrayLineIndex] = depArrayLine.replace(/\[(.*)\]/, `[${allDeps.join(', ')}]`);
        }
      }
    }
  }
  
  return lines.join('\n');
};

// Fix explicit any types
const fixExplicitAny = (content, messages) => {
  let lines = content.split('\n');
  
  // Find all explicit any type messages
  const anyTypeMessages = messages.filter(msg => 
    msg.ruleId === '@typescript-eslint/no-explicit-any'
  );
  
  // Sort by line number in descending order to avoid position shifts
  anyTypeMessages.sort((a, b) => b.line - a.line);
  
  for (const msg of anyTypeMessages) {
    const lineIndex = msg.line - 1;
    const line = lines[lineIndex];
    
    // Replace 'any' with 'unknown' as a safer alternative
    lines[lineIndex] = line.replace(/: any/g, ': unknown');
    lines[lineIndex] = lines[lineIndex].replace(/<any>/g, '<unknown>');
    lines[lineIndex] = lines[lineIndex].replace(/<any,/g, '<unknown,');
    lines[lineIndex] = lines[lineIndex].replace(/,any>/g, ',unknown>');
  }
  
  return lines.join('\n');
};

// Fix empty interface types
const fixEmptyInterfaces = (content, messages) => {
  let lines = content.split('\n');
  
  // Find all empty interface type messages
  const emptyInterfaceMessages = messages.filter(msg => 
    msg.ruleId === '@typescript-eslint/no-empty-object-type'
  );
  
  // Sort by line number in descending order to avoid position shifts
  emptyInterfaceMessages.sort((a, b) => b.line - a.line);
  
  for (const msg of emptyInterfaceMessages) {
    const lineIndex = msg.line - 1;
    const line = lines[lineIndex];
    
    // Replace empty interface with Record<string, unknown>
    if (line.includes('{}')) {
      lines[lineIndex] = line.replace(/{}/g, 'Record<string, unknown>');
    }
  }
  
  return lines.join('\n');
};

// Process a file to fix ESLint issues
const processFile = (filePath, messages) => {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply fixes
    content = fixUnusedVariables(content, messages);
    content = fixUseEffectDeps(content, messages);
    content = fixExplicitAny(content, messages);
    content = fixEmptyInterfaces(content, messages);
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed issues in ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to process ${filePath}:`, error);
  }
};

// Main function
const main = () => {
  console.log('🔍 Finding files with ESLint issues...');
  const filesWithIssues = getFilesWithIssues();
  
  if (filesWithIssues.length === 0) {
    console.log('✨ No ESLint issues found!');
    return;
  }
  
  console.log(`🛠️ Found ${filesWithIssues.length} files with ESLint issues. Fixing...`);
  
  for (const file of filesWithIssues) {
    processFile(file.filePath, file.messages);
  }
  
  console.log('🎉 Finished fixing ESLint issues!');
  console.log('📝 Run "npm run lint" again to check for remaining issues.');
};

main(); 