import React from 'react';

export interface GameState {
  currentQuestion: number;
  paused: boolean;
  completed: boolean;
  player: string;
  lastQuestion: string;
  currentHint: string;
  timeRemaining: number;
  lastAnswerCorrect: boolean | null;
  totalQuestions: number;
}

interface GameStatusProps {
  timeLeft: number;
  gameState: GameState | null;
}

const GameStatus: React.FC<GameStatusProps> = ({ timeLeft, gameState }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!gameState) return <p>No game state available.</p>;

  return (
    <div>
      <h2>Game Status</h2>
      <p><strong>Current Question:</strong> {gameState.currentQuestion > gameState.totalQuestions ? 'Completed' : gameState.currentQuestion}</p>
      <p><strong>Time Left:</strong> {formatTime(timeLeft)}</p>
      {gameState.lastQuestion && (
        <div>
          <h3>Current Question:</h3>
          <p>{gameState.lastQuestion}</p>
          {gameState.currentHint && (
            <div>
              <h3 className="hint-label">Hint:</h3>
              <p className="hint-text">{gameState.currentHint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameStatus;