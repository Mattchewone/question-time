#!/bin/bash

if command -v pm2 &> /dev/null; then
    pm2 delete question-time-api 2>/dev/null
    pm2 delete question-time-worker 2>/dev/null
    pm2 delete question-time-frontend 2>/dev/null
fi

pkill -f "question-time"
echo "All services stopped"