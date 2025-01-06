import React, { useEffect, useState } from 'react';
import GameStatus, { GameState } from './components/GameStatus';
import ClueSolver from './components/ClueSolver';
import StartGame from './components/StartGame';
import Leaderboard from './components/Leaderboard';
import { getGameState } from './api';
import './App.css';

const App: React.FC = () => {
  const [playerName, setPlayerName] = useState<string>('');
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleStartGame = (name: string, id: string) => {
    setPlayerName(name);
    setWorkflowId(id);
    setGameStarted(true);
    setGameEnded(false);
  };

  const handleStartNewGame = () => {
    setGameEnded(false);
    setGameStarted(false);
    setWorkflowId(null);
    setPlayerName('');
    setGameState(null);
    setTimeLeft(0);
  };

  useEffect(() => {
    let syncTimer: NodeJS.Timeout;

    const syncGameState = async () => {
      if (workflowId) {
        try {
          const response = await getGameState(playerName);
          setGameState(response.data);
          const serverTimeLeft = response.data.timeRemaining / 1000;
          if (serverTimeLeft > 0) {
            setTimeLeft(Math.floor(serverTimeLeft));
          } else {
            setTimeLeft(0);
            setGameEnded(true);
            setGameStarted(false);
          }
        } catch (err) {
          console.error('Failed to synchronize game state:', err);
        }
      }
    };

    if (gameStarted) {
      syncTimer = setInterval(syncGameState, 1000);
    }

    return () => clearInterval(syncTimer);
  }, [workflowId, gameStarted, playerName]);

  return (
    <div className="App">
      <h1>Question Time</h1>
      <div className="container">
        <div className="user-section">
        {!gameStarted && !gameEnded && (
          <StartGame onStart={handleStartGame} />
        )}
        {gameStarted && (
          <>
            <GameStatus timeLeft={timeLeft} gameState={gameState} />
            <ClueSolver playerName={playerName} />
          </>
          )}
        {gameEnded && (
          <>
            <h2>Game Over!</h2>
            <p>Thank you for participating, {playerName}!</p>
            <button onClick={handleStartNewGame} className="start-new-game">
              Start New Game
            </button>
          </>
        )}
        <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default App;