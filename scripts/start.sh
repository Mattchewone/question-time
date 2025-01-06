#!/bin/bash

if ! command -v pm2 &> /dev/null; then
    echo "Installing pm2..."
    npm install -g pm2
fi

# Check if services are already running
if pm2 list | grep -q "question-time"; then
    echo "Services already running. Reloading instead..."
    ./scripts/reload.sh
    exit 0
fi

cd backend

# Start API and Worker with pm2
pm2 start npm --name "question-time-api" -- run api
pm2 start npm --name "question-time-worker" -- run worker

cd ../frontend
pm2 start npm --name "question-time-frontend" -- start

echo "Services started. Use 'pm2 logs' to view logs"
echo "Use 'pm2 list' to see running processes"