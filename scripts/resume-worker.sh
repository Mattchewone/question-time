#!/bin/bash

# Restart only the worker process
pm2 restart question-time-worker

echo "Worker Resumed. Other services remain running."