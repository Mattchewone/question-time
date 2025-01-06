#!/bin/bash

# Check if pm2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing pm2..."
    npm install -g pm2
fi

echo "Reloading services..."

# Reload each service
cd backend
pm2 reload question-time-api --update-env
pm2 reload question-time-worker --update-env

cd ../frontend
pm2 reload question-time-frontend --update-env

echo "Services reloaded. Use 'pm2 logs' to view logs"
echo "Use 'pm2 list' to see running processes" 