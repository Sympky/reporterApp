#!/bin/bash

# Script to run tests with memory optimizations

# Disable Xdebug to reduce memory usage
export XDEBUG_MODE=off

# Run tests with increased memory limit
php -d memory_limit=512M artisan test "$@" 