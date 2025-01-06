import React, { useState } from 'react';
import { startGame } from '../api';

interface StartGameProps {
  onStart: (playerName: string, workflowId: string) => void;
}

const StartGame: React.FC<StartGameProps> = ({ onStart }) => {
  const [playerName, setPlayerName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleStart = async () => {
    if (!playerName.trim()) {
      setMessage('Please enter your name.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await startGame(playerName);
      setMessage(response.data.message);
      onStart(playerName, response.data.workflowId);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to start the game.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Start Game</h2>
      <div>
        <input
          type="text"
          placeholder="Enter Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>
      <button onClick={handleStart} disabled={loading}>
        {loading ? 'Starting...' : 'Start Game'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default StartGame;