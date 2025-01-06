# Question Time Game

A real-time quiz game built with Temporal.io, Express, and React.

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Temporal server running locally or remotely

## Setup

1. Clone the repository
2. Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
```
3. Create a `.env` file in the `backend` directory with the variables from the `.env-example` file

```bash
cp backend/.env-example backend/.env
```

## Scripts

The following scripts are available in the `scripts` directory:

- `start.sh`: Starts all services (API, worker, and frontend)
- `stop.sh`: Stops all services gracefully
- `kill-worker.sh`: Kills the worker process (for testing resilience)

### Running the Application

To start the application, run the following command:
```bash
./scripts/start.sh
```

### Stopping the Application

To stop the application, run the following command:
```bash
./scripts/stop.sh
```

### Testing Worker Resilience

To test the worker's resilience, run the following command:
```bash
./scripts/kill-worker.sh
```

To restart the worker:
```bash
./scripts/resume-worker.sh
```

### Reloading the Application

To reload all services without stopping them:
```bash
./scripts/reload.sh
```

The start script will automatically use reload if services are already running.

## Architecture

- Frontend: React application (port 3000)
- Backend API: Express server (port 4000)
- Temporal Worker: Handles game logic and state
- Temporal Server: Orchestrates workflows

## Development

- Frontend code is in `frontend/src`
- Backend code is in `backend/src`
- Temporal workflows and activities are in `backend/src/workflows.ts` and `backend/src/activities.ts`

## Process Management

The application uses PM2 for process management. Common commands:

```bash
# View all processes
pm2 list

# View logs
pm2 logs

# Monitor processes
pm2 monit

# Restart specific process
pm2 restart question-time-api
pm2 restart question-time-worker

# View process details
pm2 show question-time-api
```

### Development Mode

For development with auto-reload:

```bash
cd backend
npm run dev
```

This uses nodemon to automatically restart the services when files change.