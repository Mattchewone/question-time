// backend/src/api.ts
import express from 'express';
import type { Request, Response, Router, RequestHandler } from 'express';
import cors from 'cors';
import { Connection, WorkflowClient, WorkflowHandle } from '@temporalio/client';
import dotenv from 'dotenv';
import type { GameState } from './workflows';
import * as activities from './activities';
import { getTemporalClientOptions } from './utils';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let workflowClient: WorkflowClient;
const QUESTION_WORKFLOW_ID = 'question-time-workflow'; 

const router: Router = express.Router();

async function initTemporalClient() {
  const connection = await Connection.connect(getTemporalClientOptions());

  workflowClient = new WorkflowClient({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE
  });
}

router.post('/start', (async (req: Request, res: Response) => {
  const { player } = req.body;
  const workflowId = `${QUESTION_WORKFLOW_ID}-${player.toLowerCase()}`;
  try {
    let questionHandle: WorkflowHandle | null = null;
    try {
      questionHandle = await workflowClient.getHandle(workflowId);
      const state = await questionHandle.query('getGameState') as GameState;
      if (!state.completed) {
        return res.status(400).json({ message: 'Game already started.' });
      }
    } catch (err) {
    }
    const questionHandleStart = await workflowClient.start('questionTimeWorkflow', {
      workflowId,
      taskQueue: 'question-time-queue',
      args: [{ player, totalQuestions: Object.keys(activities.questions).length }],
      workflowIdReusePolicy: 'ALLOW_DUPLICATE',
    });

    res.status(200).json({ message: 'Question Time Started!', workflowId: questionHandleStart.workflowId });
  } catch (error: any) {
    console.error('Error starting workflow:', error);
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.post('/submit-answer', (async (req: Request, res: Response) => {
  try {
    const { answer, player } = req.body;
    if (!answer || !player) {
      return res.status(400).json({ message: 'Answer and player name are required.' });
    }

    const questionHandle = await workflowClient.getHandle(`${QUESTION_WORKFLOW_ID}-${player.toLowerCase()}`);
    const result = await questionHandle.executeUpdate('submitAnswer', { 
      args: [{ answer }]
    });
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// Pause the game (Admin)
router.post('/pause', (async (req: Request, res: Response) => {
  try {
    const { player } = req.params;
    const questionHandle = await workflowClient.getHandle(`${QUESTION_WORKFLOW_ID}-${player.toLowerCase()}`);
    await questionHandle.signal('pause');
    res.status(200).json({ message: 'Game Paused.' });
  } catch (error: any) {
    console.error('Error pausing game:', error);
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

// Resume the game (Admin)
router.post('/resume', (async (req: Request, res: Response) => {
  try {
    const { player } = req.params;
    const questionHandle = await workflowClient.getHandle(`${QUESTION_WORKFLOW_ID}-${player.toLowerCase()}`);
    await questionHandle.signal('resume');
    res.status(200).json({ message: 'Game Resumed.' });
  } catch (error: any) {
    console.error('Error resuming game:', error);
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.get('/state', (async (req: Request, res: Response) => {
  try {
    const { player } = req.query;

    if (!player || typeof player !== 'string') {
      return res.status(400).json({ message: 'Player name is required as a query parameter.' });
    }
    const questionHandle = await workflowClient.getHandle(`${QUESTION_WORKFLOW_ID}-${player.toLowerCase()}`);
    const state = await questionHandle.query('getGameState');
    res.status(200).json(state);
  } catch (error: any) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

router.get('/leaderboard', (async (req: Request, res: Response) => {
  try {
    const leaderboard = await activities.getLeaderboard();
    res.status(200).json(leaderboard);
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

app.use('/', router);

initTemporalClient()
  .then(() => {
    app.listen(port, () => {
      console.log(`API Server listening at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to Temporal:', error);
    process.exit(1);
  });