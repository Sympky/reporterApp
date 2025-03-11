# GitHub Workflows for Laravel Testing

This directory contains GitHub Actions workflow configurations for automated testing and code quality checks for the Laravel application.

## Available Workflows

### 1. Laravel Tests (`laravel-tests.yml`)

A streamlined workflow that runs unit and feature tests separately to avoid the issues with running them together. It:

- Triggers only on relevant file changes to avoid unnecessary runs
- Sets up PHP 8.2 with necessary extensions
- Configures a MySQL service for tests that require a database
- Uses caching for faster Composer dependency installation
- Uses a file-based SQLite database for migrations and seeding
- Uses in-memory SQLite for faster test execution
- Runs unit and feature tests separately to avoid integration issues
- Generates and merges coverage reports from both test suites
- Uploads coverage data to Codecov
- Uploads logs and configuration files as artifacts if tests fail

### 2. Code Quality Checks (`lint.yml`)

A workflow focused on code style and linting:

- Triggers only on relevant file changes
- Runs Laravel Pint for PHP code style checks in test mode
- Runs frontend formatting checks
- Runs linting checks for JavaScript/TypeScript code
- Uses proper caching for both PHP and Node.js dependencies

## Key Improvements

1. **Eliminated the custom run-tests.sh script**:
   - Now uses `php artisan test` directly with appropriate flags
   - Runs unit and feature tests separately, which solves the failure issue

2. **More targeted workflow triggers**:
   - Only runs workflows when relevant files change
   - Reduces unnecessary CI/CD runs

3. **Improved dependency caching**:
   - Faster workflow execution
   - Reduces GitHub Actions usage

4. **Simplified Vite mock setup**:
   - More maintainable with minimal mock files
   - Still provides the necessary frontend mock for testing

5. **Sequential test execution**:
   - Runs unit and feature tests separately to avoid conflicts
   - Coverage reports from both test suites are merged

## Environment Configuration

The workflows use specialized environment configurations:

1. **SQLite for testing**:
   - File-based for migrations: `${{ github.workspace }}/database/database.sqlite`
   - In-memory for tests: `:memory:`

2. **Special environment variables**:
   - `DB_TRANSACTION_NESTING=false`: Prevents transaction issues in tests
   - `VITE_MANIFEST_MOCK=true`: Tells the app to use mock frontend assets

## Common Options for Test Commands

- `--without-tty`: Prevents issues with terminal output in CI environments
- `--coverage-clover=file.xml`: Generates code coverage reports

## Troubleshooting

If you encounter issues:

1. **Tests failing in CI but passing locally**:
   - Check the workflow logs for specific errors
   - Ensure your database setup is similar between environments
   - Consider if your tests rely on specific database state

2. **Coverage reports not generating**:
   - Make sure Xdebug is properly configured
   - Check that `XDEBUG_MODE=coverage` is set

3. **Vite-related errors**:
   - Check that the mock Vite manifest is being created correctly
   - Make sure your tests aren't relying on specific asset behavior

For more information on GitHub Actions, see the [official documentation](https://docs.github.com/en/actions). 