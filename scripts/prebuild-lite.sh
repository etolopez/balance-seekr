#!/bin/bash
# Prebuild script wrapper for Lite builds
# This wrapper ensures the script runs correctly even when EAS passes extra arguments

# Ignore all command line arguments - we only use environment variables
# EAS may pass --platform, etc., but we don't need them

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root to ensure relative paths work
cd "$PROJECT_ROOT"

# Run the Node.js prebuild script (ignore any arguments passed by EAS)
# Capture the exit code and propagate it
node "$SCRIPT_DIR/prebuild-lite.js"
EXIT_CODE=$?

# Exit with the same code as the Node script
exit $EXIT_CODE

