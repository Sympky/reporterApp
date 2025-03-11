#!/bin/bash

# Script to run tests with memory optimizations

# Check if running with coverage
if [[ "$*" == *"--coverage"* || "$*" == *"-coverage"* || "$XDEBUG_MODE" == "coverage" ]]; then
  # Enable Xdebug coverage if coverage parameter is passed
  export XDEBUG_MODE=coverage
  echo "Running tests with code coverage (Xdebug required)"
else
  # Disable Xdebug to reduce memory usage
  export XDEBUG_MODE=off
  echo "Running tests with Xdebug disabled for better performance"
fi

# Run tests with increased memory limit
php -d memory_limit=512M artisan test "$@" 