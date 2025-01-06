import * as wf from '@temporalio/workflow';
import * as activities from './activities';

const {
  getClue,
  validateAnswerAI,
  updateLeaderboard,
} = wf.proxyActivities<typeof activities>({
  startToCloseTimeout: '60s',
});

export const pauseSignal = wf.defineSignal('pause');
export const resumeSignal = wf.defineSignal('resume');
export const submitAnswerUpdate = wf.defineUpdate<
{ success: boolean; message: string }, 
  [{ answer: string }]
>('submitAnswer');

export const getGameStateQuery = wf.defineQuery('getGameState');

export interface GameState {
  currentClue: number;
  paused: boolean;
  completed: boolean;
  player: string;
  lastQuestion: string;
  currentHint: string;
  timeRemaining: number;
  totalClues: number;
  lastAnswerCorrect: boolean | null;
}

export async function questionTimeWorkflow({ player, totalClues }: { player: string, totalClues: number }): Promise<void> {
  const GAME_DURATION_MS = 120000;
  let timeRemaining = GAME_DURATION_MS;

  // Get initial question and hint
  const initialClue = await getClue(1);

  let state: GameState = {
    currentClue: 1,
    paused: false,
    completed: false,
    player,
    lastQuestion: initialClue.question,
    currentHint: initialClue.hint,
    timeRemaining,
    totalClues,
    lastAnswerCorrect: null
  };

  wf.setHandler(pauseSignal, () => {
    state.paused = true;
    console.log('Workflow paused.');
  });

  wf.setHandler(resumeSignal, () => {
    state.paused = false;
    console.log('Workflow resumed.');
  });

  wf.setHandler(submitAnswerUpdate, async ({ answer }) => {
    if (state.paused) {
      return { success: false, message: 'Game is paused' };
    }

    if (state.completed) {
      return { success: false, message: 'Game is completed' };
    }

    const clueData = await getClue(state.currentClue);
    state.lastQuestion = clueData.question;

    const isCorrect = await validateAnswerAI(state.currentClue, clueData.question, answer);
    state.lastAnswerCorrect = isCorrect;

    if (isCorrect) {
      console.log(`Player ${player} answered correctly.`);
      await updateLeaderboard(player, state.currentClue);
      state.currentClue += 1;

      if (state.currentClue > state.totalClues) {
        state.completed = true;
        return { success: true, message: 'Congratulations! You found the treasure.' };
      } else {
        const nextClue = await getClue(state.currentClue);
        state.lastQuestion = nextClue.question;
        state.currentHint = nextClue.hint;
        return { success: true, message: `Correct!` };
      }
    } else {
      return { success: false, message: 'Incorrect answer, try again.' };
    }
  });

  wf.setHandler(getGameStateQuery, () => state);

  // Single deterministic timer loop
  const TICK_INTERVAL = 1000; // 1 second
  while (!state.completed && timeRemaining > 0) {
    await wf.sleep(TICK_INTERVAL);
    if (!state.paused) {
      timeRemaining -= TICK_INTERVAL;
      state.timeRemaining = timeRemaining;
    }
  }

  // Ensure game ends properly
  state.completed = true;
  state.timeRemaining = 0;
  console.log('Game ended');
}

export const updateLeaderboardSignal = wf.defineSignal<[{ player: string; score: number }]>('updateLeaderboard');
export const getLeaderboardQuery = wf.defineQuery<{ player: string; score: number }[]>('getLeaderboard');

interface LeaderBoardEntry {
  player: string;
  score: number;
}

export async function LeaderBoardWorkflow(): Promise<void> {
  let leaderboard: LeaderBoardEntry[] = [];

  wf.setHandler(updateLeaderboardSignal, async (args) => {
    const { player, score } = args;
    const existing = leaderboard.find((entry) => entry.player === player);
    if (existing) {
      existing.score = score;
    } else {
      leaderboard.push({ player, score });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    console.log(`Leaderboard updated: ${JSON.stringify(leaderboard)}`);
  });

  wf.setHandler(getLeaderboardQuery, () => {
    return leaderboard;
  });

  await wf.condition(() => false);
}