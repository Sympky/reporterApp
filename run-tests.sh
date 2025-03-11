#!/bin/bash

# Enhanced test runner script that follows the same approach as GitHub Actions workflow
# It runs unit and feature tests separately to avoid the issues when running them together

set -e  # Exit immediately if a command exits with a non-zero status

# Process arguments
COVERAGE=0
SPECIFIC_PATH=""

for arg in "$@"; do
  if [[ "$arg" == "--coverage" ]]; then
    COVERAGE=1
  elif [[ "$arg" != "--"* ]]; then
    SPECIFIC_PATH="$arg"
  fi
done

# Setup environment
export DB_CONNECTION=sqlite
export DB_DATABASE=":memory:"
export DB_TRANSACTION_NESTING=false
export VITE_MANIFEST_MOCK=true

# Create Vite mock if it doesn't exist yet
if [ ! -f "public/build/manifest.json" ]; then
  echo "Creating Vite mock manifest..."
  mkdir -p public/build/assets
  
  # Create a minimal mock manifest
  echo '{
    "resources/js/app.tsx": {
      "file": "assets/app-mock.js",
      "src": "resources/js/app.tsx",
      "isEntry": true,
      "css": ["assets/app-mock.css"]
    }
  }' > public/build/manifest.json
  
  # Create minimal mock assets
  echo '// Mock JS file' > public/build/assets/app-mock.js
  echo '/* Mock CSS file */' > public/build/assets/app-mock.css
fi

# Function to run tests
run_tests() {
  TEST_PATH="$1"
  COVERAGE_FILE="$2"
  
  echo "================================================================"
  echo "Running tests in: $TEST_PATH"
  echo "================================================================"
  
  if [ $COVERAGE -eq 1 ]; then
    export XDEBUG_MODE=coverage
    php artisan test "$TEST_PATH" --coverage-clover="$COVERAGE_FILE"
  else
    php -d memory_limit=512M artisan test "$TEST_PATH"
  fi
}

# Run tests based on arguments
if [ -n "$SPECIFIC_PATH" ]; then
  # If a specific path is provided, just run that
  if [ $COVERAGE -eq 1 ]; then
    export XDEBUG_MODE=coverage
    php artisan test "$SPECIFIC_PATH" --coverage-clover=coverage.xml
  else
    php -d memory_limit=512M artisan test "$SPECIFIC_PATH"
  fi
else
  # Run unit and feature tests separately
  run_tests "tests/Unit" "coverage-unit.xml"
  run_tests "tests/Feature" "coverage-feature.xml"
  
  # Merge coverage reports if needed
  if [ $COVERAGE -eq 1 ]; then
    echo "Merging coverage reports..."
    php -r '
      $unit = simplexml_load_file("coverage-unit.xml");
      $feature = simplexml_load_file("coverage-feature.xml");
      
      // Combine metrics
      $unit_metrics = $unit->project->metrics;
      $feature_metrics = $feature->project->metrics;
      
      $combined_metrics = clone $unit_metrics;
      $combined_metrics["statements"] = (int)$unit_metrics["statements"] + (int)$feature_metrics["statements"];
      $combined_metrics["coveredstatements"] = (int)$unit_metrics["coveredstatements"] + (int)$feature_metrics["coveredstatements"];
      $combined_metrics["methods"] = (int)$unit_metrics["methods"] + (int)$feature_metrics["methods"];
      $combined_metrics["coveredmethods"] = (int)$unit_metrics["coveredmethods"] + (int)$feature_metrics["coveredmethods"];
      $combined_metrics["elements"] = (int)$unit_metrics["elements"] + (int)$feature_metrics["elements"];
      $combined_metrics["coveredelements"] = (int)$unit_metrics["coveredelements"] + (int)$feature_metrics["coveredelements"];
      
      $unit->project->metrics = $combined_metrics;
      
      // Add feature test files data
      foreach ($feature->project->file as $file) {
          $exists = false;
          foreach ($unit->project->file as $unit_file) {
              if ((string)$unit_file["name"] === (string)$file["name"]) {
                  $exists = true;
                  break;
              }
          }
          if (!$exists) {
              $new_file = $unit->project->addChild("file");
              foreach ($file->attributes() as $name => $value) {
                  $new_file->addAttribute($name, $value);
              }
              foreach ($file->children() as $child) {
                  $new_child = $new_file->addChild($child->getName());
                  foreach ($child->attributes() as $name => $value) {
                      $new_child->addAttribute($name, $value);
                  }
              }
          }
      }
      
      $unit->asXML("coverage.xml");
    '
    echo "Combined coverage report saved to coverage.xml"
  fi
fi

echo "All tests completed successfully." 