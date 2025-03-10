# GitHub Workflows for Laravel Testing

This directory contains GitHub Actions workflow configurations for automated testing of the Laravel application.

## Available Workflows

### 1. Laravel Tests (`laravel-tests.yml`)

A comprehensive workflow that runs both unit and feature tests. It:

- Sets up PHP 8.2 with necessary extensions
- Configures a MySQL service for tests that require a database
- Uses in-memory SQLite for faster test execution
- Runs migrations and seeds the database
- Executes both unit and feature tests
- Uploads logs and configuration files as artifacts if tests fail

### 2. Unit Tests (`unit-tests.yml`)

A focused workflow for unit testing with code coverage reporting. It:

- Only triggers on changes to PHP files, composer files, or PHPUnit configuration
- Uses dependency caching to speed up workflow runs
- Generates code coverage reports
- Uploads coverage data to Codecov (if configured)
- Creates JUnit XML test reports
- Always uploads test results and coverage data as artifacts

## Customization

### PHP Version

If you need to change the PHP version, modify the `php-version` parameter in the `setup-php` step:

```yaml
- uses: shivammathur/setup-php@v2
  with:
    php-version: '8.1' # Change to your required version
```

### Database Configuration

By default, tests use SQLite in-memory for speed. To use MySQL or another database:

1. In the environment variables, change:
```yaml
env:
  DB_CONNECTION: mysql
  DB_HOST: 127.0.0.1
  DB_PORT: 3306
  DB_DATABASE: testing
  DB_USERNAME: root
  DB_PASSWORD: password
```

### Branches

To change which branches trigger the workflows, modify the `branches` section:

```yaml
on:
  push:
    branches: [ main, staging, production ] # Your branches here
```

### Test Path

To run specific test directories or files, modify the path in the test execution steps:

```yaml
- name: Run specific tests
  run: ./run-tests.sh tests/Unit/Http/Controllers
```

## Troubleshooting

If you encounter issues:

1. Check the workflow logs in the GitHub Actions tab
2. Ensure your `.env.example` file is properly configured
3. Verify that your tests run successfully locally
4. Make sure the `run-tests.sh` script is executable and working locally

For more information on GitHub Actions, see the [official documentation](https://docs.github.com/en/actions). 