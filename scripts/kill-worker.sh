#!/bin/bash

# Kill only the worker process
pm2 stop question-time-worker

echo "Worker killed. Other services remain running."