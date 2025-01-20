import * as wf from '@temporalio/workflow';
import * as activities from './activities';

const {
  getQuestion,
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
  currentQuestion: number;
  paused: boolean;
  completed: boolean;
  player: string;
  lastQuestion: string;
  currentHint: string;
  timeRemaining: number;
  totalQuestions: number;
  lastAnswerCorrect: boolean | null;
  answeredQuestionIds: number[];
}

export async function questionTimeWorkflow({ player, totalQuestions }: { player: string, totalQuestions: number }): Promise<void> {
  const GAME_DURATION_MS = 120000;
  let timeRemaining = GAME_DURATION_MS;

  // Get initial random question
  const initialQuestion = await getQuestion([]);

  let state: GameState = {
    currentQuestion: 1,
    paused: false,
    completed: false,
    player,
    lastQuestion: initialQuestion.question,
    currentHint: initialQuestion.hint,
    timeRemaining,
    totalQuestions,
    lastAnswerCorrect: null,
    answeredQuestionIds: [initialQuestion.id]
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

    const questionData = await getQuestion(state.answeredQuestionIds);
    state.lastQuestion = questionData.question;

    const isCorrect = await validateAnswerAI(questionData.id, questionData.question, answer);
    state.lastAnswerCorrect = isCorrect;

    if (isCorrect) {
      console.log(`Player ${player} answered correctly.`);
      await updateLeaderboard(player, state.currentQuestion);
      state.currentQuestion += 1;
      state.answeredQuestionIds.push(questionData.id);

      if (state.currentQuestion > state.totalQuestions) {
        state.completed = true;
        return { success: true, message: 'Congratulations! You completed the quiz.' };
      } else {
        const nextQuestion = await getQuestion(state.answeredQuestionIds);
        state.lastQuestion = nextQuestion.question;
        state.currentHint = nextQuestion.hint;
        state.answeredQuestionIds.push(nextQuestion.id);
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