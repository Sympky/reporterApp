# Fixing ESLint Errors in the Reporter App

This document provides guidance on fixing the ESLint errors in the React components of the Reporter App.

## Common ESLint Error Types

The codebase has several recurring ESLint error types:

1. **Unused variables** (`@typescript-eslint/no-unused-vars`)
   - Variables that are declared but never used in the code

2. **Usage of `any` type** (`@typescript-eslint/no-explicit-any`) 
   - TypeScript's `any` type defeats the purpose of static typing

3. **React Hook dependency warnings** (`react-hooks/exhaustive-deps`)
   - `useEffect` hooks missing dependencies in their dependency arrays

4. **Empty interface** (`@typescript-eslint/no-empty-object-type`)
   - Interfaces that don't declare any members

## Automated Fixes

We've created a helper script to fix common issues:

```bash
# Make the script executable if it's not already
chmod +x fix-lint-errors.js

# Run the script
./fix-lint-errors.js
```

This script will:
- Prefix unused variables with underscore
- Replace `any` types with `unknown` (which requires explicit type checking)
- Add comments to functions that should be wrapped in `useCallback`

## Manual Fixes Guide

After running the script, you'll need to manually fix the following types of issues:

### 1. Fixing Unused Variables

For unused variables, you have three options:

1. **Remove the variable completely** if it's not needed:
   ```tsx
   // Before
   const [loading, setLoading] = useState(true);
   
   // After
   // Variable removed entirely
   ```

2. **Prefix with underscore** to indicate intentional non-use:
   ```tsx
   // Before
   const [loading, setLoading] = useState(true);
   
   // After
   const [_loading, setLoading] = useState(true);
   ```

3. **Fix the component logic** to use the variable if it's actually needed:
   ```tsx
   // Before (loading not used)
   const [loading, setLoading] = useState(true);
   
   // After (loading used)
   const [loading, setLoading] = useState(true);
   return (
     <div>{loading ? <Spinner /> : <Content />}</div>
   );
   ```

### 2. Fixing `any` Types

Replace `any` types with proper TypeScript types:

```tsx
// Before
function formatArray(arr: any): string {
  // ...
}

// After
function formatArray(arr: string | unknown): string {
  // ...
}
```

For component props or function parameters, create proper interfaces:

```tsx
// Before
function handleData(data: any) {
  // ...
}

// After
interface DataPayload {
  id: number;
  name: string;
  // other specific properties
}

function handleData(data: DataPayload) {
  // ...
}
```

### 3. Fixing React Hook Dependencies

For functions used in `useEffect` dependencies, wrap them with `useCallback`:

```tsx
// Before
const fetchData = async () => {
  // ... implementation
};

useEffect(() => {
  fetchData();
}, [id]); // Missing fetchData dependency

// After
const fetchData = useCallback(async () => {
  // ... implementation
}, [id]);

useEffect(() => {
  fetchData();
}, [fetchData]); // Now includes fetchData
```

For state update functions in `useEffect`, make sure to include them:

```tsx
// Before
useEffect(() => {
  setData({ /* ... */ });
}, []); // Missing setData dependency

// After
useEffect(() => {
  setData({ /* ... */ });
}, [setData]); // Now includes setData
```

### 4. Fixing Empty Interfaces

Extend from existing base interfaces instead of creating empty ones:

```tsx
// Before
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

// After - just use the base interface directly, or add additional properties
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // Additional properties would go here
}
```

## Common Fix Patterns

Here are some recurring patterns in the codebase that need fixes:

1. **Dashboard components** often have unused client/project click handlers
2. **Table components** frequently use `any` for data types
3. **Form components** have missing React Hook dependencies
4. **Event handlers** often have unused event parameters (`e`)

## Running ESLint

After making fixes, run ESLint to check your progress:

```bash
npm run lint
```

This will show you the remaining errors and warnings to fix.

## Preventing Future Errors

To prevent these errors in the future:

1. **Use a pre-commit hook** to catch linting errors before committing
2. **Configure your IDE** to show ESLint errors in real-time
3. **Run ESLint regularly** during development

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-rules.html)
- [ESLint Documentation](https://eslint.org/docs/user-guide/getting-started) 