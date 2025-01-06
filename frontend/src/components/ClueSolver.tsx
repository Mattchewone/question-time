import React, { useState } from 'react';
import { submitAnswer } from '../api';

interface ClueSolverProps {
  playerName: string;
}

const ClueSolver: React.FC<ClueSolverProps> = ({ playerName }) => {
  const [answer, setAnswer] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setMessage('Please enter an answer.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await submitAnswer(answer, playerName);
      setMessage(response.data.message);
      setAnswer('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to submit answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Solve Question</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Answer'}
        </button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
};

export default ClueSolver;